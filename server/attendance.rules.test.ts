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
  removeTurnoHorario,
  getHorariosReglas,
  addHorario,
  removeHorario,
  updateHorario
} from './services/horarios.service';
import {
  getPresentesByDate
} from './services/asistencia.service';

describe('attendance.ts - Reglas y Turnos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mAll.mockReset();
    mGet.mockReset();
    mGet.mockReturnValue({ c: 0 });
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

  it('addTurnoHorario - arroja error si el turno ya existe (case insensitive)', () => {
    mGet.mockReturnValueOnce({ c: 1 });
    expect(() => addTurnoHorario('Mañana')).toThrowError('Ya existe un turno con este nombre.');
    expect(mRun).not.toHaveBeenCalled();
  });

  it('removeTurnoHorario - elimina un turno si no tiene reglas', () => {
    mGet.mockReturnValueOnce({ c: 0 });
    removeTurnoHorario(1);
    expect(mPrepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM turnos_horarios'));
    expect(mRun).toHaveBeenCalledWith(1);
  });

  it('removeTurnoHorario - arroja error si el turno tiene reglas asignadas', () => {
    mGet.mockReturnValueOnce({ count: 1 });
    expect(() => removeTurnoHorario(1)).toThrowError('No se puede eliminar el turno porque está en uso en las reglas de horarios');
    expect(mRun).not.toHaveBeenCalled();
  });

  it('getHorariosReglas - devuelve reglas', () => {
    mAll.mockReturnValue([{ id_horario: 1, dia_semana: 1, hora_entrada: '08:00:00' }]);
    
    const reglas = getHorariosReglas();
    
    expect(mPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT h.id_horario'));
    expect(reglas).toEqual([{ id_horario: 1, dia_semana: 1, hora_entrada: '08:00:00' }]);
  });

  it('addHorario - usa transaccion para insertar sin solapamiento', () => {
    addHorario(1, 2, null, 10, [1, 2], '08:00', '17:00', 'Sistema');

    expect(mPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO horarios'));
    expect(mTransaction).toHaveBeenCalled();
    // Verify run calls for two days
    expect(mRun).toHaveBeenCalledTimes(2); // 2 inserts
  });

  it('addHorario - arroja error si hay solapamiento (Sector/Cargo/Legajo en el mismo turno y día)', () => {
    mGet.mockReturnValueOnce({ c: 1 }); // Simular solapamiento
    
    expect(() => addHorario(1, 2, null, 10, [1], '08:00', '17:00', 'Sistema')).toThrowError('Ya existe una regla de horario para el día 1 con estos parámetros.');
    expect(mRun).not.toHaveBeenCalled(); // No debe insertar
  });

  it('updateHorario - actualiza correctamente un horario existente', () => {
    mGet.mockReturnValueOnce({ c: 1 }); // Simular que la regla existe
    
    updateHorario(1, '09:00', '18:00', 'Sistema');
    
    expect(mPrepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE horarios SET hora_entrada = ?, hora_salida = ?, updated_at = datetime(\'now\', \'localtime\'), updated_by = ?, es_cortado = ?, hora_entrada_2 = ?, hora_salida_2 = ? WHERE id_horario = ?'));
    expect(mRun).toHaveBeenCalledWith('09:00', '18:00', 'Sistema', 0, null, null, 1);
  });

  it('updateHorario - arroja error si el horario a actualizar no existe', () => {
    mGet.mockReturnValueOnce({ c: 0 }); // Simular que la regla no existe
    
    expect(() => updateHorario(99, '09:00', '18:00', 'Sistema')).toThrowError('La regla de horario no existe.');
    expect(mRun).not.toHaveBeenCalled();
  });

  it('removeHorario - elimina regla correctamente', () => {
    mGet.mockReturnValueOnce({ id_sector: 1, id_cargo: 2, legajo: null }) // select regla
        .mockReturnValueOnce({ c: 0 }); // select personal
    removeHorario(1);
    expect(mPrepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM horarios'));
    expect(mRun).toHaveBeenCalledWith(1);
  });

  it('removeHorario - arroja error si la regla no existe', () => {
    mGet.mockReturnValueOnce(undefined);
    expect(() => removeHorario(1)).toThrowError('La regla no existe.');
  });
});
