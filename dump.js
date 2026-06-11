import Database from 'better-sqlite3';
const db = new Database('./server/db/data2.db');
const sectores = db.prepare('SELECT idSector, descripcion FROM sectores').all();
console.log(sectores);
