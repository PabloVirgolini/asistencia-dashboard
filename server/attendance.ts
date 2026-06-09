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
  primeraFichada: string;
}

export interface AbsenceRecord {
  legajo: string;
  nombre: string;
  sector: string;
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

/**
 * Obtiene el personal activo, opcionalmente filtrado por sector
 */
export function getActivePersonal(sector?: string): PersonalRecord[] {
  const db = getDb();
  let query = 'SELECT id, legajo, nombre, activo, enCapacitacion, sectorPertenencia FROM personal WHERE activo = 1';
  
  if (sector && sector !== 'todos') {
    query += " AND sectorPertenencia = ?";
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
    SELECT DISTINCT
      p.legajo,
      p.nombre,
      p.sectorPertenencia as sector,
      MIN(f.hora) as primeraFichada
    FROM personal p
    INNER JOIN fichadas f ON p.legajo = f.legajo
    WHERE p.activo = 1
      AND f.hora >= ? AND f.hora < ?
  `;
  
  if (sector && sector !== 'todos') {
    query += ' AND p.sectorPertenencia = ?';
  }
  
  query += ' GROUP BY p.legajo, p.nombre, p.sectorPertenencia ORDER BY primeraFichada ASC';
  
  const startOfDay = `${date} 00:00:00`;
  const endOfDay = `${date} 23:59:59`;
  
  const stmt = db.prepare(query);
  const params = sector && sector !== 'todos' 
    ? [startOfDay, endOfDay, sector]
    : [startOfDay, endOfDay];
  
  return stmt.all(...params) as AttendanceRecord[];
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
      p.sectorPertenencia as sector
    FROM personal p
    WHERE p.activo = 1
      AND p.legajo NOT IN (
        SELECT DISTINCT f.legajo
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

export function updatePersonal(legajo: string, nombre: string, sectorPertenencia: string, activo: number): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE personal SET nombre = ?, sectorPertenencia = ?, activo = ? WHERE legajo = ?');
  stmt.run(nombre, sectorPertenencia, activo, legajo);
}

export function deletePersonal(legajo: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM personal WHERE legajo = ?');
  stmt.run(legajo);
}
