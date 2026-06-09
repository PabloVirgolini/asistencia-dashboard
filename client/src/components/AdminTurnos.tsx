import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Trash2, Plus, Clock, Loader2, Check, ArrowUpDown, Search,
  ChevronRight, Building, Briefcase, User, Calendar, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

const DAYS = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'X', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 0 }
];

const TreeNode = ({ title, icon: Icon, children, defaultExpanded = false, isException = false, rightContent = null }: any) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer transition-all duration-200 border-b last:border-b-0 ${
          isException 
            ? 'border-amber-200/50 hover:bg-amber-100/50 text-amber-900 bg-amber-50/30' 
            : 'border-slate-100 hover:bg-slate-50 text-slate-800'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <button className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''} ${isException ? 'text-amber-600' : 'text-slate-400 hover:text-indigo-600'}`}>
            <ChevronRight className="w-4 h-4" />
          </button>
          {Icon && <Icon className={`w-4 h-4 ${isException ? 'text-amber-600' : 'text-slate-500'}`} />}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {rightContent && <div onClick={e => e.stopPropagation()}>{rightContent}</div>}
      </div>
      {expanded && (
        <div className={`ml-5 pl-4 border-l-2 my-1 ${isException ? 'border-amber-200' : 'border-slate-100'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default function AdminTurnos() {
  const trpcContext = trpc.useContext();
  
  // Queries
  const { data: turnos, isLoading: isTurnosLoading } = trpc.admin.getTurnosHorarios.useQuery();
  const { data: reglas, isLoading: isReglasLoading } = trpc.admin.getHorariosReglas.useQuery();
  const { data: sectores } = trpc.attendance.getSectors.useQuery();
  const { data: cargos } = trpc.admin.getCargos.useQuery();
  const { data: personal } = trpc.admin.getPersonal.useQuery();

  // Mutations
  const addTurno = trpc.admin.addTurnoHorario.useMutation();
  const removeTurno = trpc.admin.removeTurnoHorario.useMutation();
  const addRegla = trpc.admin.addHorario.useMutation();
  const removeRegla = trpc.admin.removeHorario.useMutation();

  // Sort & Filter Turnos
  const [turnoSortConfig, setTurnoSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [turnoFilter, setTurnoFilter] = useState('');

  const sortedAndFilteredTurnos = React.useMemo(() => {
    let result = turnos ? [...turnos] : [];
    if (turnoFilter) {
      result = result.filter((t: any) => 
        t.descripcion.toLowerCase().includes(turnoFilter.toLowerCase()) ||
        t.id_turno.toString().includes(turnoFilter)
      );
    }
    if (turnoSortConfig) {
      result.sort((a: any, b: any) => {
        if (a[turnoSortConfig.key] < b[turnoSortConfig.key]) return turnoSortConfig.direction === 'asc' ? -1 : 1;
        if (a[turnoSortConfig.key] > b[turnoSortConfig.key]) return turnoSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [turnos, turnoSortConfig, turnoFilter]);

  const handleTurnoSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (turnoSortConfig && turnoSortConfig.key === key && turnoSortConfig.direction === 'asc') direction = 'desc';
    setTurnoSortConfig({ key, direction });
  };

  // Filter and Group Reglas
  const [reglaFilter, setReglaFilter] = useState('');

  const filteredReglas = React.useMemo(() => {
    let result = reglas ? [...reglas] : [];
    if (reglaFilter) {
      const lf = reglaFilter.toLowerCase();
      result = result.filter((r: any) => 
        r.turno?.toLowerCase().includes(lf) ||
        r.sector?.toLowerCase().includes(lf) ||
        r.cargo?.toLowerCase().includes(lf) ||
        r.legajo?.toLowerCase().includes(lf)
      );
    }
    return result;
  }, [reglas, reglaFilter]);

  const { groupedGeneral, groupedExceptions } = React.useMemo(() => {
    const general: Record<string, any> = {};
    const exceptions: Record<string, any> = {};
    
    filteredReglas.forEach((r: any) => {
      const turnoName = r.turno || 'Sin Turno';
      if (!r.legajo) {
        if (!general[turnoName]) general[turnoName] = {};
        const sectorName = r.sector || 'Sin Sector';
        if (!general[turnoName][sectorName]) general[turnoName][sectorName] = {};
        const cargoName = r.cargo || 'Sin Cargo';
        if (!general[turnoName][sectorName][cargoName]) general[turnoName][sectorName][cargoName] = [];
        general[turnoName][sectorName][cargoName].push(r);
      } else {
        if (!exceptions[turnoName]) exceptions[turnoName] = {};
        if (!exceptions[turnoName][r.legajo]) exceptions[turnoName][r.legajo] = [];
        exceptions[turnoName][r.legajo].push(r);
      }
    });
    
    const sortByDay = (a: any, b: any) => {
      const dayA = a.dia_semana === 0 ? 7 : a.dia_semana;
      const dayB = b.dia_semana === 0 ? 7 : b.dia_semana;
      return dayA - dayB;
    };
    
    Object.values(general).forEach((sectores: any) => {
      Object.values(sectores).forEach((cargos: any) => {
        Object.values(cargos).forEach((rules: any) => {
          rules.sort(sortByDay);
        });
      });
    });

    Object.values(exceptions).forEach((legajos: any) => {
      Object.values(legajos).forEach((rules: any) => {
        rules.sort(sortByDay);
      });
    });
    
    return { groupedGeneral: general, groupedExceptions: exceptions };
  }, [filteredReglas]);

  // State Turnos (Etiquetas)
  const [nuevoTurnoDesc, setNuevoTurnoDesc] = useState('');

  // State Reglas (Formulario)
  const [tipoRegla, setTipoRegla] = useState<'general' | 'excepcion'>('general');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedCargo, setSelectedCargo] = useState<string>('');
  const [selectedTurno, setSelectedTurno] = useState<string>('');
  const [selectedDias, setSelectedDias] = useState<number[]>([]);
  const [horaEntrada, setHoraEntrada] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  
  // Buscador de personal
  const [personalSearch, setPersonalSearch] = useState('');
  const [selectedLegajo, setSelectedLegajo] = useState<string>('');

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

  const handleAddTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTurnoDesc.trim()) return;
    try {
      await addTurno.mutateAsync({ descripcion: nuevoTurnoDesc });
      toast.success('Turno creado');
      setNuevoTurnoDesc('');
      trpcContext.admin.getTurnosHorarios.invalidate();
    } catch (err) {
      toast.error('Error al crear turno');
    }
  };

  const handleRemoveTurno = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este turno? Podría afectar a las reglas asociadas.')) return;
    try {
      await removeTurno.mutateAsync({ id_turno: id });
      toast.success('Turno eliminado');
      trpcContext.admin.getTurnosHorarios.invalidate();
    } catch (err) {
      toast.error('Error al eliminar turno');
    }
  };

  const handleAddRegla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurno) return toast.error('Debes seleccionar un turno');
    if (selectedDias.length === 0) return toast.error('Debes seleccionar al menos un día');
    if (!horaEntrada || !horaSalida) return toast.error('Debes ingresar hora de entrada y salida');
    
    if (tipoRegla === 'general') {
      if (!selectedSector || !selectedCargo) return toast.error('Debes seleccionar sector y cargo');
    } else {
      if (!selectedLegajo) return toast.error('Debes seleccionar un empleado');
    }

    try {
      await addRegla.mutateAsync({
        id_sector: tipoRegla === 'general' ? parseInt(selectedSector) : null,
        id_cargo: tipoRegla === 'general' ? parseInt(selectedCargo) : null,
        legajo: tipoRegla === 'excepcion' ? selectedLegajo : null,
        id_turno: parseInt(selectedTurno),
        dias: selectedDias,
        hora_entrada: horaEntrada,
        hora_salida: horaSalida
      });
      toast.success('Regla(s) guardada(s) correctamente');
      trpcContext.admin.getHorariosReglas.invalidate();
      // UX Pattern: Formulario Persistente (solo limpiamos días y horas opcionalmente, pero lo dejamos por comodidad)
    } catch (err) {
      toast.error('Error al guardar la regla');
    }
  };

  const handleRemoveRegla = async (id: number) => {
    if (!confirm('¿Eliminar esta regla de horario?')) return;
    try {
      await removeRegla.mutateAsync({ id_horario: id });
      toast.success('Regla eliminada');
      trpcContext.admin.getHorariosReglas.invalidate();
    } catch (err) {
      toast.error('Error al eliminar regla');
    }
  };

  const getDiaName = (num: number) => {
    const map: any = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };
    return map[num];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Columna Izquierda: Formularios */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-6">
        {/* SECCIÓN 1: Etiquetas de Turno */}
        <Card>
        <CardHeader>
          <CardTitle className="text-lg">Etiquetas de Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTurno} className="flex flex-col sm:flex-row gap-4 sm:items-end mb-6">
            <div className="flex-1 w-full max-w-sm">
              <Label>Nombre del Turno</Label>
              <Input placeholder="Ej: Turno Mañana" value={nuevoTurnoDesc} onChange={e => setNuevoTurnoDesc(e.target.value)} required />
            </div>
            <Button type="submit" disabled={addTurno.isPending} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Agregar
            </Button>
          </form>
          
          <div className="mb-4 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Buscar turno..." 
              className="pl-9"
              value={turnoFilter}
              onChange={(e) => setTurnoFilter(e.target.value)}
            />
          </div>

          {isTurnosLoading ? <Loader2 className="animate-spin mx-auto text-indigo-600" /> : (
            <div className="border rounded-md max-w-2xl">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleTurnoSort('id_turno')}>
                      <div className="flex items-center gap-1 font-semibold text-slate-700">ID <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleTurnoSort('descripcion')}>
                      <div className="flex items-center gap-1 font-semibold text-slate-700">Descripción <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredTurnos.map((t: any) => (
                    <TableRow key={t.id_turno}>
                      <TableCell>{t.id_turno}</TableCell>
                      <TableCell className="font-medium">{t.descripcion}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveTurno(t.id_turno)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedAndFilteredTurnos.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-slate-500 py-4">No se encontraron turnos</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 2: Creador de Reglas */}
      <Card className="border-indigo-200 shadow-md">
        <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-lg text-indigo-900">Creador Inteligente de Reglas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAddRegla} className="space-y-6">
            
            {/* Tipo de Regla */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Button type="button" variant={tipoRegla === 'general' ? 'default' : 'outline'} 
                className={`flex-1 min-w-[140px] h-auto whitespace-normal py-2 ${tipoRegla === 'general' ? 'bg-indigo-600' : ''}`}
                onClick={() => setTipoRegla('general')}>
                Regla General (Sector y Cargo)
              </Button>
              <Button type="button" variant={tipoRegla === 'excepcion' ? 'default' : 'outline'}
                className={`flex-1 min-w-[140px] h-auto whitespace-normal py-2 ${tipoRegla === 'excepcion' ? 'bg-indigo-600' : ''}`}
                onClick={() => setTipoRegla('excepcion')}>
                Excepción por Persona
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
              
              {/* Progressive Disclosure */}
              {tipoRegla === 'general' ? (
                <>
                  <div className="space-y-2">
                    <Label>Sector</Label>
                    <Select value={selectedSector} onValueChange={setSelectedSector}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar sector..." /></SelectTrigger>
                      <SelectContent>
                        {sectores?.map((s: any) => (
                          <SelectItem key={s.idSector} value={s.idSector.toString()}>{s.idSector} - {s.descripcion}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Select value={selectedCargo} onValueChange={setSelectedCargo}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar cargo..." /></SelectTrigger>
                      <SelectContent>
                        {cargos?.map((c: any) => (
                          <SelectItem key={c.id_cargo} value={c.id_cargo.toString()}>{c.descripcion}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-2 md:col-span-2 relative">
                  <Label>Buscar Empleado (Excepción)</Label>
                  {selectedLegajo ? (
                    <div className="flex items-center justify-between p-3 bg-white border border-emerald-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-emerald-800">
                          {personal?.find((p: any) => p.legajo === selectedLegajo)?.nombre} ({selectedLegajo})
                        </span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedLegajo('')} className="h-8">Cambiar</Button>
                    </div>
                  ) : (
                    <div>
                      <Input 
                        placeholder="Escribe el nombre o legajo..." 
                        value={personalSearch} 
                        onChange={e => setPersonalSearch(e.target.value)} 
                      />
                      {personalSearch.length > 1 && filteredPersonal && filteredPersonal.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredPersonal.map((p: any) => (
                            <div 
                              key={p.legajo}
                              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                              onClick={() => {
                                setSelectedLegajo(p.legajo);
                                setPersonalSearch('');
                              }}
                            >
                              <span className="font-medium">{p.nombre}</span> <span className="text-slate-500 text-xs ml-2">Legajo: {p.legajo}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {personalSearch.length > 1 && filteredPersonal?.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md p-3 text-sm text-slate-500">
                          No se encontraron resultados
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label>Turno a Asignar</Label>
                <Select value={selectedTurno} onValueChange={setSelectedTurno}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar turno..." /></SelectTrigger>
                  <SelectContent>
                    {turnos?.map((t: any) => (
                      <SelectItem key={t.id_turno} value={t.id_turno.toString()}>{t.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="space-y-4">
              <Label>Días de la Semana</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(dia => {
                  const isSelected = selectedDias.includes(dia.value);
                  return (
                    <button
                      key={dia.value}
                      type="button"
                      onClick={() => handleToggleDia(dia.value)}
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full font-bold transition-all text-sm sm:text-base ${
                        isSelected 
                          ? 'bg-emerald-500 text-white shadow-md transform scale-105' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {dia.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 max-w-md">
              <div className="space-y-2">
                <Label>Hora Entrada</Label>
                <Input type="time" value={horaEntrada} onChange={e => setHoraEntrada(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Hora Salida</Label>
                <Input type="time" value={horaSalida} onChange={e => setHoraSalida(e.target.value)} required />
              </div>
            </div>

            <Button type="submit" size="lg" className="bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto" disabled={addRegla.isPending}>
              {addRegla.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Guardar Regla(s)
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>

      {/* Columna Derecha: Matriz */}
      <div className="lg:col-span-7 xl:col-span-8">
      {/* SECCIÓN 3: Matriz Actual (Tree Schema) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Matriz de Horarios Actual</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Buscar por turno, sector, cargo..." 
                className="pl-9 h-9 text-sm"
                value={reglaFilter}
                onChange={(e) => setReglaFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isReglasLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
          ) : (
            <div className="space-y-8">
              {/* Reglas Generales */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">Reglas Generales</h3>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  {Object.keys(groupedGeneral).length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500 bg-slate-50/50">
                      No hay reglas generales configuradas para tu búsqueda.
                    </div>
                  ) : (
                    Object.entries(groupedGeneral).map(([turno, sectores]) => (
                      <TreeNode key={turno} title={turno} icon={Clock} defaultExpanded={true}>
                        {Object.entries(sectores as Record<string, any>).map(([sector, cargos]) => (
                          <TreeNode key={sector} title={`Sector: ${sector}`} icon={Building} defaultExpanded={true}>
                            {Object.entries(cargos as Record<string, any>).map(([cargo, rules]) => (
                              <TreeNode key={cargo} title={`Cargo: ${cargo}`} icon={Briefcase} defaultExpanded={true}>
                                <div className="py-2 pr-2 space-y-2">
                                  {(rules as any[]).map(r => (
                                    <div key={r.id_horario} className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-md shadow-sm hover:border-indigo-100 transition-colors group">
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50">
                                          <Calendar className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                          <div className="font-semibold text-slate-700 text-sm">{getDiaName(r.dia_semana)}</div>
                                          <div className="text-xs text-slate-500 font-medium">
                                            <span className="text-emerald-600">{r.hora_entrada}</span>
                                            <span className="mx-1 text-slate-400">a</span>
                                            <span className="text-indigo-600">{r.hora_salida}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <Button variant="ghost" size="icon" onClick={() => handleRemoveRegla(r.id_horario)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </TreeNode>
                            ))}
                          </TreeNode>
                        ))}
                      </TreeNode>
                    ))
                  )}
                </div>
              </div>

              {/* Excepciones */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-3 px-1 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Excepciones por Persona
                </h3>
                <div className="bg-white rounded-lg border border-amber-200 overflow-hidden shadow-sm">
                  {Object.keys(groupedExceptions).length === 0 ? (
                    <div className="p-6 text-center text-sm text-amber-700/60 bg-amber-50/20">
                      No hay excepciones configuradas para tu búsqueda.
                    </div>
                  ) : (
                    Object.entries(groupedExceptions).map(([turno, legajos]) => (
                      <TreeNode key={turno} title={turno} icon={Clock} isException defaultExpanded={true}>
                        {Object.entries(legajos as Record<string, any>).map(([legajo, rules]) => {
                          const person = personal?.find((p: any) => p.legajo === legajo);
                          const personName = person ? person.nombre : `Legajo ${legajo}`;
                          return (
                            <TreeNode key={legajo} title={`${personName} (${legajo})`} icon={User} isException defaultExpanded={true}>
                              <div className="py-2 pr-2 space-y-2">
                                {(rules as any[]).map(r => (
                                  <div key={r.id_horario} className="flex items-center justify-between bg-white border border-amber-100 p-2.5 rounded-md shadow-sm hover:border-amber-200 transition-colors group">
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100/50">
                                        <Calendar className="w-4 h-4 text-amber-600" />
                                      </div>
                                      <div>
                                        <div className="font-semibold text-amber-900 text-sm">{getDiaName(r.dia_semana)}</div>
                                        <div className="text-xs text-amber-700 font-medium">
                                          <span className="text-amber-600">{r.hora_entrada}</span>
                                          <span className="mx-1 text-amber-400">a</span>
                                          <span className="text-amber-800">{r.hora_salida}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveRegla(r.id_horario)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </TreeNode>
                          );
                        })}
                      </TreeNode>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

    </div>
  );
}
