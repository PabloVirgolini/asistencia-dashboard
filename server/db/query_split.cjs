const Database = require('better-sqlite3');
const db = new Database('../../data2.db');
const rows = db.prepare(`SELECT t.descripcion as turno, h.id_horario, h.dia_semana, h.hora_entrada, h.hora_salida, h.es_cortado, h.hora_entrada_2, h.hora_salida_2 FROM horarios h JOIN turnos_horarios t ON h.id_turno = t.id_turno WHERE h.es_cortado = 1 OR h.es_cortado = 'true' OR h.es_cortado = '1'`).all();
console.log(JSON.stringify(rows, null, 2));
db.close();
