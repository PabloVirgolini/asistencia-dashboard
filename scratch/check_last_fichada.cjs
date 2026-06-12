const db = require('better-sqlite3')('data2.db');
const last = db.prepare(`SELECT * FROM fichadas ORDER BY hora DESC LIMIT 5`).all();
console.log('Ultimas fichadas en local DB:', last);

// Is the remote DB accessible?
try {
  db.exec(`ATTACH DATABASE 'T:/OficinaTecnica/Pablo/X_ COMPUTOS/1. INFRAESTRUCTURA/3. SEGURIDAD - CAMARAS - RELOJES/RELOJES/app2/database/data.db' AS remoteDB`);
  const remoteLast = db.prepare(`SELECT * FROM remoteDB.fichadas ORDER BY hora DESC LIMIT 5`).all();
  console.log('Ultimas fichadas en REMOTE DB:', remoteLast);
} catch (e) {
  console.log('No se pudo acceder a la DB remota:', e.message);
}
