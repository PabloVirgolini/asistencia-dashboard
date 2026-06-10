import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Building, Briefcase, User, Search, Clock, Trash2, Loader2, Copy, Check, X, Pencil, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ReglaHorario } from '@server/db/schema';
import { filtrarReglas, agruparReglas } from '@/utils/horariosFormatter';
import { TreeNode } from '../TreeNode';
import WeeklyCalendar from '../WeeklyCalendar';

interface MatrizHorariosProps {
  reglas: any[];
  isReglasLoading: boolean;
  cargosData: any[];
  personal: any[];
  mutations: {
    removeRegla: any;
    updateHorario: any;
    duplicateSector: any;
    duplicateCargo: any;
    batchUpdate: any;
  };
}

export default function MatrizHorarios({
  reglas, isReglasLoading, cargosData, personal, mutations
}: MatrizHorariosProps) {
  const { removeRegla, updateHorario, duplicateSector, duplicateCargo, batchUpdate } = mutations;

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
    return filtrarReglas((reglas || []) as ReglaHorario[], {
      texto: reglaFilter,
      turno: activeTurno,
      sector: activeSector,
      cargo: activeCargo
    });
  }, [reglas, reglaFilter, activeTurno, activeSector, activeCargo]);

  const { groupedGeneral, groupedExceptions } = React.useMemo(() => {
    return agruparReglas(filteredReglas as ReglaHorario[]);
  }, [filteredReglas]);

  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<{ id_turno: number, id_sector: number, nombreSector: string } | null>(null);
  const [duplicateTargetSector, setDuplicateTargetSector] = useState<string>('');

  const [duplicateCargoModalOpen, setDuplicateCargoModalOpen] = useState(false);
  const [duplicateCargoSource, setDuplicateCargoSource] = useState<{ id_turno: number, id_sector: number, id_cargo: number, nombreCargo: string } | null>(null);
  const [duplicateCargoTarget, setDuplicateCargoTarget] = useState<string>('');

  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editHoraEntrada, setEditHoraEntrada] = useState("");
  const [editHoraSalida, setEditHoraSalida] = useState("");

  const handleRemoveRegla = async (id: number) => {
    if (!confirm('¿Eliminar esta regla de horario?')) return;
    try {
      await removeRegla.mutateAsync({ id_horario: id });
    } catch (err: any) {
      // handled in hook
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
      setDuplicateModalOpen(false);
    } catch (err: any) {
      // handled in hook
    }
  };

  const handleDuplicateCargo = async () => {
    if (!duplicateCargoSource || !duplicateCargoTarget) return;
    try {
      await duplicateCargo.mutateAsync({
        id_turno: duplicateCargoSource.id_turno,
        id_sector: duplicateCargoSource.id_sector,
        source_cargo: duplicateCargoSource.id_cargo,
        target_cargo: parseInt(duplicateCargoTarget)
      });
      setDuplicateCargoModalOpen(false);
    } catch (err: any) {
      // handled in hook
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
    <>
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
                              {Object.entries(cargos as Record<string, any>).map(([cargoName, rules]) => {
                                const cargoObj = cargosData?.find((c: any) => c.descripcion === cargoName);
                                return (
                                <TreeNode 
                                  collapseToken={collapseToken} 
                                  key={cargoName} 
                                  title={`Cargo: ${cargoName}`} 
                                  icon={Briefcase} 
                                  defaultExpanded={true} 
                                  rightContent={
                                    <div className="flex items-center gap-1">
                                      {id_turno && id_sector && cargoObj && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDuplicateCargoSource({ id_turno, id_sector, id_cargo: cargoObj.id_cargo, nombreCargo: cargoName });
                                            setDuplicateCargoTarget('');
                                            setDuplicateCargoModalOpen(true);
                                          }}
                                        >
                                          <Copy className="w-4 h-4 mr-1" /> Replicar
                                        </Button>
                                      )}
                                      {renderBatchDelete(rules, `Cargo ${cargoName}`)}
                                    </div>
                                  }
                                >
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
                                          {(r.updated_at || r.updated_by) && (
                                            <div className="text-[10px] text-slate-400 font-normal mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={`Modificado: ${r.updated_at} por ${r.updated_by}`}>
                                              {r.updated_at ? `Última modif: ${r.updated_at?.split(' ')[0]} por ${r.updated_by}` : ''}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {editingRuleId === r.id_horario ? (
                                          <>
                                            <Button variant="ghost" size="icon" onClick={() => {
                                              updateHorario.mutate({
                                                id_horario: r.id_horario,
                                                hora_entrada: editHoraEntrada,
                                                hora_salida: editHoraSalida
                                              }, { onSuccess: () => setEditingRuleId(null) });
                                            }} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" disabled={updateHorario.isPending}>
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
                                );
                              })}
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
                                          {(r.updated_at || r.updated_by) && (
                                            <div className="text-[10px] text-amber-600/70 font-normal mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={`Modificado: ${r.updated_at} por ${r.updated_by}`}>
                                              {r.updated_at ? `Última modif: ${r.updated_at?.split(' ')[0]} por ${r.updated_by}` : ''}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {editingRuleId === r.id_horario ? (
                                          <>
                                            <Button variant="ghost" size="icon" onClick={() => {
                                              updateHorario.mutate({
                                                id_horario: r.id_horario,
                                                hora_entrada: editHoraEntrada,
                                                hora_salida: editHoraSalida
                                              }, { onSuccess: () => setEditingRuleId(null) });
                                            }} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" disabled={updateHorario.isPending}>
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
                <div className="flex-1 flex justify-end">
                  {(activeTurno !== 'todos' || activeSector !== 'todos' || activeCargo !== 'todos') && (
                    <Button variant="ghost" size="sm" onClick={() => { setActiveTurno('todos'); setActiveSector('todos'); setActiveCargo('todos'); }} className="h-8 text-xs text-indigo-600">
                      Limpiar Filtros
                    </Button>
                  )}
                </div>
              </div>
              <WeeklyCalendar 
                reglas={filteredReglas as ReglaHorario[]} 
                onEditRule={(rule) => {
                  setEditingRuleId(rule.id_horario);
                  setEditHoraEntrada(rule.hora_entrada);
                  setEditHoraSalida(rule.hora_salida);
                  setViewMode('list'); 
                  setReglaFilter(rule.turno || ''); 
                }} 
              />
            </div>
          )}
        </CardContent>

        {isBatchMode && selectedRules.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 border border-indigo-700">
              <div className="bg-indigo-800 p-2 rounded-lg">
                <Check className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <p className="font-bold">{selectedRules.length} Reglas Seleccionadas</p>
                <p className="text-xs text-indigo-300">Edición en lote activa</p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={() => setBatchModalOpen(true)} className="border-indigo-600 hover:bg-indigo-800 text-black hover:text-white transition-colors">
                  <Pencil className="w-4 h-4 mr-2" /> Editar Horarios
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleRemoveBatch(selectedRules, 'lote')} className="bg-red-500 hover:bg-red-600">
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* MODALES REPLICAR / BATCH */}
      {/* Modal Edición en Lote */}
      <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {selectedRules.length} reglas en lote</DialogTitle>
            <DialogDescription>
              Se aplicarán estos horarios a todas las reglas seleccionadas. Los días de la semana se mantendrán.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Nueva Hora Entrada</Label>
              <Input type="time" value={batchHoraEntrada} onChange={e => setBatchHoraEntrada(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nueva Hora Salida</Label>
              <Input type="time" value={batchHoraSalida} onChange={e => setBatchHoraSalida(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={async () => {
                if(!batchHoraEntrada || !batchHoraSalida) return toast.error('Ingresa hora de entrada y salida');
                try {
                  await batchUpdate.mutateAsync({
                    ids: selectedRules,
                    hora_entrada: batchHoraEntrada,
                    hora_salida: batchHoraSalida
                  });
                  setBatchModalOpen(false);
                  setIsBatchMode(false);
                  setSelectedRules([]);
                } catch(e) {}
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Aplicar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Replicar por Sector */}
      <Dialog open={duplicateModalOpen} onOpenChange={setDuplicateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replicar reglas de sector</DialogTitle>
            <DialogDescription>
              Se copiarán todas las reglas y cargos del sector "{duplicateSource?.nombreSector}" hacia el sector de destino seleccionado para este mismo turno.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={duplicateTargetSector} onValueChange={setDuplicateTargetSector}>
              <SelectTrigger><SelectValue placeholder="Seleccionar sector destino..." /></SelectTrigger>
              <SelectContent>
                {uniqueSectores.filter(s => s !== duplicateSource?.nombreSector).map(s => {
                  const sObj = reglas?.find(r => r.sector === s);
                  return sObj && sObj.id_sector !== undefined ? <SelectItem key={sObj.id_sector} value={sObj.id_sector.toString()}>{s}</SelectItem> : null;
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleDuplicateSector} disabled={!duplicateTargetSector} className="bg-indigo-600 text-white">Replicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Replicar por Cargo */}
      <Dialog open={duplicateCargoModalOpen} onOpenChange={setDuplicateCargoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replicar reglas de cargo</DialogTitle>
            <DialogDescription>
              Copiar reglas del cargo "{duplicateCargoSource?.nombreCargo}" a otro cargo dentro del mismo sector.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={duplicateCargoTarget} onValueChange={setDuplicateCargoTarget}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cargo destino..." /></SelectTrigger>
              <SelectContent>
                {cargosData?.filter(c => c.id_cargo !== duplicateCargoSource?.id_cargo).map(c => (
                  <SelectItem key={c.id_cargo} value={c.id_cargo.toString()}>{c.descripcion}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateCargoModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleDuplicateCargo} disabled={!duplicateCargoTarget} className="bg-indigo-600 text-white">Replicar Cargo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
