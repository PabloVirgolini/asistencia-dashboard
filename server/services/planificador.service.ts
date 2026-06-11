/**
 * @module PlanificadorService
 * @description
 * Servicio encargado del Planificador Semanal Ágil. Se encarga de proveer 
 * el listado de personal disponible y persistir las asignaciones masivas de turnos y excepciones.
 */
import { getDb } from '../db/database';

export interface PersonaPlanificable {
  legajo: string;
  nombre: string;
  cargo: string;
  novedad_activa: {
    tipo: string;
    observaciones: string;
  } | null;
}

export function getPersonalPlanificable(sector: string, fecha_inicio: string, fecha_fin: string): PersonaPlanificable[] {
  const db = getDb();
  
  // Obtenemos al personal activo y rotativo del sector
  const queryPersonal = `
    SELECT p.legajo, p.nombre, c.descripcion as cargo
    FROM personal p
    LEFT JOIN cargos c ON p.cargo_id = c.id_cargo
    WHERE p.activo = 1 AND p.es_rotativo = 1 AND p.sectorPertenencia = ?
    ORDER BY p.nombre ASC
  `;
  const personal = db.prepare(queryPersonal).all(sector) as any[];

  // Obtenemos las novedades que se solapan con este rango de fechas
  const queryNovedades = `
    SELECT legajo, tipo, observaciones
    FROM novedades_licencias
    WHERE legajo IN (${personal.map(() => '?').join(',')})
      AND (
        (fecha_inicio <= ? AND fecha_fin >= ?) OR
        (fecha_inicio <= ? AND fecha_fin >= ?) OR
        (fecha_inicio >= ? AND fecha_fin <= ?)
      )
  `;
  
  let novedadesMap: Record<string, any> = {};
  if (personal.length > 0) {
    const legajos = personal.map(p => p.legajo);
    const params = [...legajos, fecha_fin, fecha_inicio, fecha_fin, fecha_inicio, fecha_inicio, fecha_fin];
    const novedades = db.prepare(queryNovedades).all(...params) as any[];
    
    for (const n of novedades) {
      novedadesMap[n.legajo] = { tipo: n.tipo, observaciones: n.observaciones };
    }
  }

  return personal.map(p => ({
    legajo: p.legajo,
    nombre: p.nombre,
    cargo: p.cargo || 'Operario',
    novedad_activa: novedadesMap[p.legajo] || null
  }));
}

export function savePlanificacionMasiva(asignaciones: { legajo: string, id_turno: number | null, fecha_inicio: string, fecha_fin: string, es_excepcional?: number, hora_entrada_excepcional?: string, hora_salida_excepcional?: string, id_sector_excepcional?: number }[]): void {
  const db = getDb();
  
  // Realizar inserción en lote (Transaction)
  const insert = db.transaction((asignacionesList) => {
    const stmt = db.prepare('INSERT INTO historial_turnos (legajo, id_turno, fecha_inicio, fecha_fin, es_excepcional, hora_entrada_excepcional, hora_salida_excepcional, id_sector_excepcional) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    
    for (const asig of asignacionesList) {
      // 1. Borrar cualquier planificación previa que este empleado pudiera tener en estas fechas para no duplicar
      db.prepare(`
        DELETE FROM historial_turnos 
        WHERE legajo = ? AND fecha_inicio = ? AND fecha_fin = ?
      `).run(asig.legajo, asig.fecha_inicio, asig.fecha_fin);

      // 2. Insertar la nueva
      stmt.run(
        asig.legajo, 
        asig.id_turno, 
        asig.fecha_inicio, 
        asig.fecha_fin, 
        asig.es_excepcional || 0, 
        asig.hora_entrada_excepcional || null, 
        asig.hora_salida_excepcional || null, 
        asig.id_sector_excepcional || null
      );
    }
  });

  insert(asignaciones);
}
