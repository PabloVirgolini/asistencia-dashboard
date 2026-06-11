import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { setDbForTesting } from './db/database';
import { savePlanificacionMasiva } from './services/planificador.service';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(`
    CREATE TABLE historial_turnos (
      id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
      legajo TEXT NOT NULL,
      id_turno INTEGER,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      es_excepcional INTEGER DEFAULT 0,
      hora_entrada_excepcional TEXT,
      hora_salida_excepcional TEXT,
      id_sector_excepcional INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  setDbForTesting(db);
});

afterEach(() => {
  db.close();
  setDbForTesting(null as any);
});

describe('Planificador Service', () => {
  describe('savePlanificacionMasiva', () => {
    it('debe insertar correctamente nuevas asignaciones sin duplicar', () => {
      // Setup initial data
      db.prepare('INSERT INTO historial_turnos (legajo, id_turno, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)').run('111', 1, '2026-06-08', '2026-06-12');
      
      const newAsignaciones = [
        { legajo: '111', id_turno: 2, fecha_inicio: '2026-06-08', fecha_fin: '2026-06-12', es_excepcional: 0 },
        { legajo: '222', id_turno: 1, fecha_inicio: '2026-06-08', fecha_fin: '2026-06-12', es_excepcional: 1, hora_entrada_excepcional: '08:00', hora_salida_excepcional: '14:00' }
      ];

      savePlanificacionMasiva(newAsignaciones);

      const turnos = db.prepare('SELECT * FROM historial_turnos ORDER BY legajo ASC').all() as any[];
      
      // Debe haber exactamente 2 registros. El turno viejo de 111 debe haberse borrado.
      expect(turnos.length).toBe(2);
      
      expect(turnos[0].legajo).toBe('111');
      expect(turnos[0].id_turno).toBe(2);
      
      expect(turnos[1].legajo).toBe('222');
      expect(turnos[1].id_turno).toBe(1);
      expect(turnos[1].es_excepcional).toBe(1);
      expect(turnos[1].hora_entrada_excepcional).toBe('08:00');
    });
  });
});
