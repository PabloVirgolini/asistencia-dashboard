import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Briefcase } from 'lucide-react';

interface ReglaGeneralCamposProps {
  sectores: any[];
  cargosData: any[];
  sectoresCargos: any[];
  selectedSector: string;
  setSelectedSector: (val: string) => void;
  selectedCargos: string[];
  setSelectedCargos: (val: string[]) => void;
}

export function ReglaGeneralCampos({
  sectores, cargosData, sectoresCargos,
  selectedSector, setSelectedSector,
  selectedCargos, setSelectedCargos
}: ReglaGeneralCamposProps) {
  return (
    <>
      <div className="space-y-2.5">
        <Label className="text-slate-700 font-semibold flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-400" /> Sector
        </Label>
        <Select value={selectedSector} onValueChange={(val) => { setSelectedSector(val); setSelectedCargos([]); }}>
          <SelectTrigger className="bg-white shadow-sm border-slate-200"><SelectValue placeholder="Seleccionar sector..." /></SelectTrigger>
          <SelectContent>
            {sectores?.map((s: any) => (
              <SelectItem key={s.idSector} value={s.idSector.toString()}>{s.idSector} - {s.descripcion}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2.5">
        <Label className="text-slate-700 font-semibold flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-400" /> Cargos
        </Label>
        <div className="bg-white border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto shadow-sm">
          {!selectedSector ? (
            <p className="text-sm text-slate-400">Selecciona un sector primero</p>
          ) : (
            cargosData
              ?.filter((c: any) => {
                if (!sectoresCargos) return false;
                const mapped = sectoresCargos.find((sc: any) => sc.id_sector.toString() === selectedSector && sc.id_cargo === c.id_cargo);
                return !!mapped;
              })
              .map((c: any) => (
                <div key={c.id_cargo} className="flex items-center space-x-3 mb-2 last:mb-0">
                  <input
                    type="checkbox"
                    id={`cargo-${c.id_cargo}`}
                    checked={selectedCargos.includes(c.id_cargo.toString())}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCargos([...selectedCargos, c.id_cargo.toString()]);
                      } else {
                        setSelectedCargos(selectedCargos.filter(id => id !== c.id_cargo.toString()));
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <Label htmlFor={`cargo-${c.id_cargo}`} className="text-sm font-medium text-slate-700 cursor-pointer">
                    {c.descripcion}
                  </Label>
                </div>
              ))
          )}
        </div>
      </div>
    </>
  );
}
