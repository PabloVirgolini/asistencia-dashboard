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

import { useTabCargos } from './useTabCargos';
vi.mock('./useTabCargos', () => ({
  useTabCargos: vi.fn(),
}));

import { TabCargos } from './TabCargos';

describe('TabCargos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el mensaje de carga', () => {
    (useTabCargos as any).mockReturnValue({
      cargosQuery: { data: undefined, isFetching: true, isError: false },
      isCargosLoading: true,
      editingCargo: null,
      setEditingCargo: vi.fn(),
      cargoDesc: '',
      setCargoDesc: vi.fn(),
      inlineCargoDesc: '',
      setInlineCargoDesc: vi.fn(),
      showForm: false,
      setShowForm: vi.fn(),
      handleEditClick: vi.fn(),
      handleDeleteClick: vi.fn(),
      handleCreateOrUpdate: vi.fn(),
      isActionPending: false
    });

    render(<TabCargos />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('debe renderizar el listado de cargos', () => {
    (useTabCargos as any).mockReturnValue({
      cargosQuery: { data: [{ id_cargo: 1, descripcion: 'Operario General' }], isFetching: false, isError: false },
      cargos: [{ id_cargo: 1, descripcion: 'Operario General' }],
      isCargosLoading: false,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      cargoFilterText: '',
      setCargoFilterText: vi.fn(),
      sortedAndFilteredCargos: [{ id_cargo: 1, descripcion: 'Operario General' }],
      editingCargo: null,
      setEditingCargo: vi.fn(),
      cargoDesc: '',
      setCargoDesc: vi.fn(),
      inlineCargoDesc: '',
      setInlineCargoDesc: vi.fn(),
      showForm: false,
      setShowForm: vi.fn(),
      handleEditClick: vi.fn(),
      handleDeleteClick: vi.fn(),
      handleCreateOrUpdate: vi.fn(),
      isActionPending: false
    });

    render(<TabCargos />);
    expect(screen.getByText('Operario General')).toBeInTheDocument();
  });
});
