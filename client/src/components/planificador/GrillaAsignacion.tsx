import React, { useState } from 'react';
import { AlertTriangle, Info, Check, X } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface Persona {
  legajo: string;
  nombre: string;
  cargo: string;
  novedad_activa: { tipo: string; observaciones: string } | null;
}

interface AsignacionType {
  id_turno: number | null;
  es_excepcional?: boolean;
  hora_entrada_excepcional?: string;
  hora_salida_excepcional?: string;
  id_sector_excepcional?: number;
}

interface Props {
  personal: Persona[];
  turnosBase: { id_turno: number; descripcion: string }[];
  sectores: { idSector: number; descripcion: string }[];
  asignaciones: Record<string, AsignacionType>;
  onSelectTurno: (legajo: string, asig: AsignacionType) => void;
  onSelectMasivo: (asig: AsignacionType) => void;
  isLoading: boolean;
}

export function GrillaAsignacion({ personal, turnosBase, sectores, asignaciones, onSelectTurno, onSelectMasivo, isLoading }: Props) {
  const [filterText, setFilterText] = useState('');
  const [excepcionalModal, setExcepcionalModal] = useState<string | null>(null); // legajo
  const [excepForm, setExcepForm] = useState({ entrada: '08:00', salida: '17:00', sector: '' });

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

  const handleSelectChange = (legajo: string, val: string) => {
    if (val === 'excepcional') {
      setExcepForm({ entrada: '08:00', salida: '17:00', sector: sectores[0]?.idSector.toString() || '' });
      setExcepcionalModal(legajo);
    } else {
      onSelectTurno(legajo, { id_turno: parseInt(val) });
    }
  };

  const saveExcepcional = () => {
    if (excepcionalModal) {
      onSelectTurno(excepcionalModal, {
        id_turno: null,
        es_excepcional: true,
        hora_entrada_excepcional: excepForm.entrada,
        hora_salida_excepcional: excepForm.salida,
        id_sector_excepcional: parseInt(excepForm.sector)
      });
      setExcepcionalModal(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {excepcionalModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">✨ Horario Excepcional</h3>
              <button onClick={() => setExcepcionalModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Sector de Destino</label>
                <select
                  value={excepForm.sector}
                  onChange={e => setExcepForm({ ...excepForm, sector: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  {sectores.map(s => <option key={s.idSector} value={s.idSector}>{s.descripcion}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Hora Entrada</label>
                  <input
                    type="time"
                    value={excepForm.entrada}
                    onChange={e => setExcepForm({ ...excepForm, entrada: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Hora Salida</label>
                  <input
                    type="time"
                    value={excepForm.salida}
                    onChange={e => setExcepForm({ ...excepForm, salida: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setExcepcionalModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">Cancelar</button>
                <button onClick={saveExcepcional} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            onChange={(e) => onSelectMasivo({ id_turno: parseInt(e.target.value) })}
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
              const currentAsig = asignaciones[p.legajo];
              const selectValue = currentAsig ? (currentAsig.es_excepcional ? 'excepcional' : currentAsig.id_turno?.toString()) : '';
              
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
                  <td className="px-4 py-3 text-right flex flex-col items-end gap-1">
                    <select
                      value={selectValue || ''}
                      onChange={(e) => handleSelectChange(p.legajo, e.target.value)}
                      disabled={isAbsent}
                      className={`px-3 py-2 border rounded-md text-sm w-56 outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isAbsent 
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                          : currentAsig ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'bg-white border-slate-300'
                      }`}
                    >
                      <option value="" disabled>Seleccionar Turno</option>
                      {turnosBase.map(t => (
                        <option key={t.id_turno} value={t.id_turno}>{t.descripcion}</option>
                      ))}
                      <option value="excepcional">✨ Horario Excepcional</option>
                    </select>
                    {currentAsig?.es_excepcional && (
                      <span className="text-xs text-indigo-600 font-medium px-2 py-1 bg-indigo-100 rounded-md">
                        {currentAsig.hora_entrada_excepcional} a {currentAsig.hora_salida_excepcional} ({sectores.find(s => s.idSector === currentAsig.id_sector_excepcional)?.descripcion})
                      </span>
                    )}
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
