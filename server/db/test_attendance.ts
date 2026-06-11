import { getDb } from './database';
import { calcularLlegadaTarde } from '../utils/calculadoraTardanzas';

export interface AttendancePerson {
  legajo: string;
  nombre: string;
  sector: string;
  cargo: string;
  nivel_criticidad: number;
  es_rotativo: boolean;
  id_turno: number | null; // El turno al que pertenece
  fichadas: string[]; // Lista de horas de fichada
  llegadaTarde: boolean;
  novedad_activa: { tipo: string; observaciones: string } | null;
}

export interface TurnoGroup {
  id_turno: number | null;
  nombre_turno: string;
  esperados: number;
  presentes: AttendancePerson[];
  ausentes: AttendancePerson[];
  licencias: AttendancePerson[];
  tarde: AttendancePerson[];
  fichadas_inesperadas: AttendancePerson[]; // Presentes pero sin turno asignado
}

export function getAttendanceGroupedByTurno(date: string, sector?: string, toleranciaMinutos: number = 0): TurnoGroup[] {
  const db = getDb();
  
  const jsDate = new Date(date + 'T00:00:00');
  const dayOfWeek = jsDate.getDay(); // 0 a 6
  const startOfDay = `${date} 00:00:00`;
  const endOfDay = `${date} 23:59:59`;

  // 1. Obtener todo el personal activo
  let queryPersonal = `
    SELECT 
      p.legajo, p.nombre, p.es_rotativo, p.sectorPertenencia, p.cargo_id,
      s.descripcion as sector, c.descripcion as cargo, sc.nivel_criticidad
    FROM personal p
    LEFT JOIN sectores s ON p.sectorPertenencia = s.idSector
    LEFT JOIN cargos c ON p.cargo_id = c.id_cargo
    LEFT JOIN sectores_cargos sc ON sc.id_cargo = c.id_cargo AND sc.id_sector = p.sectorPertenencia
    WHERE p.activo = 1
  `;
  const paramsPersonal: any[] = [];
  if (sector && sector !== 'todos') {
    queryPersonal += ` AND p.sectorPertenencia = ?`;
    paramsPersonal.push(sector);
  }
  
  const personal = db.prepare(queryPersonal).all(...paramsPersonal) as any[];

  // 2. Obtener Historial de Turnos (para rotativos) que solapen la fecha
  const historialTurnos = db.prepare(`
    SELECT legajo, id_turno 
    FROM historial_turnos 
    WHERE fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?)
  `).all(date, date) as any[];

  // 3. Obtener Horarios base (para no rotativos y cálculo de llegadas tarde)
  const horarios = db.prepare(`SELECT * FROM horarios WHERE dia_semana = ?`).all(dayOfWeek) as any[];

  // 4. Obtener Novedades (Licencias)
  const novedades = db.prepare(`
    SELECT legajo, tipo, observaciones 
    FROM novedades_licencias 
    WHERE fecha_inicio <= ? AND fecha_fin >= ?
  `).all(date, date) as any[];

  // 5. Obtener Fichadas
  const fichadas = db.prepare(`
    SELECT legajo, hora 
    FROM fichadas 
    WHERE hora >= ? AND hora <= ?
    ORDER BY hora ASC
  `).all(startOfDay, endOfDay) as any[];

  // Diccionarios para acceso rápido
  const turnosDict = db.prepare(`SELECT id_turno, descripcion FROM turnos_horarios`).all() as any[];
  const turnosMap = new Map(turnosDict.map(t => [t.id_turno, t.descripcion]));

  const historialMap = new Map(historialTurnos.map(h => [h.legajo, h.id_turno]));
  
  const novedadesMap = new Map();
  novedades.forEach(n => {
    novedadesMap.set(n.legajo, { tipo: n.tipo, observaciones: n.observaciones });
  });

  const fichadasMap = new Map<string, string[]>();
  fichadas.forEach(f => {
    if (!fichadasMap.has(f.legajo)) fichadasMap.set(f.legajo, []);
    fichadasMap.get(f.legajo)!.push(f.hora);
  });

  // Procesar cada empleado
  const procesados: AttendancePerson[] = personal.map(p => {
    let id_turno: number | null = null;

    if (p.es_rotativo) {
      // Rotativo: Sacar del historial de turnos
      id_turno = historialMap.get(p.legajo) || null;
    } else {
      // Fijo: Inferir desde su regla general (Sector + Cargo)
      // Buscamos si hay un horario específico para su sector y cargo
      const matchingHorarios = horarios.filter(h => 
        h.sector_id === p.sectorPertenencia && 
        (h.cargo_id === p.cargo_id || h.cargo_id === null)
      );
      if (matchingHorarios.length > 0) {
        // Tomamos el primer turno configurado
        id_turno = matchingHorarios[0].id_turno;
      }
    }

    const susFichadas = fichadasMap.get(p.legajo) || [];
    let llegadaTarde = false;

    if (id_turno !== null && susFichadas.length > 0) {
      const susHorarios = horarios.filter(h => h.id_turno === id_turno);
      llegadaTarde = calcularLlegadaTarde(
        { legajo: p.legajo, sectorPertenencia: p.sectorPertenencia, cargo_id: p.cargo_id, primeraFichada: susFichadas[0] },
        susHorarios,
        new Date(jsDate),
        toleranciaMinutos
      );
    }

    return {
      legajo: p.legajo,
      nombre: p.nombre,
      sector: p.sector || 'Sin Sector',
      cargo: p.cargo || 'Sin Cargo',
      nivel_criticidad: p.nivel_criticidad || 0,
      es_rotativo: p.es_rotativo === 1,
      id_turno,
      fichadas: susFichadas,
      llegadaTarde,
      novedad_activa: novedadesMap.get(p.legajo) || null
    };
  });

  // Agrupar por Turno
  const gruposMap = new Map<number | null, TurnoGroup>();

  // Inicializar grupos base (incluyendo Sin Turno)
  gruposMap.set(null, {
    id_turno: null,
    nombre_turno: 'Fuera de Turno / Inesperados',
    esperados: 0,
    presentes: [],
    ausentes: [],
    licencias: [],
    tarde: [],
    fichadas_inesperadas: []
  });

  turnosDict.forEach(t => {
    gruposMap.set(t.id_turno, {
      id_turno: t.id_turno,
      nombre_turno: t.descripcion,
      esperados: 0,
      presentes: [],
      ausentes: [],
      licencias: [],
      tarde: [],
      fichadas_inesperadas: []
    });
  });

  procesados.forEach(p => {
    const group = gruposMap.get(p.id_turno) || gruposMap.get(null)!;
    
    if (p.id_turno !== null) {
      group.esperados += 1;
      
      if (p.fichadas.length > 0) {
        group.presentes.push(p);
        if (p.llegadaTarde) {
          group.tarde.push(p);
        }
      } else if (p.novedad_activa) {
        group.licencias.push(p);
      } else {
        group.ausentes.push(p);
      }
    } else {
      // Fuera de Turno
      if (p.fichadas.length > 0) {
        group.fichadas_inesperadas.push(p);
      }
    }
  });

  // Filtrar grupos que no tienen a nadie
  const result = Array.from(gruposMap.values()).filter(g => 
    g.esperados > 0 || g.fichadas_inesperadas.length > 0
  );

  return result;
}
