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
  enCapacitacion: boolean;
  novedad_activa: {
    tipo: string;
    observaciones: string;
  } | null;
}

export function getPersonalPlanificable(sector: string, fecha_inicio: string, fecha_fin: string): PersonaPlanificable[] {
  const db = getDb();
  
  // Obtenemos al personal activo y rotativo del sector
  const queryPersonal = `
    SELECT p.legajo, p.nombre, p.enCapacitacion, c.descripcion as cargo
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
    enCapacitacion: p.enCapacitacion === '1' || p.enCapacitacion === 1,
    novedad_activa: novedadesMap[p.legajo] || null
  }));
}

export function savePlanificacionMasiva(asignaciones: { legajo: string, id_turno: number | null, fecha_inicio: string, fecha_fin: string, es_excepcional?: number | null, hora_entrada_excepcional?: string | null, hora_salida_excepcional?: string | null, id_sector_excepcional?: number | null, nombre_plan?: string | null }[]): void {
  const db = getDb();
  
  // Realizar inserción en lote (Transaction)
  const insert = db.transaction((asignacionesList) => {
    const stmt = db.prepare('INSERT INTO historial_turnos (legajo, id_turno, fecha_inicio, fecha_fin, es_excepcional, hora_entrada_excepcional, hora_salida_excepcional, id_sector_excepcional, nombre_plan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    
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
        asig.id_sector_excepcional || null,
        asig.nombre_plan || null
      );
    }
  });

  insert(asignaciones);
}

export function getPlanificacionGuardada(sector: string, fecha_inicio: string, fecha_fin: string): any[] {
  const db = getDb();
  
  const query = `
    SELECT 
      ht.legajo, 
      p.nombre,
      p.cargo_id,
      c.descripcion as cargo,
      p.enCapacitacion,
      ht.id_turno,
      t.descripcion as turno_descripcion,
      ht.es_excepcional,
      ht.hora_entrada_excepcional,
      ht.hora_salida_excepcional,
      ht.fecha_inicio as turno_fecha_inicio,
      ht.fecha_fin as turno_fecha_fin
    FROM historial_turnos ht
    JOIN personal p ON ht.legajo = p.legajo
    LEFT JOIN cargos c ON p.cargo_id = c.id_cargo
    LEFT JOIN turnos_horarios t ON ht.id_turno = t.id_turno
    WHERE p.sectorPertenencia = ? 
      AND ht.fecha_inicio <= ? 
      AND ht.fecha_fin >= ?
      AND p.activo = 1
    ORDER BY p.nombre ASC
  `;
  
  return db.prepare(query).all(sector, fecha_fin, fecha_inicio) as any[];
}

export function getListaPlanesGuardados(): any[] {
  const db = getDb();
  const query = `
    SELECT DISTINCT 
      p.sectorPertenencia as sector,
      s.descripcion as sector_descripcion,
      ht.fecha_inicio, 
      ht.fecha_fin,
      ht.nombre_plan
    FROM historial_turnos ht
    JOIN personal p ON ht.legajo = p.legajo
    JOIN sectores s ON p.sectorPertenencia = s.idSector
    WHERE ht.fecha_inicio IS NOT NULL
    ORDER BY ht.fecha_inicio DESC
  `;
  return db.prepare(query).all() as any[];
}

export function deletePlanGuardado(sector: string, fecha_inicio: string, fecha_fin: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    DELETE FROM historial_turnos 
    WHERE legajo IN (
      SELECT legajo FROM personal WHERE sectorPertenencia = ?
    ) 
    AND fecha_inicio = ? 
    AND (fecha_fin = ? OR (? = '' AND (fecha_fin IS NULL OR fecha_fin = '')))
  `);
  stmt.run(sector, fecha_inicio, fecha_fin, fecha_fin);
}
