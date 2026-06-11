import { describe, it, expect, vi } from 'vitest';
import Database from 'better-sqlite3';

vi.mock('better-sqlite3', () => {
  const mDb = {
    pragma: vi.fn(),
    exec: vi.fn(),
    prepare: vi.fn(() => ({ all: vi.fn().mockReturnValue([{ id_turno: 1 }]) })),
  };
  return { default: vi.fn(() => mDb) };
});

import { getTurnosHorarios } from './services/horarios.service';

describe('mock test', () => {
  it('works', () => {
    const res = getTurnosHorarios();
    expect(res).toEqual([{ id_turno: 1 }]);
  });
});
