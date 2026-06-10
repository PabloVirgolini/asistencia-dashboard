import Database from 'better-sqlite3';

const db = new Database('data2.db');

const sector = 2; // Impresoras
const cargos = [3]; // Operario or Encargado General

const rows = db.prepare('SELECT * FROM personal WHERE sectorPertenencia = ?').all(sector);
console.log("Personal en sector", sector, ":", rows);

const cargoRows = db.prepare('SELECT * FROM cargos').all();
console.log("Cargos disponibles:", cargoRows);
