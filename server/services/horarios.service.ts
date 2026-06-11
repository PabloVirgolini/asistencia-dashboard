/**
 * @module HorariosService
 * @description
 * Servicio principal para la configuración de las reglas de horarios (Turnos Maestros y Horarios).
 * Contiene la lógica para obtener, crear, actualizar, eliminar y replicar horarios de los distintos sectores.
 */
import { getDb } from '../db/database';

export function getTurnosHorarios(): { id_turno: number, descripcion: string }[] {
  const db = getDb();
  const stmt = db.prepare('SELECT id_turno, descripcion FROM turnos_horarios ORDER BY id_turno ASC');
  return stmt.all() as { id_turno: number, descripcion: string }[];
}

export function getTurnosPorSector(id_sector: number): { id_turno: number, descripcion: string }[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT DISTINCT t.id_turno, t.descripcion 
    FROM turnos_horarios t
    INNER JOIN horarios h ON t.id_turno = h.id_turno
    WHERE h.id_sector = ?
    ORDER BY t.id_turno ASC
  `);
  return stmt.all(id_sector) as { id_turno: number, descripcion: string }[];
}

export function addTurnoHorario(descripcion: string): void {
  const db = getDb();
  const checkStmt = db.prepare('SELECT COUNT(*) as c FROM turnos_horarios WHERE LOWER(descripcion) = LOWER(?)');
  const result = checkStmt.get(descripcion) as { c: number };
  if (result.c > 0) {
    throw new Error('Ya existe un turno con este nombre.');
  }

  const stmt = db.prepare('INSERT INTO turnos_horarios (descripcion) VALUES (?)');
  stmt.run(descripcion);
}

export function removeTurnoHorario(id_turno: number): void {
  const db = getDb();
  
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM horarios WHERE id_turno = ?');
  const result: any = checkStmt.get(id_turno);
  if (result.count > 0) {
    throw new Error('No se puede eliminar el turno porque está en uso en las reglas de horarios');
  }
  
  const stmt = db.prepare('DELETE FROM turnos_horarios WHERE id_turno = ?');
  stmt.run(id_turno);
}

export function updateTurnoHorario(id_turno: number, descripcion: string): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE turnos_horarios SET descripcion = ? WHERE id_turno = ?');
  stmt.run(descripcion, id_turno);
}

export function getHorariosReglas(): any[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT h.id_horario, h.dia_semana, h.hora_entrada, h.hora_salida, h.legajo,
           h.id_turno, h.id_sector, h.id_cargo, h.updated_at, h.updated_by,
           h.es_cortado, h.hora_entrada_2, h.hora_salida_2,
           t.descripcion as turno, s.descripcion as sector, c.descripcion as cargo
    FROM horarios h
    LEFT JOIN turnos_horarios t ON h.id_turno = t.id_turno
    LEFT JOIN sectores s ON h.id_sector = s.idSector
    LEFT JOIN cargos c ON h.id_cargo = c.id_cargo
    ORDER BY h.id_turno ASC, h.dia_semana ASC
  `);
  return stmt.all();
}

export function duplicateSectorRules(id_turno: number, sourceSectorId: number, targetSectorId: number, adminName: string): void {
  const db = getDb();
  
  const stmt = db.prepare(`
    SELECT id_cargo, dia_semana, hora_entrada, hora_salida, legajo, es_cortado, hora_entrada_2, hora_salida_2
    FROM horarios
    WHERE id_turno = ? AND id_sector = ?
  `);
  
  const rules = stmt.all(id_turno, sourceSectorId) as any[];
  
  if (rules.length === 0) {
    throw new Error('No hay reglas para copiar en este sector y turno.');
  }

  const targetPersonalStmt = db.prepare('SELECT cargo_id FROM personal WHERE sectorPertenencia = ? AND activo = 1');
  const targetPersonal = targetPersonalStmt.all(targetSectorId.toString()) as {cargo_id: number}[];
  
  const rulesToCopy = rules.filter(r => {
    if (r.id_cargo === null) return true;
    if (targetPersonal.length === 0) return true; 
    return targetPersonal.some(p => p.cargo_id === r.id_cargo);
  });

  if (rulesToCopy.length === 0) {
    throw new Error('Ninguno de los cargos de estas reglas existe en el sector destino. No se copió nada.');
  }

  const insertStmt = db.prepare(`
    INSERT INTO horarios (id_sector, id_cargo, id_turno, dia_semana, hora_entrada, hora_salida, legajo, updated_at, updated_by, es_cortado, hora_entrada_2, hora_salida_2)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?, ?, ?, ?)
  `);

  const transaction = db.transaction((rulesToInsert: any[]) => {
    for (const rule of rulesToInsert) {
      const checkStmt = db.prepare(`
        SELECT COUNT(*) as c FROM horarios 
        WHERE id_turno = ? AND dia_semana = ? AND id_sector = ? AND id_cargo = ? AND (legajo IS NULL OR legajo = ?)
      `);
      const res = checkStmt.get(id_turno, rule.dia_semana, targetSectorId, rule.id_cargo, rule.legajo) as { c: number };
      
      if (res.c === 0) {
        insertStmt.run(
          targetSectorId, 
          rule.id_cargo, 
          id_turno, 
          rule.dia_semana, 
          rule.hora_entrada, 
          rule.hora_salida, 
          rule.legajo,
          adminName,
          rule.es_cortado,
          rule.hora_entrada_2,
          rule.hora_salida_2
        );
      }
    }
  });

  transaction(rulesToCopy);
}

export function duplicateCargoRules(id_turno: number, id_sector: number, source_cargo: number, target_cargo: number, adminName: string): void {
  const db = getDb();
  
  const stmt = db.prepare(`
    SELECT dia_semana, hora_entrada, hora_salida, legajo, es_cortado, hora_entrada_2, hora_salida_2
    FROM horarios
    WHERE id_turno = ? AND id_sector = ? AND id_cargo = ?
  `);
  
  const rules = stmt.all(id_turno, id_sector, source_cargo) as any[];
  
  if (rules.length === 0) {
    throw new Error('No hay reglas para copiar en este cargo, sector y turno.');
  }

  const insertStmt = db.prepare(`
    INSERT INTO horarios (id_sector, id_cargo, id_turno, dia_semana, hora_entrada, hora_salida, legajo, updated_at, updated_by, es_cortado, hora_entrada_2, hora_salida_2)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?, ?, ?, ?)
  `);

  const transaction = db.transaction((rulesToInsert: any[]) => {
    for (const rule of rulesToInsert) {
      const checkStmt = db.prepare(`
        SELECT COUNT(*) as c FROM horarios 
        WHERE id_turno = ? AND dia_semana = ? AND id_sector = ? AND id_cargo = ? AND (legajo IS NULL OR legajo = ?)
      `);
      const res = checkStmt.get(id_turno, rule.dia_semana, id_sector, target_cargo, rule.legajo) as { c: number };
      
      if (res.c === 0) {
        insertStmt.run(id_sector, target_cargo, id_turno, rule.dia_semana, rule.hora_entrada, rule.hora_salida, rule.legajo, adminName, rule.es_cortado, rule.hora_entrada_2, rule.hora_salida_2);
      }
    }
  });

  transaction(rules);
}

export function addHorario(
  id_sector: number | null, 
  id_cargo: number | null, 
  legajo: string | null, 
  id_turno: number, 
  dias: number[], 
  hora_entrada: string, 
  hora_salida: string,
  adminName: string,
  es_cortado: number = 0,
  hora_entrada_2: string | null = null,
  hora_salida_2: string | null = null
): void {
  const db = getDb();
  
  const checkStmt = db.prepare(`
    SELECT COUNT(*) as c FROM horarios 
    WHERE id_turno = ? 
      AND dia_semana = ?
      AND (
        (legajo IS NOT NULL AND legajo = ?) OR 
        (legajo IS NULL AND ? IS NULL AND id_sector = ? AND id_cargo = ?)
      )
  `);

  const insertStmt = db.prepare(`
    INSERT INTO horarios (id_sector, id_cargo, id_turno, dia_semana, hora_entrada, hora_salida, legajo, updated_at, updated_by, es_cortado, hora_entrada_2, hora_salida_2)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?, ?, ?, ?)
  `);

  const transaction = db.transaction((diasArr: number[]) => {
    for (const dia of diasArr) {
      const res = checkStmt.get(id_turno, dia, legajo, legajo, id_sector, id_cargo) as { c: number };
      if (res.c > 0) {
        throw new Error(`Ya existe una regla de horario para el día ${dia} con estos parámetros.`);
      }
      insertStmt.run(id_sector, id_cargo, id_turno, dia, hora_entrada, hora_salida, legajo, adminName, es_cortado, hora_entrada_2, hora_salida_2);
    }
  });

  transaction(dias);
}

export function removeHorario(id_horario: number): void {
  const db = getDb();
  
  const ruleStmt = db.prepare('SELECT id_sector, id_cargo, legajo FROM horarios WHERE id_horario = ?');
  const rule = ruleStmt.get(id_horario) as { id_sector: number | null, id_cargo: number | null, legajo: string | null } | undefined;
  
  if (!rule) {
    throw new Error('La regla no existe.');
  }

  const deleteStmt = db.prepare('DELETE FROM horarios WHERE id_horario = ?');
  deleteStmt.run(id_horario);
}

export function updateHorario(
  id_horario: number, 
  hora_entrada: string, 
  hora_salida: string, 
  adminName: string,
  es_cortado: number = 0,
  hora_entrada_2: string | null = null,
  hora_salida_2: string | null = null
): void {
  const db = getDb();
  
  const checkStmt = db.prepare('SELECT COUNT(*) as c FROM horarios WHERE id_horario = ?');
  const result = checkStmt.get(id_horario) as { c: number };
  
  if (result.c === 0) {
    throw new Error('La regla de horario no existe.');
  }

  const updateStmt = db.prepare('UPDATE horarios SET hora_entrada = ?, hora_salida = ?, updated_at = datetime("now", "localtime"), updated_by = ?, es_cortado = ?, hora_entrada_2 = ?, hora_salida_2 = ? WHERE id_horario = ?');
  updateStmt.run(hora_entrada, hora_salida, adminName, es_cortado, hora_entrada_2, hora_salida_2, id_horario);
}

export function batchUpdateHorarios(
  id_horarios: number[], 
  hora_entrada: string, 
  hora_salida: string, 
  adminName: string,
  es_cortado: number = 0,
  hora_entrada_2: string | null = null,
  hora_salida_2: string | null = null
): void {
  const db = getDb();
  
  const updateStmt = db.prepare('UPDATE horarios SET hora_entrada = ?, hora_salida = ?, updated_at = datetime("now", "localtime"), updated_by = ?, es_cortado = ?, hora_entrada_2 = ?, hora_salida_2 = ? WHERE id_horario = ?');
  
  const transaction = db.transaction((ids: number[]) => {
    for (const id of ids) {
      updateStmt.run(hora_entrada, hora_salida, adminName, es_cortado, hora_entrada_2, hora_salida_2, id);
    }
  });
  
  transaction(id_horarios);
}
