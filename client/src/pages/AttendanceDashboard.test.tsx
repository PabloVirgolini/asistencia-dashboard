// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { useAttendanceDashboard } from '@/hooks/useAttendanceDashboard';
vi.mock('@/hooks/useAttendanceDashboard', () => ({
  useAttendanceDashboard: vi.fn(),
}));

import AttendanceDashboard from './AttendanceDashboard';

describe('AttendanceDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el loader principal', () => {
    (useAttendanceDashboard as any).mockReturnValue({
      selectedDate: '2026-06-12',
      setSelectedDate: vi.fn(),
      selectedSector: 'todos',
      setSelectedSector: vi.fn(),
      showEncargados: false,
      setShowEncargados: vi.fn(),
      toleranciaMinutos: 0,
      setToleranciaMinutos: vi.fn(),
      sectorsQuery: { data: [] },
      attendanceQuery: { data: undefined, isFetching: true, refetch: vi.fn() },
      timeRemaining: { minutes: 1, seconds: 0 },
      isLoading: true,
      isError: false
    });

    render(<AttendanceDashboard />);
    expect(screen.getByText(/Cargando datos de asistencia/i)).toBeInTheDocument();
  });

  it('debe renderizar los datos del dashboard y los grupos de turnos', () => {
    (useAttendanceDashboard as any).mockReturnValue({
      selectedDate: '2026-06-12',
      setSelectedDate: vi.fn(),
      selectedSector: 'todos',
      setSelectedSector: vi.fn(),
      showEncargados: false,
      setShowEncargados: vi.fn(),
      toleranciaMinutos: 0,
      setToleranciaMinutos: vi.fn(),
      sectorsQuery: { data: [] },
      attendanceQuery: { 
        data: {
          date: '2026-06-12',
          sector: 'todos',
          summary: {
            totalActivos: 10,
            presentes: 8,
            ausentes: 1,
            licencias: 1,
            porcentajePresentes: 80,
            porcentajeAusentes: 10
          },
          grupos: [
            {
              id_turno: 1,
              nombre_turno: 'Turno Mañana TEST',
              esperados: 10,
              presentes: [],
              tarde: [],
              ausentes: [],
              licencias: [],
              fichadas_inesperadas: []
            }
          ]
        }, 
        isFetching: false, 
        refetch: vi.fn() 
      },
      timeRemaining: { minutes: 1, seconds: 0 },
      isLoading: false,
      isError: false
    });

    render(<AttendanceDashboard />);
    // Verifica que se dibuje el titulo (removido)
    // Verifica que se dibuje el turno
    expect(screen.getByText('Turno Mañana TEST')).toBeInTheDocument();
  });
});
