import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { setDbForTesting } from '../db/database';
import { getAdminByEmail, createAdmin, isValidDate, getTodayDate } from './admin.service';

let db: any;

beforeEach(() => {
  db = new Database(':memory:');
  
  db.exec(`
    CREATE TABLE admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);
  
  setDbForTesting(db);
});

afterEach(() => {
  db.close();
  setDbForTesting(null);
});

describe('AdminService', () => {
  it('debe crear un admin y leerlo por email', () => {
    createAdmin('Admin Test', 'admin@test.com', 'hashedpassword');
    
    const admin = getAdminByEmail('admin@test.com');
    expect(admin).toBeDefined();
    expect(admin?.name).toBe('Admin Test');
    expect(admin?.password).toBe('hashedpassword');
  });

  it('debe retornar undefined si el email no existe', () => {
    const admin = getAdminByEmail('no@existe.com');
    expect(admin).toBeUndefined();
  });

  it('debe validar fechas correctamente', () => {
    expect(isValidDate('2025-01-01')).toBe(true);
    expect(isValidDate('invalid')).toBe(false);
    expect(isValidDate('2025/01/01')).toBe(false);
  });

  it('debe obtener la fecha de hoy en formato correcto', () => {
    const today = getTodayDate();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isValidDate(today)).toBe(true);
  });
});
