import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Trash2, Loader2, Check, Pencil, X } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { ReglaHorario } from '@server/db/schema';
import WeeklyCalendar from './WeeklyCalendar';
import MatrizList from './MatrizList';
import { useMatrizHorarios } from './MatrizHorarios/useMatrizHorarios';
import { Modales } from './MatrizHorarios/Modales';

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
  
  const ctx = useMatrizHorarios(reglas, mutations);

  const getDiaName = (num: number) => {
    const map: any = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };
    return map[num];
  };

  const renderBatchDelete = (nodeData: any, name: string) => {
    const getAllIds = (node: any): number[] => {
      if (Array.isArray(node)) return node.map(r => r.id_horario);
      return Object.values(node).flatMap(getAllIds);
    };

    const ids = getAllIds(nodeData);
    if (ids.length === 0) return null;
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
        onClick={(e) => {
          e.stopPropagation();
          ctx.handleRemoveBatch(ids, name);
        }}
        title={`Eliminar las ${ids.length} reglas`}
      >
        <Trash2 className="w-3.5 h-3.5 mr-1" />
        <span className="text-xs">Borrar Nivel ({ids.length})</span>
      </Button>
    );
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
                  onClick={() => ctx.setViewMode('list')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${ctx.viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Lista
                </button>
                <button 
                  onClick={() => ctx.setViewMode('calendar')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${ctx.viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
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
                value={ctx.reglaFilter}
                onChange={(e) => ctx.setReglaFilter(e.target.value)}
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
          ) : ctx.viewMode === 'list' ? (
            <MatrizList
              groupedGeneral={ctx.groupedGeneral}
              groupedExceptions={ctx.groupedExceptions}
              personal={personal}
              cargosData={cargosData}
              isBatchMode={ctx.isBatchMode}
              setIsBatchMode={ctx.setIsBatchMode}
              selectedRules={ctx.selectedRules}
              setSelectedRules={ctx.setSelectedRules}
              collapseToken={ctx.collapseToken}
              setCollapseToken={ctx.setCollapseToken}
              editingRuleId={ctx.editingRuleId}
              setEditingRuleId={ctx.setEditingRuleId}
              editHoraEntrada={ctx.editHoraEntrada}
              setEditHoraEntrada={ctx.setEditHoraEntrada}
              editHoraSalida={ctx.editHoraSalida}
              setEditHoraSalida={ctx.setEditHoraSalida}
              updateHorario={mutations.updateHorario}
              handleRemoveRegla={ctx.handleRemoveRegla}
              renderBatchDelete={renderBatchDelete}
              getDiaName={getDiaName}
              setDuplicateSource={ctx.setDuplicateSource}
              setDuplicateModalOpen={ctx.setDuplicateModalOpen}
              setDuplicateCargoSource={ctx.setDuplicateCargoSource}
              setDuplicateCargoTarget={ctx.setDuplicateCargoTarget}
              setDuplicateCargoModalOpen={ctx.setDuplicateCargoModalOpen}
            />
          ) : (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-wrap gap-4 items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Filtros:</div>
                <div className="w-48">
                  <MultiSelect 
                    options={ctx.uniqueTurnos.map(t => ({ label: t as string, value: t as string }))} 
                    selectedValues={ctx.activeTurnos} 
                    onSelectedValuesChange={ctx.setActiveTurnos} 
                    placeholder="Turnos" 
                  />
                </div>
                <div className="w-48">
                  <MultiSelect 
                    options={ctx.uniqueSectores.map(t => ({ label: t as string, value: t as string }))} 
                    selectedValues={ctx.activeSectores} 
                    onSelectedValuesChange={ctx.setActiveSectores} 
                    placeholder="Sectores" 
                  />
                </div>
                <div className="w-48">
                  <MultiSelect 
                    options={ctx.uniqueCargos.map(t => ({ label: t as string, value: t as string }))} 
                    selectedValues={ctx.activeCargos} 
                    onSelectedValuesChange={ctx.setActiveCargos} 
                    placeholder="Cargos" 
                  />
                </div>
                <div className="flex-1 flex justify-end gap-2">
                  {ctx.hiddenRules.length > 0 && (
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-md">
                      <span className="text-xs text-indigo-700 font-medium">
                        Ocultos: {ctx.hiddenRules.length} horario(s)
                      </span>
                      <button 
                        onClick={() => ctx.setHiddenRules([])}
                        className="text-indigo-400 hover:text-indigo-600 ml-1"
                        title="Mostrar todos los horarios ocultos"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {(ctx.activeTurnos.length > 0 || ctx.activeSectores.length > 0 || ctx.activeCargos.length > 0) && (
                    <Button variant="ghost" size="sm" onClick={() => { ctx.setActiveTurnos([]); ctx.setActiveSectores([]); ctx.setActiveCargos([]); }} className="h-8 text-xs text-indigo-600">
                      Limpiar Filtros
                    </Button>
                  )}
                </div>
              </div>
              <WeeklyCalendar 
                reglas={ctx.filteredReglas as ReglaHorario[]} 
                onHideTurno={(id_horario: string | number) => ctx.setHiddenRules(prev => Array.from(new Set([...prev, Number(id_horario)])))}
                onEditRule={(rule) => {
                  ctx.setEditingRuleId(rule.id_horario);
                  ctx.setEditHoraEntrada(rule.hora_entrada);
                  ctx.setEditHoraSalida(rule.hora_salida);
                  ctx.setViewMode('list'); 
                  ctx.setReglaFilter(rule.turno || ''); 
                }} 
              />
            </div>
          )}
        </CardContent>

        {ctx.isBatchMode && ctx.selectedRules.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 border border-indigo-700">
              <div className="bg-indigo-800 p-2 rounded-lg">
                <Check className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <p className="font-bold">{ctx.selectedRules.length} Reglas Seleccionadas</p>
                <p className="text-xs text-indigo-300">Edición en lote activa</p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={() => ctx.setBatchModalOpen(true)} className="border-indigo-600 hover:bg-indigo-800 text-black hover:text-white transition-colors">
                  <Pencil className="w-4 h-4 mr-2" /> Editar Horarios
                </Button>
                <Button variant="destructive" size="sm" onClick={() => ctx.handleRemoveBatch(ctx.selectedRules, 'lote')} className="bg-red-500 hover:bg-red-600">
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Modales 
        {...ctx}
        reglas={reglas}
        cargosData={cargosData}
      />
    </>
  );
}
