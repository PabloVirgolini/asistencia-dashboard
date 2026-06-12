const db = require('better-sqlite3')('data2.db');
const clocks = db.prepare(`SELECT DISTINCT reloj, COUNT(*) as c FROM fichadas WHERE hora LIKE '2026-06-11%' GROUP BY reloj`).all();
console.log('Relojes ayer:', clocks);
