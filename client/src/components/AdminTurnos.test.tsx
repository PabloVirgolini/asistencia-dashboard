// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// Mock matchMedia para los componentes de Radix UI / Shadcn
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

// ResizeObserver mock
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock de trpc
const mGetTurnos = vi.fn();
const mGetReglas = vi.fn();
const mGetSectors = vi.fn();
const mGetCargos = vi.fn();
const mGetPersonal = vi.fn();
const mAddTurno = vi.fn();
const mAddHorario = vi.fn();

vi.mock('@/lib/trpc', () => {
  return {
    trpc: {
      useContext: vi.fn(() => ({
        admin: {
          getTurnosHorarios: { invalidate: vi.fn() },
          getHorariosReglas: { invalidate: vi.fn() }
        }
      })),
      admin: {
        getTurnosHorarios: { useQuery: (...args: any[]) => mGetTurnos(...args) },
        getHorariosReglas: { useQuery: (...args: any[]) => mGetReglas(...args) },
        getCargos: { useQuery: (...args: any[]) => mGetCargos(...args) },
        getSectoresCargos: { useQuery: () => ({ data: [], isLoading: false }) },
        getPersonal: { useQuery: (...args: any[]) => mGetPersonal(...args) },
        addTurnoHorario: { useMutation: () => ({ mutateAsync: mAddTurno, isPending: false }) },
        removeTurnoHorario: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
        addHorario: { useMutation: () => ({ mutateAsync: mAddHorario, isPending: false }) },
        removeHorario: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
        duplicateSectorRules: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
        updateHorario: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }) },
      },
      attendance: {
        getSectors: { useQuery: (...args: any[]) => mGetSectors(...args) }
      }
    }
  };
});

import AdminTurnos from './AdminTurnos';

describe('AdminTurnos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mGetTurnos.mockReturnValue({ data: [{ id_turno: 1, descripcion: 'Turno Mañana' }], isLoading: false });
    mGetReglas.mockReturnValue({ 
      data: [{ id_horario: 1, turno: 'Turno Mañana', dia_semana: 1, hora_entrada: '08:00', hora_salida: '17:00', sector: 'Producción', cargo: 'Operario' }], 
      isLoading: false 
    });
    mGetSectors.mockReturnValue({ data: [{ idSector: 1, descripcion: 'Producción' }] });
    mGetCargos.mockReturnValue({ data: [{ id_cargo: 1, descripcion: 'Operario' }] });
    mGetPersonal.mockReturnValue({ data: [{ legajo: '001', nombre: 'Juan' }] });
  });

  it('debe renderizar el componente y mostrar la tabla de matriz de horarios', () => {
    render(<AdminTurnos />);
    
    expect(screen.getByText('Gestión de Turnos')).toBeInTheDocument();
    expect(screen.getAllByText(/Turno Mañana/i).length).toBeGreaterThan(0);
    
    // Verifica que se renderice la regla en la tabla
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('17:00')).toBeInTheDocument();
  });

  it('debe permitir crear un nuevo turno', async () => {
    render(<AdminTurnos />);
    
    const inputTurno = screen.getAllByPlaceholderText('Ej: Turno Noche')[0];
    fireEvent.change(inputTurno, { target: { value: 'Turno Tarde' } });
    
    const form = inputTurno.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(mAddTurno).toHaveBeenCalledWith({ descripcion: 'Turno Tarde' });
    });
  });
});
