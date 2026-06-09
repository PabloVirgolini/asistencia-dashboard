const Database = require('better-sqlite3');
const db = new Database('data2.db');
const tables = db.prepare("SELECT sql FROM sqlite_master WHERE type='table'").all();
console.log(JSON.stringify(tables, null, 2));
