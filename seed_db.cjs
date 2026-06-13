const Database = require('better-sqlite3');
const crypto = require('crypto');
const db = new Database('data2.db');

try {
  console.log('Inicializando estructura de base de datos...');
  db.pragma('foreign_keys = OFF');
  
  // Eliminar tablas anteriores para asegurar una carga limpia
  db.exec(`
    DROP TABLE IF EXISTS admins;
    DROP TABLE IF EXISTS personal;
    DROP TABLE IF EXISTS sectores;
    DROP TABLE IF EXISTS cargos;
    DROP TABLE IF EXISTS sectores_cargos;
    DROP TABLE IF EXISTS turnos;
    DROP TABLE IF EXISTS turnos_horarios;
    DROP TABLE IF EXISTS horarios;
    DROP TABLE IF EXISTS historial_turnos;
    DROP TABLE IF EXISTS novedades_licencias;
    DROP TABLE IF EXISTS inconsistencias_calculadas;
    DROP TABLE IF EXISTS fichadas;
  `);

  db.pragma('foreign_keys = ON');

  // 1. Tabla Admins
  db.exec(`
    CREATE TABLE admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);

  // 2. Tabla Sectores
  db.exec(`
    CREATE TABLE sectores (
      idSector INTEGER PRIMARY KEY,
      descripcion TEXT NOT NULL
    );
  `);

  // 3. Tabla Cargos
  db.exec(`
    CREATE TABLE cargos (
      id_cargo INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      nivel_criticidad INTEGER DEFAULT 1
    );
  `);

  // 4. Tabla Intermedia Sectores_Cargos (Matriz de Criticidad)
  db.exec(`
    CREATE TABLE sectores_cargos (
      id_sector INTEGER,
      id_cargo INTEGER,
      nivel_criticidad INTEGER DEFAULT 1,
      PRIMARY KEY (id_sector, id_cargo),
      FOREIGN KEY(id_sector) REFERENCES sectores(idSector) ON DELETE CASCADE,
      FOREIGN KEY(id_cargo) REFERENCES cargos(id_cargo) ON DELETE CASCADE
    );
  `);

  // 5. Tabla de Turnos (Maestra y Horarios)
  db.exec(`
    CREATE TABLE turnos (
      id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE turnos_horarios (
      id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL
    );
  `);

  // 6. Tabla Personal
  db.exec(`
    CREATE TABLE personal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo VARCHAR(10) UNIQUE NOT NULL,
      nombre VARCHAR(80) UNIQUE NOT NULL,
      activo INTEGER DEFAULT 1,
      enCapacitacion INTEGER DEFAULT 0,
      sectorPertenencia TEXT REFERENCES sectores(idSector),
      cargo_id INTEGER REFERENCES cargos(id_cargo),
      es_rotativo INTEGER DEFAULT 0
    );
  `);

  // 7. Tabla Horarios (Mapeo de Reglas Horarias)
  db.exec(`
    CREATE TABLE horarios (
      id_horario INTEGER PRIMARY KEY AUTOINCREMENT,
      id_sector INTEGER,
      id_cargo INTEGER,
      id_turno INTEGER,
      dia_semana INTEGER, -- 0 (Domingo) a 6 (Sábado)
      hora_entrada TEXT,
      hora_salida TEXT,
      legajo TEXT,
      updated_at DATETIME,
      updated_by TEXT,
      FOREIGN KEY(id_sector) REFERENCES sectores(idSector),
      FOREIGN KEY(id_cargo) REFERENCES cargos(id_cargo),
      FOREIGN KEY(id_turno) REFERENCES turnos_horarios(id_turno)
    );
  `);

  // 8. Tabla Historial de Turnos (Mapeo de asignaciones rotativas)
  db.exec(`
    CREATE TABLE historial_turnos (
      id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo TEXT,
      id_turno INTEGER,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT,
      es_excepcional INTEGER DEFAULT 0,
      hora_entrada_excepcional TEXT,
      hora_salida_excepcional TEXT,
      id_sector_excepcional INTEGER,
      FOREIGN KEY(id_turno) REFERENCES turnos_horarios(id_turno),
      FOREIGN KEY(legajo) REFERENCES personal(legajo) ON UPDATE CASCADE ON DELETE CASCADE
    );
  `);

  // 9. Tabla Novedades y Licencias
  db.exec(`
    CREATE TABLE novedades_licencias (
      id_novedad INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo VARCHAR(10) NOT NULL,
      tipo TEXT NOT NULL,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      observaciones TEXT,
      mostrar_en_dashboard INTEGER DEFAULT 1,
      fecha_carga DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (legajo) REFERENCES personal(legajo) ON UPDATE CASCADE ON DELETE CASCADE
    );
  `);

  // 10. Tabla de Inconsistencias Calculadas
  db.exec(`
    CREATE TABLE inconsistencias_calculadas (
      id_inconsistencia INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo VARCHAR(10) NOT NULL,
      fecha TEXT NOT NULL,
      tipo TEXT NOT NULL,
      detalles TEXT,
      fecha_calculo DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (legajo) REFERENCES personal(legajo) ON UPDATE CASCADE ON DELETE CASCADE
    );
  `);

  // 11. Tabla Fichadas (Réplica de reloj biométrico)
  db.exec(`
    CREATE TABLE fichadas (
      nroFichada INTEGER PRIMARY KEY AUTOINCREMENT,
      reloj TEXT,
      hora TEXT, -- formato YYYY-MM-DD HH:MM:SS
      legajo TEXT,
      fichadaRepetida INTEGER DEFAULT 0
    );
  `);

  console.log('Tablas y restricciones creadas con éxito.');

  console.log('Insertando datos de prueba (Seed)...');

  // Insertar Administrador principal
  const hashedPass = crypto.createHash('sha256').update('admin123').digest('hex');
  db.prepare('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)').run('Administrador Frecicar', 'admin@frecicar.com', hashedPass);

  // Insertar Sectores
  const sectores = [
    { id: 1, desc: 'Producción' },
    { id: 2, desc: 'Mantenimiento' },
    { id: 3, desc: 'Administración' }
  ];
  const insertSector = db.prepare('INSERT INTO sectores (idSector, descripcion) VALUES (?, ?)');
  sectores.forEach(s => insertSector.run(s.id, s.desc));

  // Insertar Cargos
  const cargos = [
    { desc: 'Operario', criticidad: 1 },
    { desc: 'Encargado de Máquina', criticidad: 2 },
    { desc: 'Encargado General', criticidad: 3 }
  ];
  const insertCargo = db.prepare('INSERT INTO cargos (descripcion, nivel_criticidad) VALUES (?, ?)');
  cargos.forEach(c => insertCargo.run(c.desc, c.criticidad));

  // Insertar Relaciones Sectores-Cargos
  db.exec(`
    INSERT INTO sectores_cargos (id_sector, id_cargo, nivel_criticidad) VALUES
    (1, 1, 1), (1, 2, 2), (1, 3, 3),
    (2, 1, 2), (2, 3, 3),
    (3, 1, 1), (3, 3, 3)
  `);

  // Insertar Turnos Maestros
  db.exec(`
    INSERT INTO turnos (id_turno, descripcion) VALUES
    (1, 'Turno Mañana'), (2, 'Turno Tarde'), (3, 'Turno Noche'), (4, 'Administración / Cortado')
  `);

  db.exec(`
    INSERT INTO turnos_horarios (id_turno, descripcion) VALUES
    (1, 'Turno Mañana'), (2, 'Turno Tarde'), (3, 'Turno Noche'), (4, 'Administración / Cortado')
  `);

  // Insertar Personal de prueba
  // es_rotativo: 0 = Fijo, 1 = Rotativo
  const personal = [
    { legajo: '101', nombre: 'Juan Perez', sector: 1, cargo: 1, es_rotativo: 0 },
    { legajo: '102', nombre: 'Andres Gomez', sector: 1, cargo: 2, es_rotativo: 1 },
    { legajo: '103', nombre: 'Carlos Ruiz', sector: 2, cargo: 1, es_rotativo: 0 },
    { legajo: '104', nombre: 'Ana Fernandez', sector: 3, cargo: 3, es_rotativo: 0 },
    { legajo: '105', nombre: 'Maria Rodriguez', sector: 1, cargo: 3, es_rotativo: 1 }
  ];
  const insertPersonal = db.prepare('INSERT INTO personal (legajo, nombre, sectorPertenencia, cargo_id, es_rotativo) VALUES (?, ?, ?, ?, ?)');
  personal.forEach(p => insertPersonal.run(p.legajo, p.nombre, p.sector, p.cargo, p.es_rotativo));

  // Insertar Horarios Semanales Base (Lunes a Viernes, día 1 al 5)
  const insertHorarios = db.prepare('INSERT INTO horarios (id_sector, id_cargo, id_turno, dia_semana, hora_entrada, hora_salida) VALUES (?, ?, ?, ?, ?, ?)');
  
  for (let dia = 1; dia <= 5; dia++) {
    insertHorarios.run(1, 1, 1, dia, '05:00', '14:00'); // Producción -> Operario -> Mañana
    insertHorarios.run(1, 2, 2, dia, '14:00', '22:00'); // Producción -> Enc. Máquina -> Tarde
    insertHorarios.run(1, 3, 1, dia, '05:00', '14:00'); // Producción -> Enc. General -> Mañana
    insertHorarios.run(2, 1, 2, dia, '14:00', '22:00'); // Mantenimiento -> Operario -> Tarde
    insertHorarios.run(3, 3, 4, dia, '08:00', '17:00'); // Administración -> Enc. General -> Admin
  }

  // Horarios de Sábado (día 6) para el dashboard
  insertHorarios.run(1, 1, 1, 6, '05:00', '12:00');
  insertHorarios.run(1, 2, 2, 6, '12:00', '18:00');
  insertHorarios.run(1, 3, 1, 6, '05:00', '12:00');
  insertHorarios.run(2, 1, 2, 6, '12:00', '18:00');

  // Insertar historial_turnos de prueba para empleados Rotativos
  db.prepare(`
    INSERT INTO historial_turnos (legajo, id_turno, fecha_inicio, fecha_fin) VALUES
    ('102', 1, '2026-06-01', '2026-06-30'),
    ('105', 2, '2026-06-01', '2026-06-30')
  `).run();

  // Insertar Fichadas de prueba para el día del Dashboard (2026-06-13)
  // Juan Perez (101): Presente (puntual 04:58)
  // Andres Gomez (102): Presente Tarde (05:15, tolerancia es 10 min)
  // Carlos Ruiz (103): Ausente (sin fichadas)
  // Maria Rodriguez (105): Presente (fichó a las 11:55 para turno de las 12:00)
  // Ana Fernandez (104): Licencia (tiene novedad de vacaciones)
  db.prepare(`
    INSERT INTO fichadas (reloj, hora, legajo) VALUES
    ('Reloj Entrada', '2026-06-13 04:58:12', '101'),
    ('Reloj Entrada', '2026-06-13 05:15:33', '102'),
    ('Reloj Entrada', '2026-06-13 11:55:00', '105')
  `).run();

  // Insertar licencia para Ana Fernandez
  db.prepare(`
    INSERT INTO novedades_licencias (legajo, tipo, fecha_inicio, fecha_fin, observaciones, mostrar_en_dashboard) VALUES
    ('104', 'Vacaciones', '2026-06-10', '2026-06-20', 'Licencia anual por vacaciones reglamentarias.', 1)
  `).run();

  console.log('¡Base de datos data2.db inicializada y poblada con éxito!');
  console.log('Usuario Administrador por defecto:');
  console.log('  Email: admin@frecicar.com');
  console.log('  Password: admin123');

} catch (e) {
  console.error('Error al inicializar la base de datos:', e);
} finally {
  db.close();
}
