const db = require('better-sqlite3')('T:/OficinaTecnica/Pablo/X_ COMPUTOS/1. INFRAESTRUCTURA/3. SEGURIDAD - CAMARAS - RELOJES/RELOJES/app2/database/data.db');
const f = db.prepare(`SELECT * FROM fichadas WHERE legajo LIKE '%337' AND hora LIKE '2026-06-12%'`).all();
console.log('337 in remote:', f);

// What about Garcia 122?
const f2 = db.prepare(`SELECT * FROM fichadas WHERE legajo LIKE '%122' AND hora LIKE '2026-06-12%'`).all();
console.log('122 in remote:', f2);
