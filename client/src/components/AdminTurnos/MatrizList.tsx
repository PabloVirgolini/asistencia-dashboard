import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Building, Briefcase, User, Clock, Trash2, Copy, Check, X, Pencil, AlertCircle } from 'lucide-react';
import { TreeNode } from '../TreeNode';

interface MatrizListProps {
  groupedGeneral: any;
  groupedExceptions: any;
  personal: any[];
  cargosData: any[];
  isBatchMode: boolean;
  setIsBatchMode: (b: boolean) => void;
  selectedRules: number[];
  setSelectedRules: React.Dispatch<React.SetStateAction<number[]>>;
  collapseToken: number;
  setCollapseToken: React.Dispatch<React.SetStateAction<number>>;
  editingRuleId: number | null;
  setEditingRuleId: (id: number | null) => void;
  editHoraEntrada: string;
  setEditHoraEntrada: (val: string) => void;
  editHoraSalida: string;
  setEditHoraSalida: (val: string) => void;
  updateHorario: any;
  handleRemoveRegla: (id: number) => void;
  renderBatchDelete: (nodeData: any, name: string) => React.ReactNode;
  getDiaName: (num: number) => string;
  setDuplicateSource: (src: any) => void;
  setDuplicateModalOpen: (open: boolean) => void;
  setDuplicateCargoSource: (src: any) => void;
  setDuplicateCargoTarget: (target: string) => void;
  setDuplicateCargoModalOpen: (open: boolean) => void;
}

export default function MatrizList({
  groupedGeneral,
  groupedExceptions,
  personal,
  cargosData,
  isBatchMode,
  setIsBatchMode,
  selectedRules,
  setSelectedRules,
  collapseToken,
  setCollapseToken,
  editingRuleId,
  setEditingRuleId,
  editHoraEntrada,
  setEditHoraEntrada,
  editHoraSalida,
  setEditHoraSalida,
  updateHorario,
  handleRemoveRegla,
  renderBatchDelete,
  getDiaName,
  setDuplicateSource,
  setDuplicateModalOpen,
  setDuplicateCargoSource,
  setDuplicateCargoTarget,
  setDuplicateCargoModalOpen
}: MatrizListProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Reglas Generales */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Reglas Generales</h3>
          </div>
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
                                    <div className="flex flex-col gap-1 mt-1">
                                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{r.hora_entrada}</span>
                                        <span className="text-slate-300">→</span>
                                        <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{r.hora_salida}</span>
                                      </div>
                                      {r.es_cortado === 1 && (
                                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                          <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{r.hora_entrada_2}</span>
                                          <span className="text-slate-300">→</span>
                                          <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{r.hora_salida_2}</span>
                                        </div>
                                      )}
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
          <Button variant="ghost" size="sm" onClick={() => setCollapseToken(c => c + 1)} className="h-7 text-xs text-slate-500 hover:text-slate-700">
            Colapsar todo
          </Button>
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
                                    <div className="flex flex-col gap-1 mt-1">
                                      <div className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                                        <span className="text-amber-700 bg-amber-100/50 px-1.5 py-0.5 rounded">{r.hora_entrada}</span>
                                        <span className="text-amber-300">→</span>
                                        <span className="text-amber-800 bg-amber-100/50 px-1.5 py-0.5 rounded">{r.hora_salida}</span>
                                      </div>
                                      {r.es_cortado === 1 && (
                                        <div className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                                          <span className="text-amber-700 bg-amber-100/50 px-1.5 py-0.5 rounded">{r.hora_entrada_2}</span>
                                          <span className="text-amber-300">→</span>
                                          <span className="text-amber-800 bg-amber-100/50 px-1.5 py-0.5 rounded">{r.hora_salida_2}</span>
                                        </div>
                                      )}
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
  );
}
