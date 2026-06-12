const db = require('better-sqlite3')('data2.db');
const h = db.prepare("SELECT * FROM historial_turnos WHERE legajo LIKE '%367'").all();
console.log('Historial Theiler:', h);
const f = db.prepare("SELECT * FROM fichadas WHERE legajo LIKE '%367' AND hora LIKE '2026-06-12%'").all();
console.log('Fichadas Theiler hoy:', f);
