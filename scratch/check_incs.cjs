const db = require('better-sqlite3')('data2.db');
const incs = db.prepare("SELECT * FROM inconsistencias_calculadas WHERE legajo = '367' AND fecha = '2026-06-12'").all();
console.log('Inconsistencias Theiler hoy:', incs);
