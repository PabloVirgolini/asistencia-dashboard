const db = require('better-sqlite3')('data2.db');
const f = db.prepare(`SELECT * FROM fichadas WHERE legajo LIKE '%438' AND hora LIKE '2026-06-12%'`).all();
console.log('438:', f);

const f2 = db.prepare(`SELECT * FROM fichadas WHERE legajo LIKE '%337' AND hora LIKE '2026-06-12%'`).all();
console.log('337:', f2);

// Are there ANY punches today?
const any = db.prepare(`SELECT COUNT(*) as c FROM fichadas WHERE hora LIKE '2026-06-12%'`).get();
console.log('Total hoy:', any);
