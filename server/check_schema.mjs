import Database from 'better-sqlite3';

const db = new Database('data2.db');
const row = db.prepare('SELECT sql FROM sqlite_master WHERE type="table" AND name="cargos"').get();
console.log(row.sql);
