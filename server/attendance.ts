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
           t.descripcion as turno, s.descripcion as sector, c.descripcion as cargo
    FROM horarios h
    LEFT JOIN turnos_horarios t ON h.id_turno = t.id_turno
    LEFT JOIN sectores s ON h.id_sector = s.idSector
    LEFT JOIN cargos c ON h.id_cargo = c.id_cargo
    ORDER BY h.id_turno ASC, h.dia_semana ASC
  `);
  return stmt.all();
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

  const stmt = db.prepare('DELETE FROM horarios WHERE id_horario = ?');
  stmt.run(id_horario);
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
export function getPresentesByDate(date: string, sector?: string): AttendanceRecord[] {
  const db = getDb();
  
  let query = `
    SELECT
      p.legajo,
      p.nombre,
      s.descripcion as sector,
      c.descripcion as cargo,
      c.nivel_criticidad,
      p.sectorPertenencia,
      p.cargo_id,
      ht.id_turno,
      MIN(f.hora) as primeraFichada
    FROM personal p
    INNER JOIN fichadas f ON CAST(p.legajo AS INTEGER) = CAST(SUBSTR(f.legajo, 3) AS INTEGER)
    LEFT JOIN sectores s ON p.sectorPertenencia = s.idSector
    LEFT JOIN cargos c ON p.cargo_id = c.id_cargo
    LEFT JOIN historial_turnos ht ON ht.legajo = p.legajo AND ht.fecha_inicio <= ? AND (ht.fecha_fin IS NULL OR ht.fecha_fin >= ?)
    WHERE p.activo = 1 
      AND f.hora >= ? 
      AND f.hora < ?
      ${sector && sector !== 'todos' ? 'AND p.sectorPertenencia = ?' : ''}
    GROUP BY p.legajo, p.nombre, s.descripcion, c.descripcion, c.nivel_criticidad, p.sectorPertenencia, p.cargo_id, ht.id_turno
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
       if (timePart.substring(0, 5) > horaEsperada) {
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
      c.nivel_criticidad
    FROM personal p
    LEFT JOIN sectores s ON p.sectorPertenencia = s.idSector
    LEFT JOIN cargos c ON p.cargo_id = c.id_cargo
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
export function getAttendanceSummary(date: string, sector?: string): AttendanceSummary {
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
  const presentes = getPresentesByDate(date, sector).length;
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

export function deletePersonal(legajo: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM personal WHERE legajo = ?');
  stmt.run(legajo);
}
