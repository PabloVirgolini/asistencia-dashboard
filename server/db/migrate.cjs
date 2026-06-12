const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data2.db');
const db = new Database(dbPath);

console.log('Iniciando migración de SQLite para añadir FOREIGN KEYS con ON UPDATE CASCADE...');

try {
  db.transaction(() => {
    // 0. Personal
    console.log('Recreando personal...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS personal_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        legajo VARCHAR(10) UNIQUE NOT NULL,
        nombre VARCHAR(80) UNIQUE NOT NULL,
        activo INTEGER,
        enCapacitacion INTEGER,
        sectorPertenencia TEXT REFERENCES sectores(idSector),
        cargo_id INTEGER,
        es_rotativo INTEGER DEFAULT 0
      );
    `);
    db.exec(`INSERT INTO personal_new (id, legajo, nombre, activo, enCapacitacion, sectorPertenencia, cargo_id, es_rotativo) SELECT id, legajo, nombre, activo, enCapacitacion, sectorPertenencia, cargo_id, es_rotativo FROM personal;`);
    db.exec(`DROP TABLE personal;`);
    db.exec(`ALTER TABLE personal_new RENAME TO personal;`);

    // 1. Historial Turnos
    console.log('Recreando historial_turnos...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS historial_turnos_new (
        id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
        legajo TEXT,
        id_turno INTEGER,
        fecha_inicio TEXT NOT NULL,
        fecha_fin TEXT,
        es_excepcional INTEGER DEFAULT '0',
        hora_entrada_excepcional TEXT,
        hora_salida_excepcional TEXT,
        id_sector_excepcional INTEGER,
        FOREIGN KEY (legajo) REFERENCES personal(legajo) ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);
    try {
      db.exec(`INSERT INTO historial_turnos_new (id_historial, legajo, id_turno, fecha_inicio, fecha_fin, es_excepcional, hora_entrada_excepcional, hora_salida_excepcional, id_sector_excepcional) SELECT id_historial, legajo, id_turno, fecha_inicio, fecha_fin, es_excepcional, hora_entrada_excepcional, hora_salida_excepcional, id_sector_excepcional FROM historial_turnos;`);
      db.exec(`DROP TABLE historial_turnos;`);
    } catch(e) {
      console.log('Tabla historial_turnos no existia o ya estaba migrada:', e.message);
    }
    db.exec(`ALTER TABLE historial_turnos_new RENAME TO historial_turnos;`);

    // 2. Novedades Licencias
    console.log('Recreando novedades_licencias...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS novedades_licencias_new (
        id_novedad INTEGER PRIMARY KEY AUTOINCREMENT,
        legajo VARCHAR(10) NOT NULL,
        tipo TEXT NOT NULL,
        fecha_inicio TEXT NOT NULL,
        fecha_fin TEXT NOT NULL,
        observaciones TEXT,
        FOREIGN KEY (legajo) REFERENCES personal(legajo) ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);
    try {
      db.exec(`INSERT INTO novedades_licencias_new (id_novedad, legajo, tipo, fecha_inicio, fecha_fin, observaciones) SELECT id_novedad, legajo, tipo, fecha_inicio, fecha_fin, observaciones FROM novedades_licencias;`);
      db.exec(`DROP TABLE novedades_licencias;`);
    } catch(e) {
      console.log('Tabla novedades_licencias no existia o ya estaba migrada:', e.message);
    }
    db.exec(`ALTER TABLE novedades_licencias_new RENAME TO novedades_licencias;`);
  })();
  console.log('Migración completada exitosamente.');
} catch(err) {
  console.error('Error durante la migración:', err);
}

db.close();
