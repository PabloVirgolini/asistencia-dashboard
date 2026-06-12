import { getDb } from '../db/database.js';
import { config } from '../config.js';

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
  
  // Obtener Historial de Turnos activos
  const historialTurnos = db.prepare(`
    SELECT legajo, id_turno 
    FROM historial_turnos 
    WHERE fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?)
  `).all(fechaStr, fechaStr) as any[];

  // Obtener Novedades activas
  const novedades = db.prepare(`
    SELECT legajo, tipo, observaciones, fecha_fin 
    FROM novedades_licencias 
    WHERE fecha_inicio <= ? AND fecha_fin >= ?
  `).all(fechaStr, fechaStr) as any[];
  
  const novedadesMap = new Map();
  novedades.forEach(n => novedadesMap.set(n.legajo, n));

  const historialMap = new Map();
  historialTurnos.forEach(h => historialMap.set(h.legajo, h.id_turno));

  // Ventana de búsqueda: Desde las 00:00 del día hasta las 12:00 del día siguiente (para cubrir nocturnos)
  const windowStart = `${fechaStr} 00:00:00`;
  const nextDay = new Date(new Date(fechaStr).getTime() + 86400000).toISOString().split('T')[0];
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

  const jsDate = new Date(`${fechaStr}T12:00:00`); // Usar mediodía para evitar problemas de timezone
  const diaSemana = jsDate.getDay(); // 0 = Domingo, 1 = Lunes...

  personal.forEach(p => {
    // Determinar qué turno le corresponde hoy
    let id_turno: number | null = null;
    if (p.es_rotativo === 1 || p.es_rotativo === '1') {
      id_turno = historialMap.get(p.legajo) || null;
    } else {
      const match = horarios.find(h => 
        h.sector_id === p.sectorPertenencia && 
        (h.cargo_id === p.cargo_id || h.cargo_id === null) &&
        h.dia_semana === diaSemana
      );
      if (match) id_turno = match.id_turno;
    }

    const susHorarios = horarios.filter(h => h.id_turno === id_turno && h.dia_semana === diaSemana);
    
    // Si hay horarios generales y hay excepción por legajo, priorizar excepción
    let reglaHoraria = susHorarios.find(h => h.legajo === p.legajo);
    if (!reglaHoraria) {
      reglaHoraria = susHorarios.find(h => h.sector_id === p.sectorPertenencia && (h.cargo_id === p.cargo_id || h.cargo_id === null));
    }

    const tieneNovedad = novedadesMap.has(p.legajo);
    const susFichadasAll = fichadasMap.get(p.legajo) || [];

    if (!reglaHoraria) {
      // No tiene turno esperado hoy.
      // Si hay fichadas, pero son estrictamente del 'fechaStr' (no del día siguiente), es inesperada
      const fichadasHoy = susFichadasAll.filter(f => f.startsWith(fechaStr));
      if (fichadasHoy.length > 0 && !tieneNovedad) {
        inconsistencias.push({
          legajo: p.legajo,
          fecha: fechaStr,
          tipo: 'Fichada Inesperada',
          detalles: `Fichó ${fichadasHoy.length} veces en un día sin turno asignado.`
        });
      }
      return;
    }

    // Tiene turno. Veamos su ventana teórica
    const horaEntradaStr = reglaHoraria.hora_entrada; // "22:00"
    const horaSalidaStr = reglaHoraria.hora_salida;   // "06:00" o nulo

    if (!horaEntradaStr) return; // Regla mal armada

    // Convertir a Date objects
    const [hE, mE] = horaEntradaStr.split(':').map(Number);
    const expectedEntrada = new Date(jsDate);
    expectedEntrada.setHours(hE, mE, 0, 0);

    let expectedSalida: Date | null = null;
    let cruzaMedianoche = false;

    if (horaSalidaStr) {
      const [hS, mS] = horaSalidaStr.split(':').map(Number);
      expectedSalida = new Date(jsDate);
      expectedSalida.setHours(hS, mS, 0, 0);

      if (expectedSalida < expectedEntrada) {
        expectedSalida.setDate(expectedSalida.getDate() + 1);
        cruzaMedianoche = true;
      }
    }

    // Filtrar susFichadasAll para tomar solo las que caigan "cerca" de este turno
    // Ejemplo: desde Entrada - 4 hs hasta Salida + 4hs
    const windowStartTurno = new Date(expectedEntrada.getTime() - 4 * 3600000);
    const windowEndTurno = expectedSalida ? new Date(expectedSalida.getTime() + 4 * 3600000) : new Date(expectedEntrada.getTime() + 16 * 3600000);

    const fichadasDelTurno = susFichadasAll.filter(fStr => {
      // fStr formato: "YYYY-MM-DD HH:MM:SS"
      const [fd, ft] = fStr.split(' ');
      const [y, m, d] = fd.split('-').map(Number);
      const [H, M, S] = ft.split(':').map(Number);
      const fDate = new Date(y, m - 1, d, H, M, S);
      return fDate >= windowStartTurno && fDate <= windowEndTurno;
    });

    if (fichadasDelTurno.length === 0) {
      if (!tieneNovedad) {
        inconsistencias.push({
          legajo: p.legajo,
          fecha: fechaStr,
          tipo: 'Ausencia',
          detalles: `No registra fichadas para su turno de ${horaEntradaStr} a ${horaSalidaStr || '?'}.`
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
    const [fd, ft] = firstFichadaStr.split(' ');
    const [H, M, S] = ft.split(':').map(Number);
    const actualEntrada = new Date(jsDate);
    if (cruzaMedianoche && fd === nextDay) {
      actualEntrada.setDate(actualEntrada.getDate() + 1);
    }
    actualEntrada.setHours(H, M, S, 0);

    const limiteTarde = new Date(expectedEntrada.getTime() + config.toleranciaLlegadaTardeDefault * 60000);

    if (actualEntrada > limiteTarde) {
      inconsistencias.push({
        legajo: p.legajo,
        fecha: fechaStr,
        tipo: 'Llegada Tarde',
        detalles: `Debía ingresar a las ${horaEntradaStr}. Fichó a las ${ft.substring(0, 5)}.`
      });
    }

    // Salida Anticipada
    if (expectedSalida && fichadasDelTurno.length > 1) { // Necesita al menos entrada y salida
      const [ld, lt] = lastFichadaStr.split(' ');
      const [lH, lM, lS] = lt.split(':').map(Number);
      const actualSalida = new Date(jsDate);
      if (cruzaMedianoche && ld === nextDay) {
        actualSalida.setDate(actualSalida.getDate() + 1);
      }
      actualSalida.setHours(lH, lM, lS, 0);

      // Usamos estricto 0 tolerancia
      if (actualSalida < expectedSalida) {
        inconsistencias.push({
          legajo: p.legajo,
          fecha: fechaStr,
          tipo: 'Salida Anticipada',
          detalles: `Debía salir a las ${horaSalidaStr}. Fichó salida a las ${lt.substring(0, 5)}.`
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
