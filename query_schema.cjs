const Database = require('better-sqlite3');
const db = new Database('./data2.db');

const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='personal'").get();
console.log(row.sql);

const fkRow = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='fichadas'").get();
console.log(fkRow.sql);
