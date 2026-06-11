import { getDb } from '../db/database';

export interface AdminRecord {
  id: number;
  name: string;
  email: string;
  password?: string;
}

export function getAdminByEmail(email: string): AdminRecord | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT id, name, email, password FROM admins WHERE email = ?');
  return stmt.get(email) as AdminRecord | undefined;
}

export function createAdmin(name: string, email: string, passwordHash: string): void {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)');
  stmt.run(name, email, passwordHash);
}

export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function closeDb() {
  const db = getDb();
  if (db) {
    db.close();
  }
}
