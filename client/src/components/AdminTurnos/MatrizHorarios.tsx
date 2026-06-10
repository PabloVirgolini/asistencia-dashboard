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
import MatrizList from './MatrizList';

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
            <MatrizList
              groupedGeneral={groupedGeneral}
              groupedExceptions={groupedExceptions}
              personal={personal}
              cargosData={cargosData}
              isBatchMode={isBatchMode}
              setIsBatchMode={setIsBatchMode}
              selectedRules={selectedRules}
              setSelectedRules={setSelectedRules}
              collapseToken={collapseToken}
              setCollapseToken={setCollapseToken}
              editingRuleId={editingRuleId}
              setEditingRuleId={setEditingRuleId}
              editHoraEntrada={editHoraEntrada}
              setEditHoraEntrada={setEditHoraEntrada}
              editHoraSalida={editHoraSalida}
              setEditHoraSalida={setEditHoraSalida}
              updateHorario={updateHorario}
              handleRemoveRegla={handleRemoveRegla}
              renderBatchDelete={renderBatchDelete}
              getDiaName={getDiaName}
              setDuplicateSource={setDuplicateSource}
              setDuplicateModalOpen={setDuplicateModalOpen}
              setDuplicateCargoSource={setDuplicateCargoSource}
              setDuplicateCargoTarget={setDuplicateCargoTarget}
              setDuplicateCargoModalOpen={setDuplicateCargoModalOpen}
            />
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
