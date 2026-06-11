/**
 * @module PersonalService
 * @description
 * Servicio encargado de gestionar el ABM (Alta, Baja, Modificación) del Personal,
 * Sectores, Cargos y las relaciones entre ellos (sectores_cargos).
 */
import { getDb } from '../db/database';

export interface PersonalRecord {
  id: number;
  legajo: string;
  nombre: string;
  activo: number;
  enCapacitacion: string;
  sectorPertenencia: string;
  es_rotativo: number;
}

export interface SectorRecord {
  idSector: number;
  descripcion: string;
}

/**
 * Obtiene todos los sectores disponibles
 */
export function getSectors(): SectorRecord[] {
  const db = getDb();
  const stmt = db.prepare('SELECT idSector, descripcion FROM sectores ORDER BY descripcion');
  return stmt.all() as SectorRecord[];
}

export function getCargos(): { id_cargo: number, descripcion: string }[] {
  const db = getDb();
  const stmt = db.prepare('SELECT id_cargo, descripcion FROM cargos ORDER BY id_cargo ASC');
  return stmt.all() as { id_cargo: number, descripcion: string }[];
}

/**
 * Obtiene el personal activo, opcionalmente filtrado por sector
 */
export function getActivePersonal(sector?: string): PersonalRecord[] {
  const db = getDb();
  let query = `
    SELECT 
      p.id, p.legajo, p.nombre, p.activo, p.enCapacitacion, 
      s.descripcion as sectorPertenencia,
      c.descripcion as cargo,
      p.cargo_id,
      p.es_rotativo
    FROM personal p
    LEFT JOIN sectores s ON p.sectorPertenencia = s.idSector
    LEFT JOIN cargos c ON p.cargo_id = c.id_cargo
    WHERE p.activo = 1
  `;
  
  if (sector && sector !== 'todos') {
    query += " AND p.sectorPertenencia = ?";
    const stmt = db.prepare(query);
    return stmt.all(sector) as PersonalRecord[];
  }
  
  const stmt = db.prepare(query);
  return stmt.all() as PersonalRecord[];
}

export function insertSector(idSector: number, descripcion: string): void {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO sectores (idSector, descripcion) VALUES (?, ?)');
  stmt.run(idSector, descripcion);
}

export function deleteSector(idSector: number): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM sectores WHERE idSector = ?');
  stmt.run(idSector);
}

export function updateSector(idSector: number, descripcion: string): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE sectores SET descripcion = ? WHERE idSector = ?');
  stmt.run(descripcion, idSector);
}

export function getSectoresCargos(): { id_sector: number, id_cargo: number, nivel_criticidad: number }[] {
  const db = getDb();
  const stmt = db.prepare('SELECT id_sector, id_cargo, nivel_criticidad FROM sectores_cargos');
  return stmt.all() as { id_sector: number, id_cargo: number, nivel_criticidad: number }[];
}

export function updateSectorCargos(idSector: number, cargosParams: {id_cargo: number, nivel_criticidad: number}[]): void {
  const db = getDb();
  db.transaction(() => {
    const keepCargos = cargosParams.map(c => c.id_cargo);
    if (keepCargos.length > 0) {
      const placeholders = keepCargos.map(() => '?').join(',');
      const conflictStmt = db.prepare(`SELECT COUNT(*) as c FROM horarios WHERE id_sector = ? AND id_cargo NOT IN (${placeholders})`);
      const result = conflictStmt.get(idSector, ...keepCargos) as { c: number };
      if (result.c > 0) {
        throw new Error('No se pueden remover algunos cargos porque están siendo usados en reglas de horarios de este sector.');
      }
      
      const conflictPersonalStmt = db.prepare(`SELECT COUNT(*) as c FROM personal WHERE sectorPertenencia = ? AND cargo_id NOT IN (${placeholders}) AND activo = 1`);
      const personalResult = conflictPersonalStmt.get(idSector, ...keepCargos) as { c: number };
      if (personalResult.c > 0) {
        throw new Error('No se pueden remover algunos cargos porque hay empleados activos en este sector que los poseen.');
      }
    } else {
      const result = db.prepare('SELECT COUNT(*) as c FROM horarios WHERE id_sector = ?').get(idSector) as { c: number };
      if (result.c > 0) throw new Error('El sector tiene reglas de horarios.');
      const personalResult = db.prepare('SELECT COUNT(*) as c FROM personal WHERE sectorPertenencia = ? AND activo = 1').get(idSector) as { c: number };
      if (personalResult.c > 0) throw new Error('El sector tiene empleados activos.');
    }

    db.prepare('DELETE FROM sectores_cargos WHERE id_sector = ?').run(idSector);
    const insertStmt = db.prepare('INSERT INTO sectores_cargos (id_sector, id_cargo, nivel_criticidad) VALUES (?, ?, ?)');
    for (const cp of cargosParams) {
      insertStmt.run(idSector, cp.id_cargo, cp.nivel_criticidad);
    }
  })();
}

export function insertCargo(descripcion: string): void {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO cargos (descripcion) VALUES (?)');
  stmt.run(descripcion);
}

export function updateCargo(id_cargo: number, descripcion: string): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE cargos SET descripcion = ? WHERE id_cargo = ?');
  stmt.run(descripcion, id_cargo);
}

export function deleteCargo(id_cargo: number): void {
  const db = getDb();
  db.transaction(() => {
    const pResult = db.prepare('SELECT COUNT(*) as c FROM personal WHERE cargo_id = ?').get(id_cargo) as { c: number };
    if (pResult.c > 0) throw new Error('No se puede eliminar el cargo: está asignado a uno o más empleados.');

    const scResult = db.prepare('SELECT COUNT(*) as c FROM sectores_cargos WHERE id_cargo = ?').get(id_cargo) as { c: number };
    if (scResult.c > 0) throw new Error('No se puede eliminar el cargo: está configurado en uno o más sectores.');

    const hResult = db.prepare('SELECT COUNT(*) as c FROM horarios WHERE id_cargo = ?').get(id_cargo) as { c: number };
    if (hResult.c > 0) throw new Error('No se puede eliminar el cargo: está siendo usado en reglas de horarios.');

    const stmt = db.prepare('DELETE FROM cargos WHERE id_cargo = ?');
    stmt.run(id_cargo);
  })();
}

export function insertPersonal(legajo: string, nombre: string, sectorPertenencia: string, cargo_id: number, es_rotativo: number, enCapacitacion: boolean = false): void {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO personal (legajo, nombre, activo, enCapacitacion, sectorPertenencia, cargo_id, es_rotativo) VALUES (?, ?, 1, ?, ?, ?, ?)');
  stmt.run(legajo, nombre, enCapacitacion ? '1' : '0', sectorPertenencia, cargo_id, es_rotativo);
}

export function updatePersonal(legajo: string, nombre: string, sectorPertenencia: string, activo: number, cargo_id: number, es_rotativo: number, enCapacitacion: boolean = false): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE personal SET nombre = ?, sectorPertenencia = ?, activo = ?, cargo_id = ?, es_rotativo = ?, enCapacitacion = ? WHERE legajo = ?');
  stmt.run(nombre, sectorPertenencia, activo, cargo_id, es_rotativo, enCapacitacion ? '1' : '0', legajo);
}

export function deletePersonal(legajo: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM personal WHERE legajo = ?');
  stmt.run(legajo);
}

export function toggleEnCapacitacion(legajo: string, estado: boolean): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE personal SET enCapacitacion = ? WHERE legajo = ?');
  stmt.run(estado ? '1' : '0', legajo);
}
