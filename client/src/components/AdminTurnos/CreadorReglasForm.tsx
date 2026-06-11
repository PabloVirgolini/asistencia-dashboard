import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Check, Building, Briefcase, User, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  onAddRegla: (params: { tipoRegla: string, id_sector: number | null, id_cargo: number | null, legajo: string | null, id_turno: number, dias: number[], hora_entrada: string, hora_salida: string, selectedCargos: string[], es_cortado: number, hora_entrada_2: string | null, hora_salida_2: string | null }) => Promise<void>;
  isPending: boolean;
}

export default function CreadorReglasForm({
  turnos, sectores, cargosData, sectoresCargos, personal, onAddRegla, isPending
}: CreadorReglasFormProps) {
  const [tipoRegla, setTipoRegla] = useState<'general' | 'excepcion'>('general');
  const [selectedTurno, setSelectedTurno] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedCargos, setSelectedCargos] = useState<string[]>([]);
  const [selectedLegajo, setSelectedLegajo] = useState<string>('');
  const [personalSearch, setPersonalSearch] = useState('');
  const [selectedDias, setSelectedDias] = useState<number[]>([]);
  const [horaEntrada, setHoraEntrada] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [esCortado, setEsCortado] = useState(false);
  const [horaEntrada2, setHoraEntrada2] = useState('');
  const [horaSalida2, setHoraSalida2] = useState('');

  const filteredPersonal = personalSearch.length > 1 
    ? personal?.filter(p => 
        p.nombre.toLowerCase().includes(personalSearch.toLowerCase()) || 
        p.legajo.includes(personalSearch)
      ) 
    : [];

  const handleToggleDia = (dia: number) => {
    setSelectedDias(prev => 
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    );
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurno) return toast.error('Debes seleccionar un turno');
    if (selectedDias.length === 0) return toast.error('Debes seleccionar al menos un día');
    if (!horaEntrada || !horaSalida) return toast.error('Debes ingresar hora de entrada y salida');
    if (esCortado && (!horaEntrada2 || !horaSalida2)) return toast.error('Debes ingresar el segundo horario');
    
    if (tipoRegla === 'general') {
      if (!selectedSector || selectedCargos.length === 0) return toast.error('Debes seleccionar sector y al menos un cargo');
    } else {
      if (!selectedLegajo) return toast.error('Debes seleccionar un empleado');
    }

    try {
      await onAddRegla({
        tipoRegla,
        id_sector: selectedSector ? parseInt(selectedSector) : null,
        id_cargo: null,
        legajo: selectedLegajo || null,
        id_turno: parseInt(selectedTurno),
        dias: selectedDias,
        hora_entrada: horaEntrada,
        hora_salida: horaSalida,
        selectedCargos,
        es_cortado: esCortado ? 1 : 0,
        hora_entrada_2: esCortado ? horaEntrada2 : null,
        hora_salida_2: esCortado ? horaSalida2 : null
      });
      setSelectedDias([]);
      setHoraEntrada('');
      setHoraSalida('');
      setEsCortado(false);
      setHoraEntrada2('');
      setHoraSalida2('');
    } catch (err: any) {
      // toast is handled in parent
    }
  };

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
            ) : (
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
