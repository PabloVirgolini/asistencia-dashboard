/**
 * @module AsistenciaService
 * @description
 * Servicio encargado de gestionar las fichadas, calcular tardanzas, y proveer
 * los reportes de presentes, ausentes y el resumen de métricas diarias.
 */
import { getDb } from '../db/database';
import { calcularLlegadaTarde } from '../utils/calculadoraTardanzas';

export interface FichadaRecord {
  nroFichada: number;
  reloj: string;
  hora: string;
  legajo: string;
  fichadaRepetida: number;
}

export interface AttendanceRecord {
  legajo: string;
  nombre: string;
  sector: string;
  cargo: string;
  nivel_criticidad: number;
  primeraFichada: string;
  llegadaTarde?: boolean;
}

export interface AbsenceRecord {
  legajo: string;
  nombre: string;
  sector: string;
  cargo: string;
  nivel_criticidad: number;
}

export interface AttendanceSummary {
  totalActivos: number;
  presentes: number;
  ausentes: number;
  porcentajePresentes: number;
  porcentajeAusentes: number;
}

/**
 * Obtiene las fichadas de un día específico
 */
export function getFichadasByDate(date: string): FichadaRecord[] {
  const db = getDb();
  // date debe estar en formato YYYY-MM-DD
  const stmt = db.prepare(
    'SELECT nroFichada, reloj, hora, legajo, fichadaRepetida FROM fichadas WHERE hora >= ? AND hora < ? ORDER BY hora ASC'
  );
  const startOfDay = `${date} 00:00:00`;
  const endOfDay = `${date} 23:59:59`;
  return stmt.all(startOfDay, endOfDay) as FichadaRecord[];
}

/**
 * Obtiene las personas presentes en un día específico
 */
export function getPresentesByDate(date: string, sector?: string, toleranciaMinutos: number = 0): AttendanceRecord[] {
  const db = getDb();
  
  let query = `
    SELECT
      p.legajo,
      p.nombre,
      s.descripcion as sector,
      c.descripcion as cargo,
      sc.nivel_criticidad,
      p.sectorPertenencia,
      p.cargo_id,
      ht.id_turno,
      MIN(f.hora) as primeraFichada
    FROM personal p
    INNER JOIN fichadas f ON CAST(p.legajo AS INTEGER) = CAST(f.legajo AS INTEGER)
    LEFT JOIN sectores s ON p.sectorPertenencia = s.idSector
    LEFT JOIN cargos c ON p.cargo_id = c.id_cargo
    LEFT JOIN sectores_cargos sc ON sc.id_cargo = c.id_cargo AND sc.id_sector = p.sectorPertenencia
    LEFT JOIN historial_turnos ht ON ht.legajo = p.legajo AND ht.fecha_inicio <= ? AND (ht.fecha_fin IS NULL OR ht.fecha_fin >= ?)
    WHERE p.activo = 1 
      AND f.hora >= ? 
      AND f.hora < ?
      ${sector && sector !== 'todos' ? 'AND p.sectorPertenencia = ?' : ''}
    GROUP BY p.legajo, p.nombre, s.descripcion, c.descripcion, sc.nivel_criticidad, p.sectorPertenencia, p.cargo_id, ht.id_turno
    ORDER BY primeraFichada ASC`;
  
  const startOfDay = `${date} 00:00:00`;
  const endOfDay = `${date} 23:59:59`;
  const jsDate = new Date(date + 'T00:00:00');
  const dayOfWeek = jsDate.getDay(); // 0 a 6
  
  const stmt = db.prepare(query);
  const queryParams = [date, date, startOfDay, endOfDay];
  if (sector && sector !== 'todos') {
    queryParams.push(sector);
  }

  const records = stmt.all(...queryParams) as any[];

  // Traer todos los horarios del día en una sola consulta para evitar N queries
  const horariosStmt = db.prepare('SELECT * FROM horarios WHERE dia_semana = ?');
  const horariosDelDia = horariosStmt.all(dayOfWeek);

  return records.map(r => {
    let llegadaTarde = false;
    if (r.id_turno) {
      const matchingHorarios = horariosDelDia.filter((h: any) => h.id_turno === r.id_turno);
      if (r.primeraFichada) {
        llegadaTarde = calcularLlegadaTarde(
          {
            legajo: r.legajo,
            sectorPertenencia: r.sectorPertenencia,
            cargo_id: r.cargo_id,
            primeraFichada: r.primeraFichada
          },
          matchingHorarios as any[],
          new Date(jsDate),
          toleranciaMinutos
        );
      }
    }
    return {
      legajo: r.legajo,
      nombre: r.nombre,
      sector: r.sector,
      cargo: r.cargo,
      nivel_criticidad: r.nivel_criticidad,
      primeraFichada: r.primeraFichada,
      llegadaTarde
    };
  });
}

/**
 * Obtiene las personas ausentes en un día específico
 */
export function getAusentesByDate(date: string, sector?: string): AbsenceRecord[] {
  const db = getDb();
  
  let query = `
    SELECT
      p.legajo,
      p.nombre,
      s.descripcion as sector,
      c.descripcion as cargo,
      sc.nivel_criticidad
    FROM personal p
    LEFT JOIN sectores s ON p.sectorPertenencia = s.idSector
    LEFT JOIN cargos c ON p.cargo_id = c.id_cargo
    LEFT JOIN sectores_cargos sc ON sc.id_cargo = c.id_cargo AND sc.id_sector = p.sectorPertenencia
    WHERE p.activo = 1
      AND p.legajo NOT IN (
        SELECT CAST(legajo AS INTEGER) 
        FROM fichadas 
        WHERE hora >= ? AND hora < ?
      )
      ${sector && sector !== 'todos' ? 'AND p.sectorPertenencia = ?' : ''}
    ORDER BY p.nombre ASC`;
  
  const startOfDay = `${date} 00:00:00`;
  const endOfDay = `${date} 23:59:59`;
  
  const stmt = db.prepare(query);
  const queryParams = [startOfDay, endOfDay];
  if (sector && sector !== 'todos') {
    queryParams.push(sector);
  }
  
  return stmt.all(...queryParams) as AbsenceRecord[];
}

/**
 * Obtiene el resumen de asistencia para el dashboard
 */
export function getAttendanceSummary(date: string): AttendanceSummary {
  const db = getDb();
  const startOfDay = `${date} 00:00:00`;
  const endOfDay = `${date} 23:59:59`;

  const stmtActivos = db.prepare('SELECT COUNT(*) as count FROM personal WHERE activo = 1');
  const totalActivos = (stmtActivos.get() as { count: number }).count;

  const stmtPresentes = db.prepare(`
    SELECT COUNT(DISTINCT CAST(f.legajo AS INTEGER)) as count 
    FROM fichadas f
    INNER JOIN personal p ON CAST(p.legajo AS INTEGER) = CAST(f.legajo AS INTEGER)
    WHERE f.hora >= ? AND f.hora < ? AND p.activo = 1
  `);
  const presentes = (stmtPresentes.get(startOfDay, endOfDay) as { count: number }).count;

  const ausentes = totalActivos - presentes;
  const porcentajePresentes = totalActivos > 0 ? Math.round((presentes / totalActivos) * 100) : 0;
  const porcentajeAusentes = totalActivos > 0 ? 100 - porcentajePresentes : 0;

  return {
    totalActivos,
    presentes,
    ausentes,
    porcentajePresentes,
    porcentajeAusentes
  };
}
