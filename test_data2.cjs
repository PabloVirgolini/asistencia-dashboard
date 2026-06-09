const Database = require('better-sqlite3');
const db = new Database('data2.db');

try {
  db.pragma('foreign_keys = OFF');
  db.exec(`
    CREATE TABLE IF NOT EXISTS turnos_horarios (
      id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL
    );
    INSERT OR IGNORE INTO turnos_horarios (id_turno, descripcion) VALUES (1, 'Turno Mañana'), (2, 'Turno Tarde'), (3, 'Turno Noche'), (4, 'Administración / Cortado');

    DROP TABLE IF EXISTS horarios;
    CREATE TABLE horarios (
      id_horario INTEGER PRIMARY KEY AUTOINCREMENT,
      id_sector INTEGER,
      id_cargo INTEGER,
      id_turno INTEGER,
      dia_semana INTEGER,
      hora_entrada TEXT,
      hora_salida TEXT,
      FOREIGN KEY(id_sector) REFERENCES sectores(idSector),
      FOREIGN KEY(id_cargo) REFERENCES cargos(id_cargo),
      FOREIGN KEY(id_turno) REFERENCES turnos_horarios(id_turno)
    );

    DROP TABLE IF EXISTS historial_turnos;
    CREATE TABLE historial_turnos (
      id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo TEXT,
      id_turno INTEGER,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT,
      FOREIGN KEY(id_turno) REFERENCES turnos_horarios(id_turno)
    );
  `);

  const p = db.prepare('SELECT legajo, sectorPertenencia FROM personal LIMIT 1').get();
  
  if (p) {
    db.prepare('UPDATE personal SET cargo_id = 3 WHERE legajo = ?').run(p.legajo);
    db.prepare("INSERT INTO historial_turnos (legajo, id_turno, fecha_inicio) VALUES (?, 1, '2020-01-01')").run(p.legajo);
    db.prepare("INSERT INTO horarios (id_sector, id_cargo, id_turno, dia_semana, hora_entrada, hora_salida) VALUES (?, 3, 1, 4, '05:00', '14:00')").run(p.sectorPertenencia);
    console.log(`Empleado ${p.legajo} configurado.`);
  }
} catch(e) {
  console.error(e);
}
