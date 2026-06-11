import Database from 'better-sqlite3';

const db = new Database('./data2.db');

const sectores = db.prepare('SELECT idSector, descripcion FROM sectores').all();
console.log('Sectores disponibles:', sectores.length);

const noRotan = ['administración', 'administracion', 'depósito', 'deposito', 'limpieza', 'oficina técnica', 'oficina tecnica'];
const siRotan = ['almacenes', 'cartón', 'carton', 'impresoras', 'mantenimiento', 'portería', 'porteria'];

let actualizadosSi = 0;
let actualizadosNo = 0;

sectores.forEach(sector => {
  const desc = sector.descripcion.toLowerCase();
  
  if (siRotan.some(r => desc.includes(r))) {
    const res = db.prepare('UPDATE personal SET es_rotativo = 1 WHERE sectorPertenencia = ?').run(sector.idSector.toString());
    console.log(`Marcando sector ${sector.descripcion} como ROTATIVO. Empleados afectados: ${res.changes}`);
    actualizadosSi += res.changes;
  } else if (noRotan.some(r => desc.includes(r))) {
    const res = db.prepare('UPDATE personal SET es_rotativo = 0 WHERE sectorPertenencia = ?').run(sector.idSector.toString());
    console.log(`Marcando sector ${sector.descripcion} como NO ROTATIVO. Empleados afectados: ${res.changes}`);
    actualizadosNo += res.changes;
  } else {
    console.log(`Sector ${sector.descripcion} no clasificado, se deja como está.`);
  }
});

console.log(`Total empleados marcados como rotativos: ${actualizadosSi}`);
console.log(`Total empleados marcados como NO rotativos: ${actualizadosNo}`);

// Optimization for Novedades history table
console.log('Creando índices para optimizar historial de novedades...');
try {
  db.exec(`CREATE INDEX IF NOT EXISTS idx_novedades_legajo ON novedades_licencias(legajo)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_novedades_fecha ON novedades_licencias(fecha_inicio DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_personal_legajo ON personal(legajo)`);
  console.log('Índices creados exitosamente.');
} catch (e) {
  console.log('Error creando índices:', e.message);
}
