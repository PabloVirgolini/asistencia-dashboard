import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trash2, Plus, Clock, Loader2, Check, Search, Copy, Pencil, X,
  ChevronRight, Building, Briefcase, User, Calendar, AlertCircle
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import WeeklyCalendar from './WeeklyCalendar';

const DAYS = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'X', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 0 }
];

const TreeNode = ({ title, icon: Icon, children, defaultExpanded = false, isException = false, rightContent = null, collapseToken = 0 }: any) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  React.useEffect(() => {
    if (collapseToken > 0) {
      setExpanded(false);
    }
  }, [collapseToken]);
  
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
  const { data: sectoresCargos } = trpc.admin.getSectoresCargos.useQuery();
  const { data: cargos } = trpc.admin.getCargos.useQuery();
  const { data: personal } = trpc.admin.getPersonal.useQuery();

  // Mutations
  const addTurno = trpc.admin.addTurnoHorario.useMutation();
  const removeTurno = trpc.admin.removeTurnoHorario.useMutation();
  const addRegla = trpc.admin.addHorario.useMutation();
  const removeRegla = trpc.admin.removeHorario.useMutation();
  const batchUpdate = trpc.admin.batchUpdateHorarios.useMutation();
  const duplicateSector = trpc.admin.duplicateSectorRules.useMutation();

  // Batch Edit State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedRules, setSelectedRules] = useState<number[]>([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchHoraEntrada, setBatchHoraEntrada] = useState('');
  const [batchHoraSalida, setBatchHoraSalida] = useState('');

  // Filter and Group Reglas
  const [reglaFilter, setReglaFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [collapseToken, setCollapseToken] = useState(0);

  // Suggested Filters for Calendar
  const [activeTurno, setActiveTurno] = useState<string>('todos');
  const [activeSector, setActiveSector] = useState<string>('todos');
  const [activeCargo, setActiveCargo] = useState<string>('todos');

  const uniqueTurnos = React.useMemo(() => Array.from(new Set(reglas?.map(r => r.turno).filter(Boolean))), [reglas]);
  const uniqueSectores = React.useMemo(() => Array.from(new Set(reglas?.map(r => r.sector).filter(Boolean))), [reglas]);
  const uniqueCargos = React.useMemo(() => Array.from(new Set(reglas?.map(r => r.cargo).filter(Boolean))), [reglas]);

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
    
    // Apply suggested filters
    if (activeTurno && activeTurno !== 'todos') {
      result = result.filter((r: any) => r.turno === activeTurno);
    }
    if (activeSector && activeSector !== 'todos') {
      result = result.filter((r: any) => r.sector === activeSector);
    }
    if (activeCargo && activeCargo !== 'todos') {
      result = result.filter((r: any) => r.cargo === activeCargo);
    }
    
    return result;
  }, [reglas, reglaFilter, activeTurno, activeSector, activeCargo]);

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

  // State Turnos
  const [nuevoTurnoDesc, setNuevoTurnoDesc] = useState('');
  const [selectedTurnoParaEliminar, setSelectedTurnoParaEliminar] = useState<string>('');

  // State Reglas (Formulario)
  const [tipoRegla, setTipoRegla] = useState<'general' | 'excepcion'>('general');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedCargos, setSelectedCargos] = useState<string[]>([]);
  const [selectedTurno, setSelectedTurno] = useState<string>('');
  const [selectedDias, setSelectedDias] = useState<number[]>([]);
  const [horaEntrada, setHoraEntrada] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  
  // Buscador de personal
  const [personalSearch, setPersonalSearch] = useState('');
  const [selectedLegajo, setSelectedLegajo] = useState<string>('');

  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<{ id_turno: number, id_sector: number, nombreSector: string } | null>(null);
  const [duplicateTargetSector, setDuplicateTargetSector] = useState<string>('');

  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editHoraEntrada, setEditHoraEntrada] = useState("");
  const [editHoraSalida, setEditHoraSalida] = useState("");

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
    } catch (err: any) {
      toast.error(err.message || 'Error al crear turno');
    }
  };

  const handleRemoveTurno = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este turno? Podría afectar a las reglas asociadas.')) return;
    try {
      await removeTurno.mutateAsync({ id_turno: id });
      toast.success('Turno eliminado');
      trpcContext.admin.getTurnosHorarios.invalidate();
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err.message}`);
    }
  };

  const updateHorario = trpc.admin.updateHorario.useMutation({
    onSuccess: () => {
      toast.success('Horario actualizado correctamente');
      setEditingRuleId(null);
      trpcContext.admin.getTurnosHorarios.invalidate();
      trpcContext.admin.getHorariosReglas.invalidate();
    },
    onError: (err) => {
      toast.error(`Error al actualizar: ${err.message}`);
    }
  });

  const handleAddRegla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurno) return toast.error('Debes seleccionar un turno');
    if (selectedDias.length === 0) return toast.error('Debes seleccionar al menos un día');
    if (!horaEntrada || !horaSalida) return toast.error('Debes ingresar hora de entrada y salida');
    
    if (tipoRegla === 'general') {
      if (!selectedSector || selectedCargos.length === 0) return toast.error('Debes seleccionar sector y al menos un cargo');
    } else {
      if (!selectedLegajo) return toast.error('Debes seleccionar un empleado');
    }

    try {
      if (tipoRegla === 'general') {
        for (const cargo of selectedCargos) {
          await addRegla.mutateAsync({
            id_sector: parseInt(selectedSector),
            id_cargo: parseInt(cargo),
            legajo: null,
            id_turno: parseInt(selectedTurno),
            dias: selectedDias,
            hora_entrada: horaEntrada,
            hora_salida: horaSalida
          });
        }
      } else {
        await addRegla.mutateAsync({
          id_sector: null,
          id_cargo: null,
          legajo: selectedLegajo,
          id_turno: parseInt(selectedTurno),
          dias: selectedDias,
          hora_entrada: horaEntrada,
          hora_salida: horaSalida
        });
      }
      toast.success('Regla(s) guardada(s) correctamente');
      trpcContext.admin.getHorariosReglas.invalidate();
      setSelectedDias([]);
      setHoraEntrada('');
      setHoraSalida('');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la regla');
    }
  };

  const handleRemoveRegla = async (id: number) => {
    if (!confirm('¿Eliminar esta regla de horario?')) return;
    try {
      await removeRegla.mutateAsync({ id_horario: id });
      toast.success('Regla eliminada');
      trpcContext.admin.getHorariosReglas.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar regla');
    }
  };

  const handleRemoveBatch = async (ids: number[], levelName: string) => {
    if (!confirm(`¿Eliminar las ${ids.length} reglas de ${levelName}?`)) return;
    
    const toastId = toast.loading(`Eliminando ${ids.length} reglas...`);
    let successCount = 0;
    
    for (const id of ids) {
      try {
        await removeRegla.mutateAsync({ id_horario: id });
        successCount++;
      } catch (err: any) {
        toast.error(`Error regla ID ${id}: ${err.message}`);
      }
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} reglas eliminadas de ${levelName}`, { id: toastId });
      trpcContext.admin.getHorariosReglas.invalidate();
    } else {
      toast.dismiss(toastId);
    }
  };

  const getAllIds = (node: any): number[] => {
    if (Array.isArray(node)) return node.map(r => r.id_horario);
    return Object.values(node).flatMap(getAllIds);
  };

  const handleDuplicateSector = async () => {
    if (!duplicateSource || !duplicateTargetSector) return;
    try {
      await duplicateSector.mutateAsync({
        id_turno: duplicateSource.id_turno,
        source_sector: duplicateSource.id_sector,
        target_sector: parseInt(duplicateTargetSector)
      });
      toast.success('Sector duplicado correctamente');
      setDuplicateModalOpen(false);
      setDuplicateTargetSector('');
      setDuplicateSource(null);
      trpcContext.admin.getHorariosReglas.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al duplicar el sector');
    }
  };

  const renderBatchDelete = (nodeData: any, name: string) => {
    const ids = getAllIds(nodeData);
    if (ids.length === 0) return null;
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
        onClick={(e) => {
          e.stopPropagation();
          handleRemoveBatch(ids, name);
        }}
        title={`Eliminar las ${ids.length} reglas`}
      >
        <Trash2 className="w-3.5 h-3.5 mr-1" />
        <span className="text-xs">Borrar Nivel ({ids.length})</span>
      </Button>
    );
  };

  const getDiaName = (num: number) => {
    const map: any = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };
    return map[num];
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* SECCIÓN 1: Gestión de Turnos */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg text-slate-800">Gestión de Turnos</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            <form onSubmit={handleAddTurno} className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-end w-full sm:justify-start">
              <div className="w-full sm:w-64">
                <Label className="text-slate-600 mb-2 block">Nombre del Nuevo Turno</Label>
                <Input placeholder="Ej: Turno Noche" value={nuevoTurnoDesc} onChange={e => setNuevoTurnoDesc(e.target.value)} required className="border-slate-200" />
              </div>
              <Button type="submit" disabled={addTurno.isPending} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" /> Agregar
              </Button>
            </form>
            
            <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-end w-full sm:justify-start">
              <div className="w-full sm:w-64">
                <Label className="text-slate-600 mb-2 block">Turnos Existentes</Label>
                <Select value={selectedTurnoParaEliminar} onValueChange={setSelectedTurnoParaEliminar}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Seleccionar turno para eliminar..." /></SelectTrigger>
                  <SelectContent>
                    {turnos?.map((t: any) => (
                      <SelectItem key={t.id_turno} value={t.id_turno.toString()}>{t.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="button"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto transition-colors"
                disabled={!selectedTurnoParaEliminar}
                onClick={() => {
                  if (selectedTurnoParaEliminar) {
                    handleRemoveTurno(parseInt(selectedTurnoParaEliminar));
                    setSelectedTurnoParaEliminar('');
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN 2: Creador de Reglas */}
      <Card className="border-indigo-100 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 py-5 px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center p-2 bg-indigo-100 rounded-lg shadow-sm">
              <Clock className="w-5 h-5 text-indigo-700" />
            </div>
            <CardTitle className="text-xl text-indigo-950 font-bold tracking-tight m-0 leading-none flex items-center h-full pt-1">CREADOR DE REGLAS</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAddRegla} className="space-y-8">
            
            {/* Tipo de Regla */}
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
                        cargos
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end p-6 bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-start gap-4">
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
              
              <div className="lg:col-span-4 grid grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className="text-slate-700 font-semibold">Hora Entrada</Label>
                  <Input type="time" value={horaEntrada} onChange={e => setHoraEntrada(e.target.value)} required className="bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-slate-700 font-semibold">Hora Salida</Label>
                  <Input type="time" value={horaSalida} onChange={e => setHoraSalida(e.target.value)} required className="bg-slate-50 border-slate-200" />
                </div>
              </div>

              <div className="lg:col-span-2 flex justify-end">
                <Button type="submit" size="lg" className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all h-[44px]" disabled={addRegla.isPending}>
                  {addRegla.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                  Guardar
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* SECCIÓN 3: Matriz Actual (Tree Schema) */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl text-slate-800">Matriz de Horarios</CardTitle>
              <div className="flex bg-slate-200/50 p-1 rounded-lg ml-4">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Lista
                </button>
                <button 
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Calendar className="w-4 h-4" /> Calendario
                </button>
              </div>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                placeholder="Buscar en la matriz..." 
                className="pl-9 bg-white border-slate-200"
                value={reglaFilter}
                onChange={(e) => setReglaFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isReglasLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
              <p>Cargando matriz de horarios...</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Reglas Generales */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Reglas Generales</h3>
                  </div>
                  {viewMode === 'list' && (
                    <div className="flex gap-2">
                      <Button 
                        variant={isBatchMode ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => {
                          setIsBatchMode(!isBatchMode);
                          if (isBatchMode) setSelectedRules([]); // Limpiar al apagar
                        }} 
                        className={`h-7 text-xs ${isBatchMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'text-slate-500'}`}
                      >
                        {isBatchMode ? "Desactivar Múltiple" : "Edición Múltiple"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setCollapseToken(c => c + 1)} className="h-7 text-xs text-slate-500 hover:text-slate-700">
                        Colapsar todo
                      </Button>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {Object.keys(groupedGeneral).length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-50/50 flex flex-col items-center">
                      <Clock className="w-8 h-8 text-slate-300 mb-3" />
                      <p>No hay reglas generales configuradas.</p>
                    </div>
                  ) : (
                    Object.entries(groupedGeneral).map(([turno, sectores]) => (
                      <TreeNode collapseToken={collapseToken} key={turno} title={turno} icon={Clock} defaultExpanded={true} rightContent={renderBatchDelete(sectores, `Turno ${turno}`)}>
                        {Object.entries(sectores as Record<string, any>).map(([sector, cargos]) => {
                          const sampleRule = Object.values(cargos as Record<string, any[]>)[0]?.[0];
                          const id_turno = sampleRule?.id_turno;
                          const id_sector = sampleRule?.id_sector;
                          return (
                            <TreeNode collapseToken={collapseToken} 
                              key={sector} 
                              title={`Sector: ${sector}`} 
                              icon={Building} 
                              defaultExpanded={true} 
                              rightContent={
                                <div className="flex items-center gap-1">
                                  {id_turno && id_sector && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDuplicateSource({ id_turno, id_sector, nombreSector: sector });
                                        setDuplicateModalOpen(true);
                                      }}
                                    >
                                      <Copy className="w-4 h-4 mr-1" /> Replicar
                                    </Button>
                                  )}
                                  {renderBatchDelete(cargos, `Sector ${sector}`)}
                                </div>
                              }
                            >
                              {Object.entries(cargos as Record<string, any>).map(([cargo, rules]) => (
                                <TreeNode collapseToken={collapseToken} key={cargo} title={`Cargo: ${cargo}`} icon={Briefcase} defaultExpanded={true} rightContent={renderBatchDelete(rules, `Cargo ${cargo}`)}>
                                <div className="py-2 pr-2 space-y-2.5">
                                  {(rules as any[]).map(r => (
                                    <div key={r.id_horario} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-lg shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
                                      <div className="flex items-center gap-4">
                                        {isBatchMode && (
                                          <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                            checked={selectedRules.includes(r.id_horario)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedRules(prev => [...prev, r.id_horario]);
                                              } else {
                                                setSelectedRules(prev => prev.filter(id => id !== r.id_horario));
                                              }
                                            }}
                                          />
                                        )}
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50/80">
                                          <Calendar className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                          <div className="font-bold text-slate-800 text-sm">{getDiaName(r.dia_semana)}</div>
                                          {editingRuleId === r.id_horario ? (
                                            <div className="flex items-center gap-2 mt-1">
                                              <Input type="time" value={editHoraEntrada} onChange={e => setEditHoraEntrada(e.target.value)} className="h-7 w-24 text-xs" />
                                              <span className="text-slate-300">→</span>
                                              <Input type="time" value={editHoraSalida} onChange={e => setEditHoraSalida(e.target.value)} className="h-7 w-24 text-xs" />
                                            </div>
                                          ) : (
                                            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                              <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{r.hora_entrada}</span>
                                              <span className="text-slate-300">→</span>
                                              <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{r.hora_salida}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {editingRuleId === r.id_horario ? (
                                          <>
                                            <Button variant="ghost" size="icon" onClick={() => updateHorario.mutate({ id_horario: r.id_horario, hora_entrada: editHoraEntrada, hora_salida: editHoraSalida })} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" disabled={updateHorario.isPending}>
                                              <Check className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingRuleId(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100" disabled={updateHorario.isPending}>
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </>
                                        ) : (
                                          <>
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingRuleId(r.id_horario); setEditHoraEntrada(r.hora_entrada); setEditHoraSalida(r.hora_salida); }} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                                              <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveRegla(r.id_horario)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TreeNode>
                            ))}
                          </TreeNode>
                        );
                      })}
                      </TreeNode>
                    ))
                  )}
                </div>
              </div>

              {/* Excepciones */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-amber-500 rounded-full"></div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      Excepciones
                    </h3>
                  </div>
                  {viewMode === 'list' && (
                    <Button variant="ghost" size="sm" onClick={() => setCollapseToken(c => c + 1)} className="h-7 text-xs text-slate-500 hover:text-slate-700">
                      Colapsar todo
                    </Button>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                  {Object.keys(groupedExceptions).length === 0 ? (
                    <div className="p-8 text-center text-amber-700/60 bg-amber-50/30 flex flex-col items-center">
                      <AlertCircle className="w-8 h-8 text-amber-200 mb-3" />
                      <p>No hay excepciones configuradas.</p>
                    </div>
                  ) : (
                    Object.entries(groupedExceptions).map(([turno, legajos]) => (
                      <TreeNode collapseToken={collapseToken} key={turno} title={turno} icon={Clock} isException defaultExpanded={true} rightContent={renderBatchDelete(legajos, `Turno ${turno}`)}>
                        {Object.entries(legajos as Record<string, any>).map(([legajo, rules]) => {
                          const person = personal?.find((p: any) => p.legajo === legajo);
                          const personName = person ? person.nombre : `Legajo ${legajo}`;
                          return (
                            <TreeNode collapseToken={collapseToken} key={legajo} title={`${personName} (${legajo})`} icon={User} isException defaultExpanded={true} rightContent={renderBatchDelete(rules, `Empleado ${personName}`)}>
                              <div className="py-2 pr-2 space-y-2.5">
                                {(rules as any[]).map(r => (
                                    <div key={r.id_horario} className="flex items-center justify-between bg-white border border-amber-100 p-3 rounded-lg shadow-sm hover:border-amber-300 hover:shadow-md transition-all group">
                                      <div className="flex items-center gap-4">
                                        {isBatchMode && (
                                          <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                            checked={selectedRules.includes(r.id_horario)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedRules(prev => [...prev, r.id_horario]);
                                              } else {
                                                setSelectedRules(prev => prev.filter(id => id !== r.id_horario));
                                              }
                                            }}
                                          />
                                        )}
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-50">
                                          <Calendar className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div>
                                          <div className="font-bold text-amber-900 text-sm">{getDiaName(r.dia_semana)}</div>
                                          {editingRuleId === r.id_horario ? (
                                            <div className="flex items-center gap-2 mt-1">
                                              <Input type="time" value={editHoraEntrada} onChange={e => setEditHoraEntrada(e.target.value)} className="h-7 w-24 text-xs" />
                                              <span className="text-slate-300">→</span>
                                              <Input type="time" value={editHoraSalida} onChange={e => setEditHoraSalida(e.target.value)} className="h-7 w-24 text-xs" />
                                            </div>
                                          ) : (
                                            <div className="text-xs text-amber-700 font-medium flex items-center gap-1.5 mt-0.5">
                                              <span className="text-amber-700 bg-amber-100/50 px-1.5 py-0.5 rounded">{r.hora_entrada}</span>
                                              <span className="text-amber-300">→</span>
                                              <span className="text-amber-800 bg-amber-100/50 px-1.5 py-0.5 rounded">{r.hora_salida}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {editingRuleId === r.id_horario ? (
                                          <>
                                            <Button variant="ghost" size="icon" onClick={() => updateHorario.mutate({ id_horario: r.id_horario, hora_entrada: editHoraEntrada, hora_salida: editHoraSalida })} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" disabled={updateHorario.isPending}>
                                              <Check className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingRuleId(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100" disabled={updateHorario.isPending}>
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </>
                                        ) : (
                                          <>
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingRuleId(r.id_horario); setEditHoraEntrada(r.hora_entrada); setEditHoraSalida(r.hora_salida); }} className="text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                                              <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveRegla(r.id_horario)} className="text-amber-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
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
          ) : (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-wrap gap-4 items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Filtros:</div>
                <div className="w-40">
                  <Select value={activeTurno} onValueChange={setActiveTurno}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="Turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los Turnos</SelectItem>
                      {uniqueTurnos.map(t => (
                        <SelectItem key={t as string} value={t as string}>{t as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-40">
                  <Select value={activeSector} onValueChange={setActiveSector}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="Sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los Sectores</SelectItem>
                      {uniqueSectores.map(s => (
                        <SelectItem key={s as string} value={s as string}>{s as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-40">
                  <Select value={activeCargo} onValueChange={setActiveCargo}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="Cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los Cargos</SelectItem>
                      {uniqueCargos.map(c => (
                        <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {(activeTurno !== 'todos' || activeSector !== 'todos' || activeCargo !== 'todos') && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs text-indigo-600 hover:bg-indigo-50"
                    onClick={() => {
                      setActiveTurno('todos');
                      setActiveSector('todos');
                      setActiveCargo('todos');
                    }}
                  >
                    Limpiar
                  </Button>
                )}
              </div>
              <WeeklyCalendar reglas={filteredReglas} />
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={duplicateModalOpen} onOpenChange={setDuplicateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replicar Reglas de Sector</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-600">
              Estás a punto de copiar todas las reglas de <strong>{duplicateSource?.nombreSector}</strong> (del Turno actual).
            </p>
            <div className="space-y-2">
              <Label>Selecciona el Sector de Destino</Label>
              <Select value={duplicateTargetSector} onValueChange={setDuplicateTargetSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir sector..." />
                </SelectTrigger>
                <SelectContent>
                  {sectores?.map((s: any) => (
                    s.idSector !== duplicateSource?.id_sector && (
                      <SelectItem key={s.idSector} value={s.idSector.toString()}>
                        {s.idSector} - {s.descripcion}
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-500">
              * Nota: El sector destino debe tener personal activo asignado a los mismos cargos que las reglas originales.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={handleDuplicateSector} 
              disabled={!duplicateTargetSector || duplicateSector.isLoading}
            >
              {duplicateSector.isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
              Replicar Reglas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Bar para Edición en Lote */}
      {isBatchMode && selectedRules.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="text-sm font-medium">
            <span className="bg-indigo-500 text-white px-2 py-0.5 rounded-full mr-2">{selectedRules.length}</span>
            Reglas seleccionadas
          </div>
          <div className="flex items-center gap-2 border-l border-slate-700 pl-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => setSelectedRules([])}
            >
              Cancelar
            </Button>
            <Button 
              size="sm" 
              className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
              onClick={() => setBatchModalOpen(true)}
            >
              <Pencil className="w-4 h-4 mr-2" /> Editar Horarios
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Edición Múltiple */}
      <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edición Masiva de Horarios</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <p className="text-sm text-slate-500">
              Estás a punto de modificar el horario de entrada y salida para <strong>{selectedRules.length} reglas</strong> simultáneamente.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora Entrada</Label>
                <Input type="time" value={batchHoraEntrada} onChange={e => setBatchHoraEntrada(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hora Salida</Label>
                <Input type="time" value={batchHoraSalida} onChange={e => setBatchHoraSalida(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white" 
              disabled={!batchHoraEntrada || !batchHoraSalida || batchUpdate.isPending}
              onClick={() => {
                batchUpdate.mutate({
                  id_horarios: selectedRules,
                  hora_entrada: batchHoraEntrada,
                  hora_salida: batchHoraSalida
                }, {
                  onSuccess: () => {
                    toast.success('Horarios actualizados masivamente con éxito');
                    setBatchModalOpen(false);
                    setSelectedRules([]);
                    setBatchHoraEntrada('');
                    setBatchHoraSalida('');
                    trpcContext.admin.getHorariosReglas.invalidate();
                  }
                });
              }}
            >
              {batchUpdate.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
