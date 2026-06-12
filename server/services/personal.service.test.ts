import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { setDbForTesting } from '../db/database';
import { 
  insertPersonal, getActivePersonal, updatePersonal, deletePersonal,
  insertSector, updateSector, deleteSector, getSectors,
  insertCargo, updateCargo, deleteCargo, getCargos
} from './personal.service';

let db: any;

beforeEach(() => {
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  
  db.exec(`
    CREATE TABLE sectores (
      idSector INTEGER PRIMARY KEY,
      descripcion TEXT NOT NULL
    );
    CREATE TABLE cargos (
      id_cargo INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL
    );
    CREATE TABLE sectores_cargos (
      id_sector INTEGER,
      id_cargo INTEGER,
      nivel_criticidad INTEGER DEFAULT 0,
      PRIMARY KEY (id_sector, id_cargo),
      FOREIGN KEY (id_sector) REFERENCES sectores(idSector) ON DELETE CASCADE,
      FOREIGN KEY (id_cargo) REFERENCES cargos(id_cargo) ON DELETE CASCADE
    );
    CREATE TABLE personal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo VARCHAR(10) UNIQUE NOT NULL,
      nombre VARCHAR(80) UNIQUE NOT NULL,
      activo INTEGER DEFAULT 1,
      enCapacitacion INTEGER DEFAULT 0,
      sectorPertenencia TEXT REFERENCES sectores(idSector),
      cargo_id INTEGER REFERENCES cargos(id_cargo),
      es_rotativo INTEGER DEFAULT 0
    );
    CREATE TABLE historial_turnos (
      id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo TEXT,
      id_turno INTEGER,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT,
      es_excepcional INTEGER DEFAULT 0,
      hora_entrada_excepcional TEXT,
      hora_salida_excepcional TEXT,
      id_sector_excepcional INTEGER,
      FOREIGN KEY (legajo) REFERENCES personal(legajo) ON UPDATE CASCADE ON DELETE CASCADE
    );
    CREATE TABLE novedades_licencias (
      id_novedad INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo VARCHAR(10) NOT NULL,
      tipo TEXT NOT NULL,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      observaciones TEXT,
      FOREIGN KEY (legajo) REFERENCES personal(legajo) ON UPDATE CASCADE ON DELETE CASCADE
    );
    CREATE TABLE horarios (
      id_regla INTEGER PRIMARY KEY AUTOINCREMENT,
      id_sector INTEGER,
      id_cargo INTEGER,
      FOREIGN KEY (id_sector) REFERENCES sectores(idSector),
      FOREIGN KEY (id_cargo) REFERENCES cargos(id_cargo)
    );
  `);
  
  setDbForTesting(db);
});

afterEach(() => {
  db.close();
  setDbForTesting(null);
});

describe('PersonalService', () => {
  describe('Sectores y Cargos', () => {
    it('debe crear, leer, actualizar y eliminar sectores', () => {
      insertSector(1, 'Sector A');
      let sectors = getSectors();
      expect(sectors.length).toBe(1);
      expect(sectors[0].descripcion).toBe('Sector A');

      updateSector(1, 'Sector B');
      sectors = getSectors();
      expect(sectors[0].descripcion).toBe('Sector B');

      deleteSector(1);
      expect(getSectors().length).toBe(0);
    });

    it('debe crear, leer, actualizar y eliminar cargos', () => {
      insertCargo('Cargo A');
      let cargos = getCargos();
      expect(cargos.length).toBe(1);
      expect(cargos[0].descripcion).toBe('Cargo A');

      updateCargo(cargos[0].id_cargo, 'Cargo B');
      cargos = getCargos();
      expect(cargos[0].descripcion).toBe('Cargo B');

      deleteCargo(cargos[0].id_cargo);
      expect(getCargos().length).toBe(0);
    });
  });

  describe('Personal ABM', () => {
    beforeEach(() => {
      insertSector(1, 'Sector Test');
      insertCargo('Cargo Test');
    });

    it('debe crear personal correctamente', () => {
      const cargos = getCargos();
      insertPersonal('12345', 'Juan Perez', '1', cargos[0].id_cargo, 0, false);
      const personal = getActivePersonal();
      expect(personal.length).toBe(1);
      expect(personal[0].legajo).toBe('12345');
      expect(personal[0].nombre).toBe('Juan Perez');
      expect(personal[0].sectorPertenencia).toBe('Sector Test');
    });

    it('debe actualizar personal y realizar ON UPDATE CASCADE en legajo', () => {
      const cargos = getCargos();
      insertPersonal('12345', 'Juan Perez', '1', cargos[0].id_cargo, 0, false);
      
      // Simular un historial de turno
      db.prepare('INSERT INTO historial_turnos (legajo, id_turno, fecha_inicio) VALUES (?, ?, ?)').run('12345', 1, '2025-01-01');
      
      updatePersonal('12345', '54321', 'Juan P.', '1', 1, cargos[0].id_cargo, 0, false);
      
      const personal = getActivePersonal();
      expect(personal[0].legajo).toBe('54321');
      expect(personal[0].nombre).toBe('Juan P.');

      // Verificar CASCADE
      const historial = db.prepare('SELECT * FROM historial_turnos WHERE legajo = ?').get('54321');
      expect(historial).toBeDefined();
    });

    it('debe fallar al eliminar cargo en uso', () => {
      const cargos = getCargos();
      insertPersonal('12345', 'Juan Perez', '1', cargos[0].id_cargo, 0, false);
      
      expect(() => deleteCargo(cargos[0].id_cargo)).toThrow(/asignado a uno o más empleados/);
    });
  });
});
