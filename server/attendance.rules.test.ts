import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocking better-sqlite3 first
const mAll = vi.fn();
const mGet = vi.fn();
const mRun = vi.fn();
const mTransaction = vi.fn((cb) => cb);

const mPrepare = vi.fn(() => ({
  all: mAll,
  get: mGet,
  run: mRun
}));

const mDb = {
  pragma: vi.fn(),
  exec: vi.fn(),
  prepare: mPrepare,
  transaction: mTransaction,
  close: vi.fn(),
};

vi.mock('better-sqlite3', () => {
  return { default: vi.fn(() => mDb) };
});

import { 
  getTurnosHorarios, 
  addTurnoHorario,
  getHorariosReglas,
  addHorario,
  getPresentesByDate
} from './attendance';

describe('attendance.ts - Reglas y Turnos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mAll.mockReset();
    mGet.mockReset();
    mRun.mockReset();
    mPrepare.mockClear();
    mTransaction.mockClear();
  });

  it('getTurnosHorarios - devuelve lista de turnos', () => {
    mAll.mockReturnValue([{ id_turno: 1, descripcion: 'Mañana' }]);
    
    const turnos = getTurnosHorarios();
    
    expect(mPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT id_turno, descripcion FROM turnos_horarios'));
    expect(turnos).toEqual([{ id_turno: 1, descripcion: 'Mañana' }]);
  });

  it('addTurnoHorario - inserta un turno', () => {
    addTurnoHorario('Tarde');
    expect(mPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO turnos_horarios'));
    expect(mRun).toHaveBeenCalledWith('Tarde');
  });

  it('getHorariosReglas - devuelve reglas', () => {
    mAll.mockReturnValue([{ id_horario: 1, dia_semana: 1, hora_entrada: '08:00:00' }]);
    
    const reglas = getHorariosReglas();
    
    expect(mPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT h.id_horario'));
    expect(reglas).toEqual([{ id_horario: 1, dia_semana: 1, hora_entrada: '08:00:00' }]);
  });

  it('addHorario - usa transaccion para eliminar e insertar', () => {
    // addHorario(id_sector, id_cargo, legajo, id_turno, dias, hora_entrada, hora_salida)
    addHorario(1, 2, null, 10, [1, 2], '08:00', '17:00');

    expect(mPrepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM horarios'));
    expect(mPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO horarios'));
    expect(mTransaction).toHaveBeenCalled();
    // Verify run calls for two days
    expect(mRun).toHaveBeenCalledTimes(4); // 2 deletes + 2 inserts
  });

  describe('getPresentesByDate - Prioridad de Reglas (LlegadaTarde)', () => {
    it('marca llegadaTarde = true si llega después de la hora esperada por regla general', () => {
      // 1. Mock the first query (records)
      mAll.mockReturnValueOnce([{
        legajo: '001',
        nombre: 'Juan',
        sector: 'Producción',
        cargo: 'Operario',
        nivel_criticidad: 1,
        sectorPertenencia: 10,
        cargo_id: 20,
        id_turno: 5,
        primeraFichada: '2026-06-09 08:15:00' // arrived at 08:15
      }]);

      // 2. Mock the second query (horariosDelDia)
      mAll.mockReturnValueOnce([
        {
          id_turno: 5,
          id_sector: 10,
          id_cargo: 20,
          legajo: null,
          hora_entrada: '08:00' // expected 08:00
        }
      ]);

      const presentes = getPresentesByDate('2026-06-09');
      
      expect(presentes[0].llegadaTarde).toBe(true);
      expect(presentes[0].nombre).toBe('Juan');
    });

    it('marca llegadaTarde = false si llega antes de la hora esperada por regla general', () => {
      mAll.mockReturnValueOnce([{
        legajo: '001',
        nombre: 'Juan',
        sectorPertenencia: 10,
        cargo_id: 20,
        id_turno: 5,
        primeraFichada: '2026-06-09 07:50:00' // arrived at 07:50
      }]);

      mAll.mockReturnValueOnce([
        { id_turno: 5, id_sector: 10, id_cargo: 20, legajo: null, hora_entrada: '08:00' }
      ]);

      const presentes = getPresentesByDate('2026-06-09');
      expect(presentes[0].llegadaTarde).toBe(false);
    });

    it('Prioridad: Excepción por legajo anula la regla general', () => {
      mAll.mockReturnValueOnce([{
        legajo: '002',
        nombre: 'Maria',
        sectorPertenencia: 10,
        cargo_id: 20,
        id_turno: 5,
        primeraFichada: '2026-06-09 08:45:00' // arrived at 08:45
      }]);

      mAll.mockReturnValueOnce([
        // Regla general para el sector+cargo (espera a las 08:00)
        { id_turno: 5, id_sector: 10, id_cargo: 20, legajo: null, hora_entrada: '08:00' },
        // Excepción por legajo (espera a las 09:00)
        { id_turno: 5, id_sector: null, id_cargo: null, legajo: '002', hora_entrada: '09:00' }
      ]);

      const presentes = getPresentesByDate('2026-06-09');
      
      // Llegó 08:45, esperado 09:00 por excepción -> false
      expect(presentes[0].llegadaTarde).toBe(false);
    });
    
    it('Aplica regla general correctamente si no hay excepción', () => {
      mAll.mockReturnValueOnce([{
        legajo: '003',
        nombre: 'Pedro',
        sectorPertenencia: 10,
        cargo_id: 20,
        id_turno: 5,
        primeraFichada: '2026-06-09 08:10:00' // arrived at 08:10
      }]);

      mAll.mockReturnValueOnce([
        // Regla general (08:00)
        { id_turno: 5, id_sector: 10, id_cargo: 20, legajo: null, hora_entrada: '08:00' },
        // Excepción de otro legajo
        { id_turno: 5, id_sector: null, id_cargo: null, legajo: '002', hora_entrada: '09:00' }
      ]);

      const presentes = getPresentesByDate('2026-06-09');
      
      // Llegó 08:10, esperado 08:00 (no es la excepción) -> true
      expect(presentes[0].llegadaTarde).toBe(true);
    });
  });
});
