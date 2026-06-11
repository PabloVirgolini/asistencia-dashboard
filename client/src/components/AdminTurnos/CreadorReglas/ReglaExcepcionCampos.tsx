import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Check } from 'lucide-react';

interface ReglaExcepcionCamposProps {
  personal: any[];
  selectedLegajo: string;
  setSelectedLegajo: (val: string) => void;
  personalSearch: string;
  setPersonalSearch: (val: string) => void;
}

export function ReglaExcepcionCampos({
  personal,
  selectedLegajo,
  setSelectedLegajo,
  personalSearch,
  setPersonalSearch
}: ReglaExcepcionCamposProps) {
  const filteredPersonal = personalSearch.length > 1 
    ? personal?.filter(p => 
        p.nombre.toLowerCase().includes(personalSearch.toLowerCase()) || 
        p.legajo.includes(personalSearch)
      ) 
    : [];

  return (
    <div className="space-y-2.5 md:col-span-2 relative">
      <Label className="text-slate-700 font-semibold flex items-center gap-2">
        <User className="w-4 h-4 text-slate-400" /> Buscar Empleado (Excepción)
      </Label>
      {selectedLegajo ? (
        <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-1.5 rounded-full">
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="font-medium text-emerald-900">
              {personal?.find((p: any) => p.legajo === selectedLegajo)?.nombre} <span className="text-emerald-600/70 text-sm">({selectedLegajo})</span>
            </span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedLegajo('')} className="h-8 hover:bg-emerald-50 text-emerald-700">Cambiar</Button>
        </div>
      ) : (
        <div>
          <Input 
            placeholder="Escribe el nombre o legajo..." 
            value={personalSearch} 
            onChange={e => setPersonalSearch(e.target.value)}
            className="bg-white shadow-sm border-slate-200" 
          />
          {personalSearch.length > 1 && filteredPersonal && filteredPersonal.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto">
              {filteredPersonal.map((p: any) => (
                <div 
                  key={p.legajo}
                  className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-50 last:border-0 transition-colors"
                  onClick={() => {
                    setSelectedLegajo(p.legajo);
                    setPersonalSearch('');
                  }}
                >
                  <span className="font-semibold text-slate-800">{p.nombre}</span> 
                  <span className="text-slate-500 text-xs ml-2 bg-slate-100 px-2 py-0.5 rounded-md">Legajo: {p.legajo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
