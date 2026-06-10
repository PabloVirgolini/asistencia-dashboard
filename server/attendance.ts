import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database | null = null;

function getDb() {
  if (!db) {
    // Intentar múltiples rutas posibles
    const possiblePaths = [
      path.join(__dirname, '../data2.db'),
      path.join(process.cwd(), 'data2.db'),
      '/home/ubuntu/asistencia-dashboard/data2.db',
    ];

    let dbPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        dbPath = p;
        break;
      }
    }

    if (!dbPath) {
      dbPath = possiblePaths[0]; // Usar la primera ruta por defecto
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    
    // Inicializar tabla de administradores si no existe
    db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);
  }
  return db;
}

export interface PersonalRecord {
  id: number;
  legajo: string;
  nombre: string;
  activo: number;
  enCapacitacion: string;
  sectorPertenencia: string;
}

export interface FichadaRecord {
  nroFichada: number;
  reloj: string;
  hora: string;
  legajo: string;
  fichadaRepetida: number;
}

export interface SectorRecord {
  idSector: number;
  descripcion: string;
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

export function getTurnosHorarios(): { id_turno: number, descripcion: string }[] {
  const db = getDb();
  const stmt = db.prepare('SELECT id_turno, descripcion FROM turnos_horarios ORDER BY id_turno ASC');
  return stmt.all() as { id_turno: number, descripcion: string }[];
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
  const countStmt = db.prepare('SELECT COUNT(*) as c FROM horarios WHERE id_turno = ?');
  const result = countStmt.get(id_turno) as { c: number };
  if (result.c > 0) {
    throw new Error('No se puede eliminar el turno porque tiene reglas de horario asignadas.');
  }

  const stmt = db.prepare('DELETE FROM turnos_horarios WHERE id_turno = ?');
  stmt.run(id_turno);
}

export function getHorariosReglas(): any[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT h.id_horario, h.dia_semana, h.hora_entrada, h.hora_salida, h.legajo,
           h.id_turno, h.id_sector, h.id_cargo,
           t.descripcion as turno, s.descripcion as sector, c.descripcion as cargo
    FROM horarios h
    LEFT JOIN turnos_horarios t ON h.id_turno = t.id_turno
    LEFT JOIN sectores s ON h.id_sector = s.idSector
    LEFT JOIN cargos c ON h.id_cargo = c.id_cargo
    ORDER BY h.id_turno ASC, h.dia_semana ASC
  `);
  return stmt.all();
}

export function duplicateSectorRules(id_turno: number, sourceSectorId: number, targetSectorId: number): void {
  const db = getDb();
  
  // 1. Fetch all rules from the source sector under the specific turno
  const stmt = db.prepare(`
    SELECT id_cargo, dia_semana, hora_entrada, hora_salida, legajo
    FROM horarios
    WHERE id_turno = ? AND id_sector = ?
  `);
  
  const rules = stmt.all(id_turno, sourceSectorId) as any[];
  
  if (rules.length === 0) {
    throw new Error('No hay reglas para copiar en este sector y turno.');
  }

  // 1.5 Validate that the target sector actually has employees with the required cargos
  // Filter the rules array to only include valid cargos.
  const targetPersonalStmt = db.prepare('SELECT cargo_id FROM personal WHERE sectorPertenencia = ? AND activo = 1');
  const targetPersonal = targetPersonalStmt.all(targetSectorId) as {cargo_id: number}[];
  
  const rulesToCopy = rules.filter(r => {
    if (r.id_cargo === null) return true;
    // Si el sector destino no tiene ningún empleado todavía, le permitimos copiar todas las reglas (fallback)
    if (targetPersonal.length === 0) return true; 
    // Si tiene empleados, solo copiamos las reglas de los cargos que realmente existen en ese sector
    return targetPersonal.some(p => p.cargo_id === r.id_cargo);
  });

  if (rulesToCopy.length === 0) {
    throw new Error('Ninguno de los cargos de estas reglas existe en el sector destino. No se copió nada.');
  }

  // 2. We could just delete existing rules in the target if we wanted to OVERWRITE,  
  // but usually "duplicar" implies adding to what's there or just cloning.
  // We'll just clone them. Overlaps will be caught by a check or we can just ignore overlaps here.
  // Actually, to avoid crashing halfway, we will use a transaction.
  
  const insertStmt = db.prepare(`
    INSERT INTO horarios (id_sector, id_cargo, id_turno, dia_semana, hora_entrada, hora_salida, legajo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((rulesToInsert: any[]) => {
    for (const rule of rulesToInsert) {
      // Basic check to avoid EXACT duplicates in target
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
          rule.legajo
        );
      }
    }
  });

  transaction(rulesToCopy);
}

export function addHorario(
  id_sector: number | null, 
  id_cargo: number | null, 
  legajo: string | null, 
  id_turno: number, 
  dias: number[], 
  hora_entrada: string, 
  hora_salida: string
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
    INSERT INTO horarios (id_sector, id_cargo, id_turno, dia_semana, hora_entrada, hora_salida, legajo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction((diasArr: number[]) => {
    for (const dia of diasArr) {
      const isOverlap = checkStmt.get(id_turno, dia, legajo, legajo, id_sector, id_cargo) as { c: number };
      if (isOverlap.c > 0) {
        throw new Error('Ya existe una regla configurada para este mismo Turno, Día y Sector/Cargo/Legajo.');
      }
      insertStmt.run(id_sector, id_cargo, id_turno, dia, hora_entrada, hora_salida, legajo);
    }
  });

  tx(dias);
}

export function removeHorario(id_horario: number): void {
  const db = getDb();
  
  const ruleStmt = db.prepare('SELECT id_sector, id_cargo, legajo FROM horarios WHERE id_horario = ?');
  const rule = ruleStmt.get(id_horario) as { id_sector: number | null, id_cargo: number | null, legajo: string | null } | undefined;
  
  if (!rule) {
    throw new Error('La regla no existe.');
  }

  if (rule.legajo) {
    const pStmt = db.prepare('SELECT COUNT(*) as c FROM personal WHERE legajo = ? AND activo = 1');
    const pResult = pStmt.get(rule.legajo) as { c: number };
    if (pResult.c > 0) {
      throw new Error(`No se puede eliminar: el empleado con legajo ${rule.legajo} está activo en el sistema.`);
    }
  } else if (rule.id_sector && rule.id_cargo) {
    const pStmt = db.prepare('SELECT COUNT(*) as c FROM personal WHERE sectorPertenencia = ? AND cargo_id = ? AND activo = 1');
    const pResult = pStmt.get(rule.id_sector, rule.id_cargo) as { c: number };
    if (pResult.c > 0) {
      throw new Error(`No se puede eliminar: hay ${pResult.c} empleado(s) activo(s) con este sector y cargo.`);
    }
  }

  const deleteStmt = db.prepare('DELETE FROM horarios WHERE id_horario = ?');
  deleteStmt.run(id_horario);
}

export function updateHorario(id_horario: number, hora_entrada: string, hora_salida: string): void {
  const db = getDb();
  
  const checkStmt = db.prepare('SELECT COUNT(*) as c FROM horarios WHERE id_horario = ?');
  const result = checkStmt.get(id_horario) as { c: number };
  
  if (result.c === 0) {
    throw new Error('La regla de horario no existe.');
  }

  const updateStmt = db.prepare('UPDATE horarios SET hora_entrada = ?, hora_salida = ? WHERE id_horario = ?');
  updateStmt.run(hora_entrada, hora_salida, id_horario);
}

export function batchUpdateHorarios(id_horarios: number[], hora_entrada: string, hora_salida: string): void {
  const db = getDb();
  
  const updateStmt = db.prepare('UPDATE horarios SET hora_entrada = ?, hora_salida = ? WHERE id_horario = ?');
  
  const transaction = db.transaction((ids: number[]) => {
    for (const id of ids) {
      updateStmt.run(hora_entrada, hora_salida, id);
    }
  });
  
  transaction(id_horarios);
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
      p.cargo_id
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
    INNER JOIN fichadas f ON CAST(p.legajo AS INTEGER) = CAST(SUBSTR(f.legajo, 3) AS INTEGER)
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

  // Traer todos los horarios del día actual para evaluarlos en JS
  const horariosStmt = db.prepare('SELECT id_sector, id_cargo, legajo, id_turno, hora_entrada FROM horarios WHERE dia_semana = ?');
  const horariosDelDia = horariosStmt.all(dayOfWeek) as any[];

  return records.map(r => {
    let llegadaTarde = false;
    let horaEsperada = null;

    if (r.id_turno) {
      const matchingHorarios = horariosDelDia.filter((h: any) => h.id_turno === r.id_turno);
      
      // 1. Prioridad: Excepción por Legajo
      const exceptionRule = matchingHorarios.find((h: any) => h.legajo === r.legajo);
      if (exceptionRule) {
        horaEsperada = exceptionRule.hora_entrada;
      } else {
        // 2. Prioridad: Regla General Sector+Cargo
        const generalRule = matchingHorarios.find((h: any) => h.id_sector === r.sectorPertenencia && h.id_cargo === r.cargo_id);
        if (generalRule) {
          horaEsperada = generalRule.hora_entrada;
        }
      }
    }

    if (horaEsperada) {
       const timePart = r.primeraFichada.split(' ')[1]; // "HH:MM:SS"
       
       const [expectedH, expectedM] = horaEsperada.split(':').map(Number);
       const expectedDate = new Date(jsDate);
       expectedDate.setHours(expectedH, expectedM + toleranciaMinutos, 0, 0);

       const actualDate = new Date(jsDate);
       const [ah, am, as] = timePart.split(':').map(Number);
       actualDate.setHours(ah, am, as || 0, 0);

       if (actualDate > expectedDate) {
         llegadaTarde = true;
       }
    }
    return {
      legajo: r.legajo,
      nombre: r.nombre,
      sector: r.sector,
      cargo: r.cargo || 'Operario',
      nivel_criticidad: r.nivel_criticidad || 1,
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
      AND CAST(p.legajo AS INTEGER) NOT IN (
        SELECT DISTINCT CAST(SUBSTR(f.legajo, 3) AS INTEGER)
        FROM fichadas f
        WHERE f.hora >= ? AND f.hora < ?
      )
  `;
  
  if (sector && sector !== 'todos') {
    query += ' AND p.sectorPertenencia = ?';
  }
  
  query += ' ORDER BY p.nombre ASC';
  
  const startOfDay = `${date} 00:00:00`;
  const endOfDay = `${date} 23:59:59`;
  
  const stmt = db.prepare(query);
  const params = sector && sector !== 'todos'
    ? [startOfDay, endOfDay, sector]
    : [startOfDay, endOfDay];
  
  return stmt.all(...params) as AbsenceRecord[];
}

/**
 * Obtiene el resumen de asistencia para un día específico
 */
export function getAttendanceSummary(date: string, sector?: string, toleranciaMinutos: number = 0): AttendanceSummary {
  const db = getDb();
  
  // Obtener total de personal activo
  let totalQuery = 'SELECT COUNT(*) as count FROM personal WHERE activo = 1';
  if (sector && sector !== 'todos') {
    totalQuery += ' AND sectorPertenencia = ?';
  }
  
  const totalStmt = db.prepare(totalQuery);
  const totalResult = sector && sector !== 'todos'
    ? totalStmt.get(sector) as { count: number }
    : totalStmt.get() as { count: number };
  const totalActivos = totalResult.count;
  
  // Obtener presentes
  const presentes = getPresentesByDate(date, sector, toleranciaMinutos).length;
  const ausentes = totalActivos - presentes;
  
  const porcentajePresentes = totalActivos > 0 ? Math.round((presentes / totalActivos) * 100) : 0;
  const porcentajeAusentes = totalActivos > 0 ? Math.round((ausentes / totalActivos) * 100) : 0;
  
  return {
    totalActivos,
    presentes,
    ausentes,
    porcentajePresentes,
    porcentajeAusentes,
  };
}

/**
 * Valida que una fecha esté en formato YYYY-MM-DD
 */
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 */
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// ==========================================
// ADMIN Y GESTIÓN (Nuevas Funcionalidades)
// ==========================================

export interface AdminRecord {
  id: number;
  name: string;
  email: string;
  password?: string;
}

export function getAdminByEmail(email: string): AdminRecord | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT id, name, email, password FROM admins WHERE email = ?');
  return stmt.get(email) as AdminRecord | undefined;
}

export function createAdmin(name: string, email: string, passwordHash: string): void {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)');
  stmt.run(name, email, passwordHash);
}

// Gestión de Sectores
export function insertSector(idSector: number, descripcion: string): void {
  const db = getDb();
  // SQLite permite insertar con ID explícito
  const stmt = db.prepare('INSERT INTO sectores (idSector, descripcion) VALUES (?, ?)');
  stmt.run(idSector, descripcion);
}

export function deleteSector(idSector: number): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM sectores WHERE idSector = ?');
  stmt.run(idSector);
}

// Gestión de Cargos
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

// Gestión de Personal
export function insertPersonal(legajo: string, nombre: string, sectorPertenencia: string): void {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO personal (legajo, nombre, activo, enCapacitacion, sectorPertenencia) VALUES (?, ?, 1, "0", ?)');
  stmt.run(legajo, nombre, sectorPertenencia);
}

export function updatePersonal(legajo: string, nombre: string, sectorPertenencia: string, activo: number, cargo_id: number): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE personal SET nombre = ?, sectorPertenencia = ?, activo = ?, cargo_id = ? WHERE legajo = ?');
  stmt.run(nombre, sectorPertenencia, activo, cargo_id, legajo);
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
    // 1. Validar si hay reglas de horario usando cargos que se están eliminando
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
      // Si eliminan todos
      const result = db.prepare('SELECT COUNT(*) as c FROM horarios WHERE id_sector = ?').get(idSector) as { c: number };
      if (result.c > 0) throw new Error('El sector tiene reglas de horarios.');
      const personalResult = db.prepare('SELECT COUNT(*) as c FROM personal WHERE sectorPertenencia = ? AND activo = 1').get(idSector) as { c: number };
      if (personalResult.c > 0) throw new Error('El sector tiene empleados activos.');
    }

    // 2. Eliminar todos los mapeos de este sector
    db.prepare('DELETE FROM sectores_cargos WHERE id_sector = ?').run(idSector);
    
    // 3. Insertar los nuevos
    const insertStmt = db.prepare('INSERT INTO sectores_cargos (id_sector, id_cargo, nivel_criticidad) VALUES (?, ?, ?)');
    for (const cp of cargosParams) {
      insertStmt.run(idSector, cp.id_cargo, cp.nivel_criticidad);
    }
  })();
}


export function deletePersonal(legajo: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM personal WHERE legajo = ?');
  stmt.run(legajo);
}
