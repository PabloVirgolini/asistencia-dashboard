const Database = require('better-sqlite3');
const db = new Database('data2.db');

console.log('Intento de JOIN removiendo los primeros 2 caracteres del legajo de fichadas:');
const matches = db.prepare(`
  SELECT DISTINCT p.legajo as personal_legajo, p.nombre, f.legajo as fichada_legajo
  FROM personal p
  INNER JOIN fichadas f ON p.legajo = SUBSTR(f.legajo, 3)
  LIMIT 10
`).all();
console.log(matches);

console.log('¿Hay legajos en fichadas que sean menores a 5 caracteres?');
console.log(db.prepare("SELECT legajo, count(*) as c FROM fichadas WHERE length(legajo) < 5 GROUP BY legajo LIMIT 5").all());

console.log('¿Qué pasa si convertimos a INTEGER y miramos el resto?');
const mathMatches = db.prepare(`
  SELECT DISTINCT p.legajo as personal_legajo, p.nombre, f.legajo as fichada_legajo
  FROM personal p
  INNER JOIN fichadas f ON CAST(p.legajo AS INTEGER) = CAST(SUBSTR(f.legajo, 3) AS INTEGER)
  LIMIT 10
`).all();
console.log(mathMatches);

console.log('Total matches if we strip first 2 chars:', db.prepare(`
  SELECT count(DISTINCT p.legajo) as c
  FROM personal p
  INNER JOIN fichadas f ON CAST(p.legajo AS INTEGER) = CAST(SUBSTR(f.legajo, 3) AS INTEGER)
`).get());

