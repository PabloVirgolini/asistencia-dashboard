const Database = require('better-sqlite3');
const db = new Database('data2.db');

try {
  console.log('Iniciando migración de Fase 8...');

  db.exec('BEGIN TRANSACTION');

  // 1. Tabla Cargos
  db.exec(`
    CREATE TABLE IF NOT EXISTS cargos (
      id_cargo INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      nivel_criticidad INTEGER DEFAULT 1
    )
  `);

  // Insertar cargos base si no existen
  const checkCargos = db.prepare('SELECT count(*) as count FROM cargos').get();
  if (checkCargos.count === 0) {
    db.prepare('INSERT INTO cargos (id_cargo, descripcion, nivel_criticidad) VALUES (?, ?, ?)')
      .run(1, 'Operario', 1);
    db.prepare('INSERT INTO cargos (id_cargo, descripcion, nivel_criticidad) VALUES (?, ?, ?)')
      .run(2, 'Encargado de Máquina', 2);
    db.prepare('INSERT INTO cargos (id_cargo, descripcion, nivel_criticidad) VALUES (?, ?, ?)')
      .run(3, 'Encargado General', 3);
  }

  // 2. Tabla Turnos
  db.exec(`
    CREATE TABLE IF NOT EXISTS turnos (
      id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL
    )
  `);

  const checkTurnos = db.prepare('SELECT count(*) as count FROM turnos').get();
  if (checkTurnos.count === 0) {
    db.prepare('INSERT INTO turnos (id_turno, descripcion) VALUES (?, ?)')
      .run(1, 'Turno Mañana');
    db.prepare('INSERT INTO turnos (id_turno, descripcion) VALUES (?, ?)')
      .run(2, 'Turno Tarde');
    db.prepare('INSERT INTO turnos (id_turno, descripcion) VALUES (?, ?)')
      .run(3, 'Turno Noche');
    db.prepare('INSERT INTO turnos (id_turno, descripcion) VALUES (?, ?)')
      .run(4, 'Administración / Cortado');
  }

  // 3. Tabla Horarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS horarios (
      id_horario INTEGER PRIMARY KEY AUTOINCREMENT,
      id_sector INTEGER,
      id_cargo INTEGER,
      id_turno INTEGER,
      dia_semana INTEGER,
      hora_entrada TEXT,
      hora_salida TEXT,
      FOREIGN KEY(id_sector) REFERENCES sectores(idSector),
      FOREIGN KEY(id_cargo) REFERENCES cargos(id_cargo),
      FOREIGN KEY(id_turno) REFERENCES turnos(id_turno)
    )
  `);

  // 4. Tabla Historial Turnos
  db.exec(`
    CREATE TABLE IF NOT EXISTS historial_turnos (
      id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo TEXT,
      id_turno INTEGER,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT,
      FOREIGN KEY(id_turno) REFERENCES turnos(id_turno)
    )
  `);

  // 5. Alterar tabla personal
  // SQLite no permite ADD COLUMN con FK a menos que sea opcional, así que añadimos sin constraints estrictos
  const tableInfo = db.prepare("PRAGMA table_info('personal')").all();
  const hasCargoId = tableInfo.some(col => col.name === 'cargo_id');
  if (!hasCargoId) {
    db.exec('ALTER TABLE personal ADD COLUMN cargo_id INTEGER');
    db.exec('UPDATE personal SET cargo_id = 1');
  }

  db.exec('COMMIT');
  console.log('Migración completada exitosamente.');
} catch (error) {
  db.exec('ROLLBACK');
  console.error('Error durante la migración:', error);
} finally {
  db.close();
}
