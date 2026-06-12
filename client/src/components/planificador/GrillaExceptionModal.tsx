import React from 'react';
import { X } from 'lucide-react';

interface GrillaExceptionModalProps {
  excepcionalModal: string | null;
  setExcepcionalModal: (legajo: string | null) => void;
  excepForm: { entrada: string; salida: string; sector: string };
  setExcepForm: (form: { entrada: string; salida: string; sector: string }) => void;
  sectores: { idSector: number; descripcion: string }[];
  saveExcepcional: () => void;
}

export function GrillaExceptionModal({
  excepcionalModal,
  setExcepcionalModal,
  excepForm,
  setExcepForm,
  sectores,
  saveExcepcional
}: GrillaExceptionModalProps) {
  if (!excepcionalModal) return null;

  return (
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
  );
}
