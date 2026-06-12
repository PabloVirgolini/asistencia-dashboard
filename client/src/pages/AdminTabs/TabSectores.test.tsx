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

import { useTabSectores } from './useTabSectores';
vi.mock('./useTabSectores', () => ({
  useTabSectores: vi.fn(),
}));

import { TabSectores } from './TabSectores';

describe('TabSectores Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el mensaje de carga', () => {
    (useTabSectores as any).mockReturnValue({
      sectoresQuery: { data: undefined, isFetching: true, isError: false },
      isSectoresLoading: true,
      editingSector: null,
      setEditingSector: vi.fn(),
      showForm: false,
      setShowForm: vi.fn(),
      handleEditClick: vi.fn(),
      handleDeleteClick: vi.fn(),
      handleCreateOrUpdate: vi.fn(),
      isActionPending: false
    });

    render(<TabSectores />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('debe renderizar el listado de sectores', () => {
    (useTabSectores as any).mockReturnValue({
      sectoresQuery: { data: [{ idSector: 1, descripcion: 'Administración' }], isFetching: false, isError: false },
      sectores: [{ idSector: 1, descripcion: 'Administración' }],
      isSectoresLoading: false,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      sectorFilterText: '',
      setSectorFilterText: vi.fn(),
      sortedAndFilteredSectores: [{ idSector: 1, descripcion: 'Administración' }],
      editingSector: null,
      setEditingSector: vi.fn(),
      showForm: false,
      setShowForm: vi.fn(),
      handleEditClick: vi.fn(),
      handleDeleteClick: vi.fn(),
      handleCreateOrUpdate: vi.fn(),
      isActionPending: false
    });

    render(<TabSectores />);
    expect(screen.getByText('Administración')).toBeInTheDocument();
  });
});
