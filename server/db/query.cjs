const Database = require('better-sqlite3');
const db = new Database('../../data2.db');
const rows = db.prepare(`SELECT id_horario, dia_semana, hora_entrada, hora_salida, es_cortado, hora_entrada_2, hora_salida_2 FROM horarios WHERE id_turno = (SELECT id_turno FROM turnos_horarios WHERE descripcion = 'Arte 2')`).all();
console.log(JSON.stringify(rows, null, 2));
db.close();
