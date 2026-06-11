import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Check, Calendar, Loader2 } from 'lucide-react';
import { useCreadorReglas } from './CreadorReglas/useCreadorReglas';
import { ReglaGeneralCampos } from './CreadorReglas/ReglaGeneralCampos';
import { ReglaExcepcionCampos } from './CreadorReglas/ReglaExcepcionCampos';

const DAYS = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'X', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 0 }
];

interface CreadorReglasFormProps {
  turnos: any[];
  sectores: any[];
  cargosData: any[];
  sectoresCargos: any[];
  personal: any[];
  onAddRegla: (params: any) => Promise<void>;
  isPending: boolean;
}

export default function CreadorReglasForm({
  turnos, sectores, cargosData, sectoresCargos, personal, onAddRegla, isPending
}: CreadorReglasFormProps) {
  
  const {
    tipoRegla, setTipoRegla,
    selectedTurno, setSelectedTurno,
    selectedSector, setSelectedSector,
    selectedCargos, setSelectedCargos,
    selectedLegajo, setSelectedLegajo,
    personalSearch, setPersonalSearch,
    selectedDias, setSelectedDias,
    horaEntrada, setHoraEntrada,
    horaSalida, setHoraSalida,
    esCortado, setEsCortado,
    horaEntrada2, setHoraEntrada2,
    horaSalida2, setHoraSalida2,
    handleToggleDia,
    handleAdd
  } = useCreadorReglas(onAddRegla);

  return (
    <Card className="border-indigo-100 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 py-5 px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2 bg-indigo-100 rounded-lg shadow-sm">
            <Clock className="w-5 h-5 text-indigo-700" />
          </div>
          <CardTitle className="text-xl text-indigo-950 font-bold tracking-tight m-0 leading-none flex items-center h-full pt-1">
            CREADOR DE REGLAS
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleAdd} className="space-y-8">
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="button" variant={tipoRegla === 'general' ? 'default' : 'outline'} 
              className={`flex-1 sm:max-w-xs h-auto py-2.5 transition-all duration-300 font-medium ${tipoRegla === 'general' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 text-white' : 'text-slate-600 hover:text-indigo-600 border-slate-200 bg-white'}`}
              onClick={() => setTipoRegla('general')}>
              Regla General (Sector y Cargo)
            </Button>
            <Button type="button" variant={tipoRegla === 'excepcion' ? 'default' : 'outline'}
              className={`flex-1 sm:max-w-xs h-auto py-2.5 transition-all duration-300 font-medium ${tipoRegla === 'excepcion' ? 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-200 text-white' : 'text-slate-600 hover:text-amber-600 border-slate-200 bg-white'}`}
              onClick={() => setTipoRegla('excepcion')}>
              Excepción por Persona
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50/80 rounded-xl border border-slate-100 shadow-sm">
            <div className="space-y-2.5">
              <Label className="text-slate-700 font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Turno a Asignar
              </Label>
              <Select value={selectedTurno} onValueChange={setSelectedTurno}>
                <SelectTrigger className="bg-white shadow-sm border-slate-200"><SelectValue placeholder="Seleccionar turno..." /></SelectTrigger>
                <SelectContent>
                  {turnos?.map((t: any) => (
                    <SelectItem key={t.id_turno} value={t.id_turno.toString()}>{t.descripcion}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tipoRegla === 'general' ? (
              <ReglaGeneralCampos 
                sectores={sectores} 
                cargosData={cargosData} 
                sectoresCargos={sectoresCargos} 
                selectedSector={selectedSector} 
                setSelectedSector={setSelectedSector} 
                selectedCargos={selectedCargos} 
                setSelectedCargos={setSelectedCargos} 
              />
            ) : (
              <ReglaExcepcionCampos 
                personal={personal} 
                selectedLegajo={selectedLegajo} 
                setSelectedLegajo={setSelectedLegajo} 
                personalSearch={personalSearch} 
                setPersonalSearch={setPersonalSearch} 
              />
            )}
          </div>

          <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <Label className="text-slate-700 font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Días de la Semana
                </Label>
                {selectedDias.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setSelectedDias([])}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    (deseleccionar todo)
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                <input 
                  type="checkbox" 
                  id="esCortado" 
                  checked={esCortado} 
                  onChange={(e) => setEsCortado(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <Label htmlFor="esCortado" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Horario Cortado
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-4">
                <div className="flex flex-wrap gap-3">
                  {DAYS.map(dia => {
                    const isSelected = selectedDias.includes(dia.value);
                    return (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => handleToggleDia(dia.value)}
                        className={`w-12 h-12 rounded-full font-bold transition-all duration-300 text-sm flex items-center justify-center ${
                          isSelected 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110 ring-2 ring-indigo-600 ring-offset-2' 
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 hover:scale-105'
                        }`}
                      >
                        {dia.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className={`lg:col-span-${esCortado ? '6' : '6'} grid grid-cols-2 gap-5`}>
                <div className="space-y-2.5">
                  <Label className="text-slate-700 font-semibold">{esCortado ? 'Entrada (1)' : 'Hora Entrada'}</Label>
                  <Input type="time" value={horaEntrada} onChange={e => setHoraEntrada(e.target.value)} required className="bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-slate-700 font-semibold">{esCortado ? 'Salida (1)' : 'Hora Salida'}</Label>
                  <Input type="time" value={horaSalida} onChange={e => setHoraSalida(e.target.value)} required className="bg-slate-50 border-slate-200" />
                </div>
                
                {esCortado && (
                  <>
                    <div className="space-y-2.5">
                      <Label className="text-slate-700 font-semibold">Entrada (2)</Label>
                      <Input type="time" value={horaEntrada2} onChange={e => setHoraEntrada2(e.target.value)} required className="bg-slate-50 border-slate-200" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-slate-700 font-semibold">Salida (2)</Label>
                      <Input type="time" value={horaSalida2} onChange={e => setHoraSalida2(e.target.value)} required className="bg-slate-50 border-slate-200" />
                    </div>
                  </>
                )}
              </div>

              <div className="lg:col-span-2 flex justify-end">
                <Button type="submit" size="lg" className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all h-[44px]" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
