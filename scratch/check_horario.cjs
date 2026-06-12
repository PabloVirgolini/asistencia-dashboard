const db = require('better-sqlite3')('data2.db');
console.log(db.prepare("SELECT * FROM horarios WHERE id_turno = 2 LIMIT 1").all());
