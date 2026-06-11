import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database | null = null;

export function setDbForTesting(mockDb: Database.Database | null) {
  db = mockDb;
}

export function getDb(): Database.Database {
  if (!db) {
    // Intentar múltiples rutas posibles
    const possiblePaths = [
      path.join(__dirname, '../../data2.db'), // Adjust path because we are inside server/db/
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

    // Migraciones automáticas (Auditoría Changelog)
    try {
      db.exec(`ALTER TABLE horarios ADD COLUMN updated_at DATETIME`);
    } catch (e) { /* Columna ya existe */ }
    
    try {
      db.exec(`ALTER TABLE horarios ADD COLUMN updated_by TEXT`);
    } catch (e) { /* Columna ya existe */ }

    // Fase 10: Planificador de Turnos
    try {
      db.exec(`ALTER TABLE personal ADD COLUMN es_rotativo INTEGER DEFAULT 0`);
    } catch (e) { /* Columna ya existe */ }

    db.exec(`
      CREATE TABLE IF NOT EXISTS novedades_licencias (
        id_novedad INTEGER PRIMARY KEY AUTOINCREMENT,
        legajo VARCHAR(10) NOT NULL,
        tipo TEXT NOT NULL,
        fecha_inicio TEXT NOT NULL,
        fecha_fin TEXT NOT NULL,
        observaciones TEXT
      )
    `);
  }
  return db;
}
