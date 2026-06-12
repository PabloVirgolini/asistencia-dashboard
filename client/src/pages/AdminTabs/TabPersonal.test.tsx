// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// Mock matchMedia
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

// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock the Custom Hook
import { useTabPersonal } from './useTabPersonal';
vi.mock('./useTabPersonal', () => ({
  useTabPersonal: vi.fn(),
}));

import { TabPersonal } from './TabPersonal';

describe('TabPersonal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el skeleton de carga', () => {
    (useTabPersonal as any).mockReturnValue({
      personalQuery: { data: undefined, isFetching: true, isError: false },
      sectoresQuery: { data: [] },
      cargosQuery: { data: [] },
      isPersonalLoading: true,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      editingPerson: null,
      setEditingPerson: vi.fn(),
      showForm: false,
      setShowForm: vi.fn(),
      cargosFiltradosPorSector: [],
      filteredPersonal: [],
      handleEditClick: vi.fn(),
      handleDeleteClick: vi.fn(),
      handleCreateOrUpdate: vi.fn(),
      isActionPending: false
    });

    render(<TabPersonal />);
    
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('debe renderizar el listado de personal', () => {
    (useTabPersonal as any).mockReturnValue({
      personalQuery: { data: [{ legajo: '123', nombre: 'Test Employee', sector: 'Testing', cargo: 'Tester', es_rotativo: false, enCapacitacion: false, activo: true }], isFetching: false, isError: false },
      personal: [{ legajo: '123', nombre: 'Test Employee', sector: 'Testing', cargo: 'Tester', es_rotativo: false, enCapacitacion: false, activo: true }],
      sectoresQuery: { data: [] },
      cargosQuery: { data: [] },
      sectores: [],
      cargos: [],
      isPersonalLoading: false,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      personalFilterText: '',
      setPersonalFilterText: vi.fn(),
      sortedAndFilteredPersonal: [{ legajo: '123', nombre: 'Test Employee', sector: 'Testing', cargo: 'Tester', es_rotativo: false, enCapacitacion: false, activo: true }],
      editingPerson: null,
      setEditingPerson: vi.fn(),
      showForm: false,
      setShowForm: vi.fn(),
      cargosFiltradosPorSector: [],
      handleEditClick: vi.fn(),
      handleDeleteClick: vi.fn(),
      handleCreateOrUpdate: vi.fn(),
      isActionPending: false
    });

    render(<TabPersonal />);
    
    expect(screen.getByText('Test Employee')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });
});
