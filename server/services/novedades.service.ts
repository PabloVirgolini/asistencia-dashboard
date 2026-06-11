/**
 * @module NovedadesService
 * @description
 * Servicio encargado de gestionar las novedades (vacaciones, ausencias, ART, francos)
 * para el personal. Provee las altas, bajas y listados de las novedades.
 */
import { getDb } from '../db/database';

export interface NovedadRecord {
  id_novedad: number;
  legajo: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones: string | null;
  nombre_empleado?: string; // Para la UI
}

export function getNovedades(): NovedadRecord[] {
  const db = getDb();
  const query = `
    SELECT 
      n.id_novedad, n.legajo, n.tipo, n.fecha_inicio, n.fecha_fin, n.observaciones,
      p.nombre as nombre_empleado
    FROM novedades_licencias n
    INNER JOIN personal p ON n.legajo = p.legajo
    ORDER BY n.fecha_inicio DESC
  `;
  const stmt = db.prepare(query);
  return stmt.all() as NovedadRecord[];
}

export function insertNovedad(legajo: string, tipo: string, fecha_inicio: string, fecha_fin: string, observaciones?: string): void {
  const db = getDb();
  // Validar solapamientos simples (si empieza antes de que termine otra)
  const checkOverlap = db.prepare(`
    SELECT COUNT(*) as c FROM novedades_licencias 
    WHERE legajo = ? AND (
      (fecha_inicio <= ? AND fecha_fin >= ?) OR
      (fecha_inicio <= ? AND fecha_fin >= ?) OR
      (fecha_inicio >= ? AND fecha_fin <= ?)
    )
  `);
  
  const result = checkOverlap.get(legajo, fecha_fin, fecha_inicio, fecha_fin, fecha_inicio, fecha_inicio, fecha_fin) as { c: number };
  if (result.c > 0) {
    throw new Error('El empleado ya tiene una novedad registrada que se solapa con estas fechas.');
  }

  const stmt = db.prepare(`
    INSERT INTO novedades_licencias (legajo, tipo, fecha_inicio, fecha_fin, observaciones) 
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(legajo, tipo, fecha_inicio, fecha_fin, observaciones || null);
}

export function deleteNovedad(id_novedad: number): void {
  const db = getDb();
  db.prepare('DELETE FROM novedades_licencias WHERE id_novedad = ?').run(id_novedad);
}

export function updateNovedad(id_novedad: number, legajo: string, tipo: string, fecha_inicio: string, fecha_fin: string, observaciones?: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE novedades_licencias 
    SET legajo = ?, tipo = ?, fecha_inicio = ?, fecha_fin = ?, observaciones = ? 
    WHERE id_novedad = ?
  `).run(legajo, tipo, fecha_inicio, fecha_fin, observaciones || null, id_novedad);
}
