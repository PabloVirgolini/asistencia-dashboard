import React, { useState } from 'react';
import { AlertTriangle, Info, Check } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface Persona {
  legajo: string;
  nombre: string;
  cargo: string;
  novedad_activa: { tipo: string; observaciones: string } | null;
}

interface Props {
  personal: Persona[];
  turnosBase: { id_turno: number; descripcion: string }[];
  asignaciones: Record<string, number>;
  onSelectTurno: (legajo: string, id_turno: number) => void;
  onSelectMasivo: (id_turno: number) => void;
  isLoading: boolean;
}

export function GrillaAsignacion({ personal, turnosBase, asignaciones, onSelectTurno, onSelectMasivo, isLoading }: Props) {
  const [filterText, setFilterText] = useState('');

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500">Cargando personal...</div>;
  }

  if (personal.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-500">
          <Info className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
          No se encontró personal rotativo activo para este sector en las fechas indicadas.
        </CardContent>
      </Card>
    );
  }

  const filtered = personal.filter(p => 
    p.nombre.toLowerCase().includes(filterText.toLowerCase()) || 
    p.legajo.includes(filterText)
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <input
          type="text"
          placeholder="Filtrar empleado..."
          className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Asignación Masiva:</span>
          <select 
            onChange={(e) => onSelectMasivo(parseInt(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-indigo-500"
            defaultValue=""
          >
            <option value="" disabled>Elegir Turno...</option>
            {turnosBase.map(t => (
              <option key={t.id_turno} value={t.id_turno}>{t.descripcion}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Empleado</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Cargo</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Estado (Novedades)</th>
              <th className="px-4 py-3 font-semibold text-slate-700 text-right">Turno Asignado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => {
              const isAbsent = !!p.novedad_activa;
              return (
                <tr key={p.legajo} className={`transition-colors ${isAbsent ? 'bg-slate-50' : 'hover:bg-indigo-50/30'}`}>
                  <td className="px-4 py-3">
                    <div className={`font-medium ${isAbsent ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {p.nombre}
                    </div>
                    <div className="text-xs text-slate-400">{p.legajo}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.cargo}</td>
                  <td className="px-4 py-3">
                    {isAbsent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle size={14} />
                        {p.novedad_activa?.tipo}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Check size={14} />
                        Disponible
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={asignaciones[p.legajo] || ''}
                      onChange={(e) => onSelectTurno(p.legajo, parseInt(e.target.value))}
                      disabled={isAbsent}
                      className={`px-3 py-2 border rounded-md text-sm w-48 outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isAbsent 
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                          : asignaciones[p.legajo] ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'bg-white border-slate-300'
                      }`}
                    >
                      <option value="" disabled>Seleccionar Turno</option>
                      {turnosBase.map(t => (
                        <option key={t.id_turno} value={t.id_turno}>{t.descripcion}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
