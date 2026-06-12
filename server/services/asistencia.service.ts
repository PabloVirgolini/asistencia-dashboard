/**
 * @module AsistenciaService
 * @description
 * Servicio encargado de gestionar las fichadas, calcular tardanzas, y proveer
 * los reportes de asistencia agrupados por turnos.
 */
import { getDb } from '../db/database';
import { calcularLlegadaTarde } from '../utils/calculadoraTardanzas';
import { getVentanaTurno, parseFichadaStr } from '../utils/turnos';

export interface FichadaRecord {
  nroFichada: number;
  reloj: string;
  hora: string;
  legajo: string;
  fichadaRepetida: number;
}

export interface AttendancePerson {
  legajo: string;
  nombre: string;
  sector: string;
  cargo: string;
  nivel_criticidad: number;
  es_rotativo: boolean;
  id_turno: number | null;
  fichadas: string[];
  llegadaTarde: boolean;
  novedad_activa: { tipo: string; observaciones: string; mostrar_en_dashboard: boolean; fecha_fin: string; } | null;
}

export interface TurnoGroup {
  id_turno: number | null;
  nombre_turno: string;
  esperados: number;
  presentes: AttendancePerson[];
  ausentes: AttendancePerson[];
  licencias: AttendancePerson[];
  tarde: AttendancePerson[];
  fichadas_inesperadas: AttendancePerson[];
}

export interface AttendanceSummary {
  totalActivos: number;
  presentes: number;
  ausentes: number;
  licencias: number;
  porcentajePresentes: number;
  porcentajeAusentes: number;
}

/**
 * Obtiene las fichadas puras de un día específico
 */
export function getFichadasByDate(date: string): FichadaRecord[] {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT nroFichada, reloj, hora, legajo, fichadaRepetida FROM fichadas WHERE hora >= ? AND hora < ? ORDER BY hora ASC'
  );
  const startOfDay = `${date} 00:00:00`;
  const endOfDay = `${date} 23:59:59`;
  return stmt.all(startOfDay, endOfDay) as FichadaRecord[];
}

/**
 * Obtiene todas las fichadas de un empleado específico para los últimos 7 días hasta la fecha seleccionada
 */
export function getFichadasByLegajo(legajo: string, date: string): FichadaRecord[] {
  const db = getDb();
  // Los relojes pueden usar legajo literal o con prefijo (ej. 10411)
  // Buscamos 7 días hacia atrás para tener el historial semanal
  const startOfPeriod = db.prepare("SELECT date(?, '-6 days') as d").get(date) as { d: string };
  const startOfDay = `${startOfPeriod.d} 00:00:00`;
  const endOfDay = `${date} 23:59:59`;

  const stmt = db.prepare(
    `SELECT nroFichada, reloj, hora, legajo, fichadaRepetida 
     FROM fichadas 
     WHERE (legajo = ? OR legajo LIKE ?) AND hora >= ? AND hora <= ? 
     ORDER BY hora ASC`
  );
  
  return stmt.all(legajo, `%${legajo}`, startOfDay, endOfDay) as FichadaRecord[];
}

/**
 * Obtiene la asistencia estructurada y agrupada por Turnos
 */
export interface NovedadCompartida {
  legajo: string;
  nombre: string;
  tipo: string;
  fecha_fin: string;
}

export function getAttendanceGroupedByTurno(date: string, sector?: string, toleranciaMinutos: number = 0): { grupos: TurnoGroup[], summary: AttendanceSummary, novedades_compartidas: NovedadCompartida[] } {
  const db = getDb();
  
  const jsDate = new Date(`${date}T12:00:00`);
  const dayOfWeek = jsDate.getDay();
  
  const jsYesterday = new Date(jsDate.getTime() - 86400000);
  const yesterdayStr = jsYesterday.toISOString().split('T')[0];
  const yesterdayDayOfWeek = jsYesterday.getDay();

  const windowStart = `${yesterdayStr} 12:00:00`;
  const nextDay = new Date(jsDate.getTime() + 86400000).toISOString().split('T')[0];
  const windowEnd = `${nextDay} 12:00:00`;

  // 1. Obtener todo el personal activo
  let queryPersonal = `
    SELECT 
      p.legajo, p.nombre, p.es_rotativo, p.sectorPertenencia, p.cargo_id,
      s.descripcion as sector, c.descripcion as cargo, MAX(sc.nivel_criticidad) as nivel_criticidad
    FROM personal p
    LEFT JOIN sectores s ON p.sectorPertenencia = s.idSector
    LEFT JOIN cargos c ON p.cargo_id = c.id_cargo
    LEFT JOIN sectores_cargos sc ON sc.id_cargo = c.id_cargo AND sc.id_sector = p.sectorPertenencia
    WHERE p.activo = 1
    GROUP BY p.legajo
  `;
  const paramsPersonal: any[] = [];
  if (sector && sector !== 'todos') {
    queryPersonal += ` AND p.sectorPertenencia = ?`;
    paramsPersonal.push(sector);
  }
  
  const personal = db.prepare(queryPersonal).all(...paramsPersonal) as any[];

  // 2. Obtener Historial de Turnos (para rotativos)
  const historialHoy = db.prepare(`SELECT legajo, id_turno FROM historial_turnos WHERE fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?) ORDER BY (julianday(COALESCE(fecha_fin, '2099-12-31')) - julianday(fecha_inicio)) DESC`).all(date, date) as any[];
  const historialAyer = db.prepare(`SELECT legajo, id_turno FROM historial_turnos WHERE fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?) ORDER BY (julianday(COALESCE(fecha_fin, '2099-12-31')) - julianday(fecha_inicio)) DESC`).all(yesterdayStr, yesterdayStr) as any[];

  // 3. Obtener Horarios base
  const horariosAll = db.prepare(`SELECT * FROM horarios`).all() as any[];

  // 4. Obtener Novedades (Licencias)
  const novedades = db.prepare(`
    SELECT legajo, tipo, observaciones, mostrar_en_dashboard, fecha_fin 
    FROM novedades_licencias 
    WHERE fecha_inicio <= ? AND fecha_fin >= ?
  `).all(date, date) as any[];

  // 5. Obtener Fichadas con ventana ampliada para cruces de medianoche
  const fichadas = db.prepare(`
    SELECT legajo, hora 
    FROM fichadas 
    WHERE hora >= ? AND hora <= ?
    ORDER BY hora ASC
  `).all(windowStart, windowEnd) as any[];

  // Diccionarios
  const turnosDict = db.prepare(`SELECT id_turno, descripcion FROM turnos_horarios`).all() as any[];
  
  const historialHoyMap = new Map(historialHoy.map(h => [h.legajo, h.id_turno]));
  const historialAyerMap = new Map(historialAyer.map(h => [h.legajo, h.id_turno]));
  
  const novedadesMap = new Map();
  novedades.forEach(n => {
    novedadesMap.set(n.legajo, { 
      tipo: n.tipo, 
      observaciones: n.observaciones, 
      mostrar_en_dashboard: n.mostrar_en_dashboard === 1,
      fecha_fin: n.fecha_fin
    });
  });

  const fichadasMap = new Map<string, string[]>();
  fichadas.forEach(f => {
    // Los relojes agregan un prefijo (ej. 10 o 20) al legajo, por lo que 411 llega como 10411.
    // Usamos módulo 10000 para extraer el legajo real.
    const fLegajoInt = parseInt(f.legajo, 10);
    const legajoReal = isNaN(fLegajoInt) ? f.legajo : (fLegajoInt % 10000).toString();
    
    if (!fichadasMap.has(legajoReal)) fichadasMap.set(legajoReal, []);
    fichadasMap.get(legajoReal)!.push(f.hora);
  });

  // Procesar cada empleado
  const procesados: AttendancePerson[] = personal.map(p => {
    const legajoStr = p.legajo.toString();
    
    // Función helper para encontrar el turno y regla de un día específico
    const getReglaParaDia = (dSemana: number, hMap: Map<string, number>) => {
      let t_id: number | null = null;
      if (p.es_rotativo === 1 || p.es_rotativo === '1') {
        t_id = hMap.get(legajoStr) || null;
      } else {
        const matchingDia = horariosAll.filter(h => h.dia_semana === dSemana);
        const exc = matchingDia.find(h => h.legajo === legajoStr);
        if (exc) { t_id = exc.id_turno; } 
        else {
          const matching = matchingDia.filter(h => h.id_sector == p.sectorPertenencia && (h.id_cargo == p.cargo_id || h.id_cargo === null));
          if (matching.length > 0) t_id = matching[0].id_turno;
        }
      }
      const hs = horariosAll.filter(h => h.id_turno === t_id && h.dia_semana === dSemana);
      let r = hs.find(h => h.legajo === legajoStr);
      if (!r) r = hs.find(h => h.id_sector == p.sectorPertenencia && (h.id_cargo == p.cargo_id || h.id_cargo === null));
      return { id_turno: t_id, regla: r };
    };

    const hoy = getReglaParaDia(dayOfWeek, historialHoyMap);
    const ayer = getReglaParaDia(yesterdayDayOfWeek, historialAyerMap);

    const susFichadasAll = fichadasMap.get(legajoStr) || [];
    
    let ventanaHoy = hoy.regla ? getVentanaTurno(date, hoy.regla) : null;
    let ventanaAyer = ayer.regla ? getVentanaTurno(yesterdayStr, ayer.regla) : null;

    let fichadasHoy: string[] = [];
    let fichadasInesperadasHoy: string[] = [];

    susFichadasAll.forEach(fStr => {
      const fDate = parseFichadaStr(fStr);
      
      // Pertenece al turno de ayer?
      if (ventanaAyer && fDate >= ventanaAyer.windowStartTurno && fDate <= ventanaAyer.windowEndTurno) {
        return; // Absorbida por el turno de ayer, ignorar para el dashboard de hoy
      }

      // Pertenece al turno de hoy?
      if (ventanaHoy && fDate >= ventanaHoy.windowStartTurno && fDate <= ventanaHoy.windowEndTurno) {
        fichadasHoy.push(fStr);
        return;
      }

      // Si no cae en ninguna ventana, pero es del dia consultado (date), es inesperada
      if (fStr.startsWith(date)) {
        fichadasInesperadasHoy.push(fStr);
      }
    });

    let llegadaTarde = false;
    let id_turno_final = hoy.id_turno;

    if (id_turno_final !== null && fichadasHoy.length > 0) {
      const susHorarios = horariosAll.filter(h => h.id_turno === id_turno_final && h.dia_semana === dayOfWeek);
      llegadaTarde = calcularLlegadaTarde(
        { legajo: legajoStr, sectorPertenencia: p.sectorPertenencia, cargo_id: p.cargo_id, primeraFichada: fichadasHoy[0] },
        susHorarios,
        new Date(jsDate),
        toleranciaMinutos
      );
    }

    return {
      legajo: legajoStr,
      nombre: p.nombre,
      sector: p.sector || 'Sin Sector',
      cargo: p.cargo || 'Sin Cargo',
      nivel_criticidad: p.nivel_criticidad || 0,
      es_rotativo: p.es_rotativo === 1 || p.es_rotativo === '1',
      id_turno: id_turno_final,
      fichadas: fichadasHoy.length > 0 ? fichadasHoy : fichadasInesperadasHoy,
      llegadaTarde,
      novedad_activa: novedadesMap.get(legajoStr) || null
    };
  });

  const gruposMap = new Map<number | null, TurnoGroup>();

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

  let totalPresentes = 0;
  let totalAusentes = 0;
  let totalLicencias = 0;

  procesados.forEach(p => {
    const group = gruposMap.get(p.id_turno) || gruposMap.get(null)!;
    
    if (p.id_turno !== null) {
      group.esperados += 1;
      
      if (p.fichadas.length > 0) {
        if (p.llegadaTarde) {
          group.tarde.push(p);
        } else {
          group.presentes.push(p);
        }
        totalPresentes++;
      } else if (p.novedad_activa) {
        group.licencias.push(p);
        totalLicencias++;
      } else {
        group.ausentes.push(p);
        totalAusentes++;
      }
    } else {
      if (p.fichadas.length > 0) {
        group.fichadas_inesperadas.push(p);
        totalPresentes++;
      }
    }
  });

  const gruposFiltrados = Array.from(gruposMap.values()).filter(g => 
    g.esperados > 0 || g.fichadas_inesperadas.length > 0
  );

  const totalEsperados = procesados.filter(p => p.id_turno !== null).length;
  // We use totalEsperados as the base for percentages
  // However, totalPresentes might include unexpected punches, so percentage might exceed 100% if we don't handle it.
  const presentesEsperados = totalPresentes - gruposMap.get(null)!.fichadas_inesperadas.length;
  
  const porcentajePresentes = totalEsperados > 0 ? Math.round((presentesEsperados / totalEsperados) * 100) : 0;
  const porcentajeAusentes = totalEsperados > 0 ? Math.round((totalAusentes / totalEsperados) * 100) : 0;

  const summary: AttendanceSummary = {
    totalActivos: totalEsperados, // We reuse this field but it now means Total Esperados
    presentes: totalPresentes,
    ausentes: totalAusentes,
    licencias: totalLicencias,
    porcentajePresentes,
    porcentajeAusentes
  };

  const novedades_compartidas: NovedadCompartida[] = [];
  procesados.forEach(p => {
    if (p.novedad_activa && p.novedad_activa.mostrar_en_dashboard) {
      novedades_compartidas.push({
        legajo: p.legajo,
        nombre: p.nombre,
        tipo: p.novedad_activa.tipo,
        fecha_fin: p.novedad_activa.fecha_fin
      });
    }
  });

  return { grupos: gruposFiltrados, summary, novedades_compartidas };
}
