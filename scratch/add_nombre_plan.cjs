const db = require('better-sqlite3')('data2.db');

try {
  db.exec('ALTER TABLE historial_turnos ADD COLUMN nombre_plan TEXT');
  console.log('Columna nombre_plan agregada exitosamente.');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('La columna nombre_plan ya existe.');
  } else {
    console.error('Error al agregar columna:', e);
  }
}
