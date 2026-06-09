const Database = require('better-sqlite3');
const path = require('path');

const localDbPath = path.join(__dirname, 'data2.db');
const remoteDbPath = 'T:/OficinaTecnica/Pablo/X_ COMPUTOS/1. INFRAESTRUCTURA/3. SEGURIDAD - CAMARAS - RELOJES/RELOJES/app2/database/data.db';

console.log('Abriendo bases de datos...');
const db = new Database(localDbPath);

try {
  // Adjuntar la base de datos remota
  db.exec(`ATTACH DATABASE '${remoteDbPath}' AS remoteDB`);
  
  console.log('Vaciando tabla fichadas local...');
  db.exec('DELETE FROM fichadas');
  
  console.log('Importando fichadas recientes desde disco T: ...');
  const info = db.prepare('INSERT INTO fichadas SELECT * FROM remoteDB.fichadas').run();
  
  console.log(`¡Sincronización completa! Se importaron ${info.changes} fichadas.`);
} catch (error) {
  console.error('Error durante la sincronización:', error);
} finally {
  db.close();
}
