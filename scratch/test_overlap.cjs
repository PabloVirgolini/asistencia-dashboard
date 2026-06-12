const db = require('better-sqlite3')('data2.db');

// Insert a 1-week plan
db.exec(`INSERT INTO historial_turnos (legajo, id_turno, fecha_inicio, fecha_fin, nombre_plan) VALUES ('999', 1, '2026-06-08', '2026-06-14', 'Plan Semanal')`);

// Insert a 1-day exception
db.exec(`INSERT INTO historial_turnos (legajo, id_turno, fecha_inicio, fecha_fin, nombre_plan) VALUES ('999', 2, '2026-06-10', '2026-06-10', 'Enroque Puntual')`);

// Test the query for Wednesday (10th)
const wednesday = db.prepare(`SELECT legajo, id_turno, nombre_plan FROM historial_turnos WHERE fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?) ORDER BY (julianday(COALESCE(fecha_fin, '2099-12-31')) - julianday(fecha_inicio)) DESC`).all('2026-06-10', '2026-06-10');

console.log('Result for Wed 10th (Should be 2 - Enroque Puntual):', wednesday);

// Test the query for Thursday (11th)
const thursday = db.prepare(`SELECT legajo, id_turno, nombre_plan FROM historial_turnos WHERE fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?) ORDER BY (julianday(COALESCE(fecha_fin, '2099-12-31')) - julianday(fecha_inicio)) DESC`).all('2026-06-11', '2026-06-11');

console.log('Result for Thu 11th (Should be 1 - Plan Semanal):', thursday);

// Clean up
db.exec(`DELETE FROM historial_turnos WHERE legajo = '999'`);
