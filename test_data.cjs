const Database = require('better-sqlite3');
const db = new Database('data2.db');

try {
  // Encontrar a un empleado al azar (o el primero) para hacerlo Encargado
  const p = db.prepare('SELECT legajo, sectorPertenencia FROM personal LIMIT 1').get();
  
  if (p) {
    // 1. Asignar cargo 3 (Encargado General)
    db.prepare('UPDATE personal SET cargo_id = 3 WHERE legajo = ?').run(p.legajo);
    
    // 2. Insertar su historial de turno (Turno Mañana)
    db.prepare("INSERT INTO historial_turnos (legajo, id_turno, fecha_inicio) VALUES (?, 1, '2020-01-01')").run(p.legajo);
    
    // 3. Crear el horario esperado para él.
    // El 21 de Agosto de 2025 (la fecha de prueba) fue Jueves, lo cual es día 4 en getDay() de JS (Domingo es 0)
    db.prepare("INSERT INTO horarios (id_sector, id_cargo, id_turno, dia_semana, hora_entrada, hora_salida) VALUES (?, 3, 1, 4, '05:00', '14:00')").run(p.sectorPertenencia);
    
    console.log(`Empleado ${p.legajo} configurado como Encargado General con horario 05:00 los Jueves.`);
  }
} catch(e) {
  console.error(e);
}
