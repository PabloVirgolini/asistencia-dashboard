// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlanificadorSemanal } from './usePlanificadorSemanal';

// Mock trpc
const mGetSectors = vi.fn();
const mGetTurnos = vi.fn();
const mGetPlanificable = vi.fn();
const mSaveMutation = vi.fn();
const mToggleMutation = vi.fn();
const mGetPlanificacionGuardada = vi.fn();

vi.mock('@/lib/trpc', () => {
  return {
    trpc: {
      useContext: vi.fn(() => ({
        client: {
          admin: {
            getPlanificacionGuardada: { query: mGetPlanificacionGuardada }
          }
        }
      })),
      attendance: {
        getSectors: { useQuery: () => mGetSectors() }
      },
      admin: {
        getTurnosPorSector: { useQuery: () => mGetTurnos() },
        getPlanificable: { useQuery: () => mGetPlanificable() },
        savePlanificacion: { useMutation: () => ({ mutate: mSaveMutation, isPending: false }) },
        toggleCapacitacion: { useMutation: () => ({ mutateAsync: mToggleMutation }) }
      }
    }
  };
});

describe('usePlanificadorSemanal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mGetSectors.mockReturnValue({ data: [] });
    mGetTurnos.mockReturnValue({ data: [] });
    mGetPlanificable.mockReturnValue({ 
      data: [
        { legajo: '111', nombre: 'Juan', cargo: 'Operario' },
        { legajo: '222', nombre: 'Pedro', cargo: 'Operario' }
      ],
      isLoading: false,
      refetch: vi.fn()
    });
  });

  it('debe actualizar una asignacion de turno usando handleSelectTurno', () => {
    const { result } = renderHook(() => usePlanificadorSemanal());

    act(() => {
      result.current.handleSelectTurno('111', { id_turno: 1 });
    });

    expect(result.current.asignaciones['111']).toBeDefined();
    expect(result.current.asignaciones['111'].id_turno).toBe(1);
    expect(result.current.asignaciones['222']).toBeUndefined();
  });

  it('debe aplicar un turno masivamente a todos los planificables usando handleSelectMasivo', () => {
    const { result } = renderHook(() => usePlanificadorSemanal());

    act(() => {
      result.current.handleSelectMasivo({ id_turno: 2 });
    });

    expect(result.current.asignaciones['111']).toBeDefined();
    expect(result.current.asignaciones['111'].id_turno).toBe(2);
    expect(result.current.asignaciones['222']).toBeDefined();
    expect(result.current.asignaciones['222'].id_turno).toBe(2);
  });

  it('debe vaciar el plan usando handleResetPlan', () => {
    const { result } = renderHook(() => usePlanificadorSemanal());

    act(() => {
      result.current.setSector('1');
      result.current.setFechaInicio('2026-06-08');
      result.current.handleSelectTurno('111', { id_turno: 1 });
    });

    expect(result.current.sector).toBe('1');
    expect(result.current.asignaciones['111'].id_turno).toBe(1);

    act(() => {
      result.current.handleResetPlan();
    });

    expect(result.current.sector).toBe('');
    expect(result.current.fechaInicio).toBe('');
    expect(Object.keys(result.current.asignaciones).length).toBe(0);
  });
});
