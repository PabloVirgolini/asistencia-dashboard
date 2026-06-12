const db = require('better-sqlite3')('../../data2.db');
const fechaStr = '2026-06-12';

const p = db.prepare('SELECT * FROM personal WHERE legajo = ?').get('438');
console.log('Personal:', p);

const horarios = db.prepare('SELECT * FROM horarios').all();

const jsDate = new Date(`${fechaStr}T12:00:00`);
const diaSemana = jsDate.getDay();

console.log('diaSemana:', diaSemana);

let t_id = null;
const matchingDia = horarios.filter(h => h.dia_semana === diaSemana);
console.log('matchingDia len:', matchingDia.length);

const exc = matchingDia.find(h => h.legajo === p.legajo);
if (exc) { 
  t_id = exc.id_turno; 
  console.log('Found by exc:', exc);
} 
else {
  const matching = matchingDia.filter(h => h.id_sector == p.sectorPertenencia && (h.id_cargo == p.cargo_id || h.id_cargo === null));
  console.log('Matching sector/cargo:', matching);
  if (matching.length > 0) t_id = matching[0].id_turno;
}

console.log('t_id resolved:', t_id);

const hs = horarios.filter(h => h.id_turno === t_id && h.dia_semana === diaSemana);
let r = hs.find(h => h.legajo === p.legajo);
if (!r) r = hs.find(h => h.id_sector == p.sectorPertenencia && (h.id_cargo == p.cargo_id || h.id_cargo === null));

console.log('regla resolved:', r);
