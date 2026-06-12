import React, { useState } from 'react';
import { AlertTriangle, Info, Check, X, UserPlus, Zap } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { GrillaExceptionModal } from './GrillaExceptionModal';
import { GrillaTopBar } from './GrillaTopBar';

interface Persona {
  legajo: string;
  nombre: string;
  cargo: string;
  enCapacitacion: boolean;
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
  onToggleCapacitacion: (vars: { legajo: string, estado: boolean }) => void;
  isLoading: boolean;
}

const COLORS = ['bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300', 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-300', 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300', 'bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-300', 'bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 border-fuchsia-300'];

const getShortcutInfo = (descripcion: string) => {
  const match = descripcion.match(/^Turno\s+(.*)/i);
  if (match) {
    const rest = match[1];
    return {
      prefix: descripcion.substring(0, descripcion.length - rest.length),
      letter: rest.charAt(0),
      suffix: rest.slice(1)
    };
  }
  return {
    prefix: '',
    letter: descripcion.charAt(0),
    suffix: descripcion.slice(1)
  };
};

export function GrillaAsignacion({ personal, turnosBase, sectores, asignaciones, onSelectTurno, onSelectMasivo, onToggleCapacitacion, isLoading }: Props) {
  const [filterText, setFilterText] = useState('');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [quickAssignTurno, setQuickAssignTurno] = useState<number | ''>('');
  const [excepcionalModal, setExcepcionalModal] = useState<string | null>(null); // legajo
  const [excepForm, setExcepForm] = useState({ entrada: '08:00', salida: '17:00', sector: '' });

  const filtered = personal.filter(p => {
    // 1. Text filter
    const matchesText = p.nombre.toLowerCase().includes(filterText.toLowerCase()) || p.legajo.includes(filterText);
    if (!matchesText) return false;

    // 2. Unassigned filter
    if (showUnassignedOnly) {
      const currentAsig = asignaciones[p.legajo];
      // Has an active assignment (either a standard turno or an exception)
      const hasAssignment = currentAsig && (currentAsig.id_turno !== null || currentAsig.es_excepcional);
      if (hasAssignment) return false;
    }

    return true;
  });

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (quickAssignTurno !== '' && filtered.length > 0) {
        filtered.forEach(p => {
          onSelectTurno(p.legajo, { id_turno: Number(quickAssignTurno) });
        });
        // Limpiamos el filtro para que puedan seguir cargando la siguiente persona de inmediato
        setFilterText('');
      }
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;

      const key = e.key.toLowerCase();
      const turnoMatch = turnosBase.find(t => {
        const info = getShortcutInfo(t.descripcion);
        return info.letter.toLowerCase() === key;
      });
      
      if (turnoMatch && filtered.length > 0) {
        e.preventDefault();
        filtered.forEach(p => {
          onSelectTurno(p.legajo, { id_turno: turnoMatch.id_turno });
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, turnosBase, onSelectTurno]);

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

  const getAssignedCount = (id_turno: number | 'excepcional') => {
    return Object.entries(asignaciones).filter(([legajo, asig]) => {
      if (id_turno === 'excepcional') {
        if (!asig.es_excepcional) return false;
      } else {
        if (asig.id_turno !== id_turno) return false;
      }
      const p = personal.find(pers => pers.legajo === legajo);
      if (!p) return false;
      return !p.enCapacitacion;
    }).length;
  };



  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <GrillaExceptionModal
        excepcionalModal={excepcionalModal}
        setExcepcionalModal={setExcepcionalModal}
        excepForm={excepForm}
        setExcepForm={setExcepForm}
        sectores={sectores}
        saveExcepcional={saveExcepcional}
      />

      <GrillaTopBar
        quickAssignTurno={quickAssignTurno}
        setQuickAssignTurno={setQuickAssignTurno}
        turnosBase={turnosBase}
        filterText={filterText}
        setFilterText={setFilterText}
        handleInputKeyDown={handleInputKeyDown}
        showUnassignedOnly={showUnassignedOnly}
        setShowUnassignedOnly={setShowUnassignedOnly}
        onSelectMasivo={onSelectMasivo}
      />

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-y-auto max-h-[600px] relative">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700 w-64">Empleado / Cargo</th>
              <th className="px-4 py-3 font-semibold text-slate-700 w-40 text-center">Estado</th>
              {turnosBase.map((t, i) => {
                const info = getShortcutInfo(t.descripcion);
                return (
                <th key={t.id_turno} className="px-2 py-3 font-semibold text-slate-700 text-center min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span title={`Atajo: Ctrl + ${info.letter.toUpperCase()}`}>
                      {info.prefix}<u className="decoration-indigo-400 decoration-2 underline-offset-2">{info.letter}</u>{info.suffix}
                    </span>
                    <span className="text-xs mt-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700" title="Empleados efectivos asignados">
                      {getAssignedCount(t.id_turno)} asignados
                    </span>
                  </div>
                </th>
              )})}
              <th className="px-2 py-3 font-semibold text-slate-700 text-center min-w-[120px]">
                <div className="flex flex-col items-center">
                  <span>Excepcional</span>
                  <span className="text-xs mt-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {getAssignedCount('excepcional')} asig.
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => {
              const isAbsent = !!p.novedad_activa;
              const currentAsig = asignaciones[p.legajo];
              
              return (
                <tr key={p.legajo} className={`transition-colors ${isAbsent ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {p.nombre}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.legajo} • {p.cargo}</div>
                  </td>
                  <td className="px-4 py-3 text-center flex flex-col items-center gap-2">
                    {isAbsent ? (
                      <span className="inline-flex items-center justify-center gap-1 w-full px-2 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle size={14} /> {p.novedad_activa?.tipo}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1 w-full px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Check size={14} /> Disponible
                      </span>
                    )}
                    <button
                      onClick={() => onToggleCapacitacion({ legajo: p.legajo, estado: !p.enCapacitacion })}
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors w-full ${
                        p.enCapacitacion 
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {p.enCapacitacion ? 'En Capacitacion' : 'Normal'}
                    </button>
                  </td>
                  
                  {turnosBase.map((t, i) => {
                    const isSelected = currentAsig && !currentAsig.es_excepcional && currentAsig.id_turno === t.id_turno;
                    const colorClass = COLORS[i % COLORS.length];
                    const info = getShortcutInfo(t.descripcion);
                    
                    return (
                      <td key={t.id_turno} className="px-2 py-3 text-center">
                        <button
                          onClick={() => onSelectTurno(p.legajo, { id_turno: t.id_turno })}
                          className={`w-full py-2 px-3 text-xs font-medium rounded-lg border transition-all duration-200 flex items-center justify-center
                            ${isSelected ? `${colorClass} shadow-sm ring-1 ring-offset-1 ring-${colorClass.split('-')[1]}-400` : 
                              'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                            }
                          `}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 mr-1" />}
                          <span>{info.prefix}<u className="decoration-2 underline-offset-2 opacity-70">{info.letter}</u>{info.suffix}</span>
                        </button>
                      </td>
                    );
                  })}
                  
                  <td className="px-2 py-3 text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <button
                        onClick={() => {
                          setExcepForm({ entrada: '08:00', salida: '17:00', sector: sectores[0]?.idSector.toString() || '' });
                          setExcepcionalModal(p.legajo);
                        }}
                        className={`w-full py-2 px-3 text-xs font-medium rounded-lg border transition-all duration-200 flex items-center justify-center
                          ${currentAsig?.es_excepcional ? 'bg-slate-800 text-white border-slate-900 shadow-sm' : 
                            'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }
                        `}
                      >
                        {currentAsig?.es_excepcional ? <Check className="w-3.5 h-3.5 mr-1" /> : <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />}
                        Excepcional
                      </button>
                      {currentAsig?.es_excepcional && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {currentAsig.hora_entrada_excepcional}-{currentAsig.hora_salida_excepcional}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700 sticky bottom-0">
            <tr>
              <td colSpan={2} className="px-4 py-3 text-right">Total Efectivo Asignado:</td>
              {turnosBase.map(t => (
                <td key={`foot-${t.id_turno}`} className="px-2 py-3 text-center text-lg text-indigo-700">
                  {getAssignedCount(t.id_turno)}
                </td>
              ))}
              <td className="px-2 py-3 text-center text-lg text-slate-700">
                {getAssignedCount('excepcional')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
