const db = require('better-sqlite3')('data2.db');
const incs = db.prepare(`SELECT * FROM inconsistencias_calculadas WHERE fecha = '2026-06-12' AND legajo = '438'`).all();
console.log('Inconsistencias 438:', incs);
