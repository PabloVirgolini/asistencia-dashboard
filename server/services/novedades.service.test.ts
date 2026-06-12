import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { setDbForTesting } from '../db/database';
import { insertNovedad, getNovedades, deleteNovedad, updateNovedad } from './novedades.service';

let db: any;

beforeEach(() => {
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  
  db.exec(`
    CREATE TABLE personal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo VARCHAR(10) UNIQUE NOT NULL,
      nombre VARCHAR(80) UNIQUE NOT NULL
    );
    CREATE TABLE novedades_licencias (
      id_novedad INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo VARCHAR(10) NOT NULL,
      tipo TEXT NOT NULL,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      observaciones TEXT,
      mostrar_en_dashboard INTEGER DEFAULT 1,
      fecha_carga DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (legajo) REFERENCES personal(legajo) ON UPDATE CASCADE ON DELETE CASCADE
    );
  `);
  
  setDbForTesting(db);
  
  db.prepare('INSERT INTO personal (legajo, nombre) VALUES (?, ?)').run('123', 'Empleado 1');
});

afterEach(() => {
  db.close();
  setDbForTesting(null);
});

describe('NovedadesService', () => {
  it('debe crear y leer novedades', () => {
    insertNovedad('123', 'Vacaciones', '2025-01-01', '2025-01-10', 'Obs');
    const novedades = getNovedades();
    expect(novedades.length).toBe(1);
    expect(novedades[0].tipo).toBe('Vacaciones');
    expect(novedades[0].nombre_empleado).toBe('Empleado 1');
  });

  it('debe rechazar solapamientos', () => {
    insertNovedad('123', 'Vacaciones', '2025-01-05', '2025-01-15');
    
    expect(() => {
      insertNovedad('123', 'ART', '2025-01-10', '2025-01-20');
    }).toThrow(/solapa/);
  });

  it('debe actualizar novedad', () => {
    insertNovedad('123', 'Vacaciones', '2025-01-01', '2025-01-10');
    const novedades = getNovedades();
    updateNovedad(novedades[0].id_novedad, '123', 'ART', '2025-01-01', '2025-01-10', 'Nueva Obs');
    
    const actualizadas = getNovedades();
    expect(actualizadas[0].tipo).toBe('ART');
    expect(actualizadas[0].observaciones).toBe('Nueva Obs');
  });

  it('debe eliminar novedad', () => {
    insertNovedad('123', 'Vacaciones', '2025-01-01', '2025-01-10');
    let novedades = getNovedades();
    deleteNovedad(novedades[0].id_novedad);
    
    novedades = getNovedades();
    expect(novedades.length).toBe(0);
  });
});
