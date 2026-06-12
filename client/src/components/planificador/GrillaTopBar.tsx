import React from 'react';

interface GrillaTopBarProps {
  quickAssignTurno: number | '';
  setQuickAssignTurno: (val: number | '') => void;
  turnosBase: { id_turno: number; descripcion: string }[];
  filterText: string;
  setFilterText: (val: string) => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  showUnassignedOnly: boolean;
  setShowUnassignedOnly: (val: boolean) => void;
  onSelectMasivo: (asig: { id_turno: number }) => void;
}

export function GrillaTopBar({
  quickAssignTurno,
  setQuickAssignTurno,
  turnosBase,
  filterText,
  setFilterText,
  handleInputKeyDown,
  showUnassignedOnly,
  setShowUnassignedOnly,
  onSelectMasivo
}: GrillaTopBarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
      <div className="flex flex-col gap-3 w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-start sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Asignación Rápida con Enter:</span>
            <select
              value={quickAssignTurno}
              onChange={(e) => setQuickAssignTurno(e.target.value === '' ? '' : Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-indigo-50/50 hover:bg-indigo-50 transition-colors focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
            >
              <option value="">Apagado</option>
              {turnosBase.map(t => (
                <option key={t.id_turno} value={t.id_turno}>{t.descripcion}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Filtrar y presionar Enter..."
            className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
          <input 
            type="checkbox" 
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            checked={showUnassignedOnly}
            onChange={(e) => setShowUnassignedOnly(e.target.checked)}
          />
          Ocultar personal con turno ya asignado
        </label>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-600">Asignación Masiva:</span>
        <select 
          onChange={(e) => onSelectMasivo({ id_turno: parseInt(e.target.value) })}
          className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-indigo-500"
          value=""
        >
          <option value="" disabled>Elegir Turno...</option>
          {turnosBase.map(t => (
            <option key={t.id_turno} value={t.id_turno}>{t.descripcion}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
