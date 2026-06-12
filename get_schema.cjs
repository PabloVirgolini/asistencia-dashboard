const Database = require('better-sqlite3');
const db = new Database('data2.db');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='personal'").get().sql);
