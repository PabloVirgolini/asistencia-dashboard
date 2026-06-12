import { getDb } from '../db/database.js';
import { config } from '../config.js';
import { getVentanaTurno, parseFichadaStr } from '../utils/turnos.js';

export interface Inconsistencia {
  legajo: string;
  fecha: string;
  tipo: 'Llegada Tarde' | 'Salida Anticipada' | 'Ausencia' | 'Fichada Inesperada' | 'Múltiples Fichadas';
  detalles: string;
}

/**
 * Calcula y persiste las inconsistencias de un día particular.
 * Esta función es idempotente (borra y recalcula).
 */
export function calcularInconsistenciasPorFecha(fechaStr: string) {
  const db = getDb();
  
  // 1. Limpiar inconsistencias previas para esta fecha
  db.prepare('DELETE FROM inconsistencias_calculadas WHERE fecha = ?').run(fechaStr);

  // Obtener Personal
  const personal = db.prepare('SELECT legajo, nombre, sectorPertenencia, cargo_id, es_rotativo FROM personal WHERE activo = 1').all() as any[];
  
  // Obtener Horarios
  const horarios = db.prepare('SELECT * FROM horarios').all() as any[];

  // Obtener Novedades activas
  const novedades = db.prepare(`
    SELECT legajo, tipo, observaciones, fecha_fin 
    FROM novedades_licencias 
    WHERE fecha_inicio <= ? AND fecha_fin >= ?
  `).all(fechaStr, fechaStr) as any[];
  
  const novedadesMap = new Map();
  novedades.forEach(n => novedadesMap.set(n.legajo, n));
  
  
  const jsDate = new Date(`${fechaStr}T12:00:00`); // Usar mediodía para evitar problemas de timezone
  const diaSemana = jsDate.getDay(); // 0 = Domingo, 1 = Lunes...

  const jsYesterday = new Date(jsDate.getTime() - 86400000);
  const yesterdayStr = jsYesterday.toISOString().split('T')[0];
  const yesterdayDiaSemana = jsYesterday.getDay();

  // Historiales para hoy y ayer
  const historialHoy = db.prepare(`SELECT legajo, id_turno FROM historial_turnos WHERE fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?) ORDER BY (julianday(COALESCE(fecha_fin, '2099-12-31')) - julianday(fecha_inicio)) DESC`).all(fechaStr, fechaStr) as any[];
  const historialAyer = db.prepare(`SELECT legajo, id_turno FROM historial_turnos WHERE fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?) ORDER BY (julianday(COALESCE(fecha_fin, '2099-12-31')) - julianday(fecha_inicio)) DESC`).all(yesterdayStr, yesterdayStr) as any[];

  const historialHoyMap = new Map();
  historialHoy.forEach(h => historialHoyMap.set(h.legajo, h.id_turno));
  
  const historialAyerMap = new Map();
  historialAyer.forEach(h => historialAyerMap.set(h.legajo, h.id_turno));

  // Ventana de búsqueda extendida para cruces
  const windowStart = `${yesterdayStr} 12:00:00`;
  const nextDay = new Date(jsDate.getTime() + 86400000).toISOString().split('T')[0];
  const windowEnd = `${nextDay} 12:00:00`;

  const fichadasStmt = db.prepare(
    `SELECT legajo, hora FROM fichadas WHERE hora >= ? AND hora <= ? ORDER BY hora ASC`
  );
  const fichadasRaw = fichadasStmt.all(windowStart, windowEnd) as {legajo: string, hora: string}[];

  const fichadasMap = new Map<string, string[]>();
  fichadasRaw.forEach(f => {
    // Normalizar legajo si es numérico en la DB de fichadas
    const legajoReal = personal.find(p => p.legajo === f.legajo || f.legajo.endsWith(p.legajo))?.legajo;
    if (!legajoReal) return;
    if (!fichadasMap.has(legajoReal)) fichadasMap.set(legajoReal, []);
    fichadasMap.get(legajoReal)!.push(f.hora);
  });

  const inconsistencias: Inconsistencia[] = [];

  personal.forEach(p => {
    // Helper
    const getReglaParaDia = (dSemana: number, hMap: Map<string, number>) => {
      let t_id: number | null = null;
      if (p.es_rotativo === 1 || p.es_rotativo === '1') {
        t_id = hMap.get(p.legajo) || null;
      } else {
        const matchingDia = horarios.filter(h => h.dia_semana === dSemana);
        const exc = matchingDia.find(h => h.legajo === p.legajo);
        if (exc) { t_id = exc.id_turno; } 
        else {
          const matching = matchingDia.filter(h => h.id_sector == p.sectorPertenencia && (h.id_cargo == p.cargo_id || h.id_cargo === null));
          if (matching.length > 0) t_id = matching[0].id_turno;
        }
      }
      const hs = horarios.filter(h => h.id_turno === t_id && h.dia_semana === dSemana);
      let r = hs.find(h => h.legajo === p.legajo);
      if (!r) r = hs.find(h => h.id_sector == p.sectorPertenencia && (h.id_cargo == p.cargo_id || h.id_cargo === null));
      return { id_turno: t_id, regla: r };
    };

    const hoy = getReglaParaDia(diaSemana, historialHoyMap);
    const ayer = getReglaParaDia(yesterdayDiaSemana, historialAyerMap);

    const tieneNovedad = novedadesMap.has(p.legajo);
    const susFichadasAll = fichadasMap.get(p.legajo) || [];

    let ventanaHoy = hoy.regla ? getVentanaTurno(fechaStr, hoy.regla) : null;
    let ventanaAyer = ayer.regla ? getVentanaTurno(yesterdayStr, ayer.regla) : null;

    let fichadasHoy: string[] = [];
    let fichadasInesperadasHoy: string[] = [];

    susFichadasAll.forEach(fStr => {
      const fDate = parseFichadaStr(fStr);
      
      if (ventanaAyer && fDate >= ventanaAyer.windowStartTurno && fDate <= ventanaAyer.windowEndTurno) {
        return; // Absorbida ayer
      }

      if (ventanaHoy && fDate >= ventanaHoy.windowStartTurno && fDate <= ventanaHoy.windowEndTurno) {
        fichadasHoy.push(fStr);
        return;
      }

      if (fStr.startsWith(fechaStr)) {
        fichadasInesperadasHoy.push(fStr);
      }
    });

    if (!hoy.regla) {
      if (fichadasInesperadasHoy.length > 0 && !tieneNovedad) {
        inconsistencias.push({
          legajo: p.legajo,
          fecha: fechaStr,
          tipo: 'Fichada Inesperada',
          detalles: `Fichó ${fichadasInesperadasHoy.length} veces en un día sin turno asignado.`
        });
      }
      return;
    }

    const fichadasDelTurno = fichadasHoy;

    if (fichadasDelTurno.length === 0) {
      if (!tieneNovedad) {
        inconsistencias.push({
          legajo: p.legajo,
          fecha: fechaStr,
          tipo: 'Ausencia',
          detalles: `No registra fichadas para su turno de ${hoy.regla.hora_entrada} a ${hoy.regla.hora_salida || '?'}.`
        });
      }
      return;
    }

    // Evaluaciones
    const firstFichadaStr = fichadasDelTurno[0];
    const lastFichadaStr = fichadasDelTurno[fichadasDelTurno.length - 1];

    // Fichadas Múltiples (Incompletas / Impar -> Inesperadas según el usuario)
    if (fichadasDelTurno.length % 2 !== 0 && fichadasDelTurno.length > 1) {
      inconsistencias.push({
        legajo: p.legajo,
        fecha: fechaStr,
        tipo: 'Múltiples Fichadas',
        detalles: `Cantidad impar de fichadas (${fichadasDelTurno.length}). Posible doble marcación.`
      });
    }

    // Llegada Tarde
    const actualEntrada = parseFichadaStr(firstFichadaStr);
    const limiteTarde = new Date(ventanaHoy!.expectedEntrada.getTime() + config.toleranciaLlegadaTardeDefault * 60000);

    if (actualEntrada > limiteTarde) {
      inconsistencias.push({
        legajo: p.legajo,
        fecha: fechaStr,
        tipo: 'Llegada Tarde',
        detalles: `Debía ingresar a las ${hoy.regla.hora_entrada}. Fichó a las ${firstFichadaStr.split(' ')[1].substring(0, 5)}.`
      });
    }

    // Salida Anticipada
    if (ventanaHoy!.expectedSalida && fichadasDelTurno.length > 1) { // Necesita al menos entrada y salida
      const actualSalida = parseFichadaStr(lastFichadaStr);

      // Usamos estricto 0 tolerancia
      if (actualSalida < ventanaHoy!.expectedSalida) {
        inconsistencias.push({
          legajo: p.legajo,
          fecha: fechaStr,
          tipo: 'Salida Anticipada',
          detalles: `Debía salir a las ${hoy.regla.hora_salida}. Fichó salida a las ${lastFichadaStr.split(' ')[1].substring(0, 5)}.`
        });
      }
    }
  });

  // Guardar en Base de Datos
  if (inconsistencias.length > 0) {
    const insertStmt = db.prepare(
      `INSERT INTO inconsistencias_calculadas (legajo, fecha, tipo, detalles) VALUES (?, ?, ?, ?)`
    );
    const transaction = db.transaction((incs: Inconsistencia[]) => {
      incs.forEach(inc => {
        insertStmt.run(inc.legajo, inc.fecha, inc.tipo, inc.detalles);
      });
    });
    transaction(inconsistencias);
  }
}

export function getInconsistenciasPorFecha(fechaStr: string) {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT * FROM inconsistencias_calculadas WHERE fecha = ?`
  );
  return stmt.all(fechaStr) as any[];
}
