const db = require('better-sqlite3')('data2.db');

let queryPersonal = `
  SELECT 
    p.legajo, p.nombre, p.es_rotativo, p.sectorPertenencia, p.cargo_id,
    s.descripcion as sector, c.descripcion as cargo, sc.nivel_criticidad
  FROM personal p
  LEFT JOIN sectores s ON p.sectorPertenencia = s.idSector
  LEFT JOIN cargos c ON p.cargo_id = c.id_cargo
  LEFT JOIN sectores_cargos sc ON sc.id_cargo = c.id_cargo AND sc.id_sector = p.sectorPertenencia
  WHERE p.activo = 1
`;

const res = db.prepare(queryPersonal).all();
const legajos = {};
let hasDup = false;
res.forEach(r => {
  if (legajos[r.legajo]) {
    console.log('DUPLICATE:', r);
    hasDup = true;
  }
  legajos[r.legajo] = true;
});
if (!hasDup) console.log('No duplicates found in personal query.');
