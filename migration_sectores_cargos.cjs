const db = require('better-sqlite3')('data2.db');

console.log('Iniciando migración de sectores_cargos...');

try {
  db.prepare('BEGIN').run();

  // Crear la nueva tabla intermedia
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sectores_cargos (
      id_sector INTEGER,
      id_cargo INTEGER,
      nivel_criticidad INTEGER DEFAULT 1,
      PRIMARY KEY (id_sector, id_cargo),
      FOREIGN KEY(id_sector) REFERENCES sectores(idSector),
      FOREIGN KEY(id_cargo) REFERENCES cargos(id_cargo)
    )
  `).run();

  // Llenar la tabla con todas las combinaciones existentes usando el nivel_criticidad de la tabla cargos
  // Hacemos CROSS JOIN solo si la tabla está vacía para evitar duplicados
  const count = db.prepare('SELECT COUNT(*) as c FROM sectores_cargos').get().c;
  if (count === 0) {
    db.prepare(`
      INSERT INTO sectores_cargos (id_sector, id_cargo, nivel_criticidad)
      SELECT s.idSector, c.id_cargo, c.nivel_criticidad
      FROM sectores s
      CROSS JOIN cargos c
    `).run();
    console.log('Tabla sectores_cargos llenada con la matriz completa.');
  } else {
    console.log('La tabla sectores_cargos ya contiene datos.');
  }

  db.prepare('COMMIT').run();
  console.log('Migración completada con éxito.');
} catch (e) {
  db.prepare('ROLLBACK').run();
  console.error('Error durante la migración:', e);
  process.exit(1);
}
