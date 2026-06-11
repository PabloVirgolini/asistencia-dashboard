const Database = require('better-sqlite3');
const db = new Database('../../data2.db');
const tableInfo = db.prepare(`PRAGMA table_info(turnos_horarios)`).all();
console.log(JSON.stringify(tableInfo, null, 2));
db.close();
