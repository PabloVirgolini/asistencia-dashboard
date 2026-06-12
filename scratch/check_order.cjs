const db = require('better-sqlite3')('data2.db');
console.log(db.prepare("SELECT legajo, fecha_inicio, fecha_fin, (julianday(COALESCE(fecha_fin, '2099-12-31')) - julianday(fecha_inicio)) as diff FROM historial_turnos ORDER BY diff DESC LIMIT 5").all());
