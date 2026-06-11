import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, User, Clock, Trash2, Check, X, Pencil, AlertCircle } from 'lucide-react';
import { TreeNode } from '@/components/TreeNode';

export function MatrizListExcepciones({
  groupedExceptions,
  personal,
  isBatchMode,
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
  editEsCortado,
  setEditEsCortado,
  editHoraEntrada2,
  setEditHoraEntrada2,
  editHoraSalida2,
  setEditHoraSalida2,
  updateHorario,
  handleRemoveRegla,
  renderBatchDelete,
  getDiaName
}: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 bg-amber-500 rounded-full"></div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            Excepciones
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setCollapseToken((c: number) => c + 1)} className="h-7 text-xs text-slate-500 hover:text-slate-700">
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
                                      setSelectedRules((prev: number[]) => [...prev, r.id_horario]);
                                    } else {
                                      setSelectedRules((prev: number[]) => prev.filter(id => id !== r.id_horario));
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
                                  <div className="flex flex-col gap-2 mt-1">
                                    <div className="flex items-center gap-2">
                                      <Input type="time" value={editHoraEntrada} onChange={e => setEditHoraEntrada(e.target.value)} className="h-7 w-24 text-xs" />
                                      <span className="text-slate-300">→</span>
                                      <Input type="time" value={editHoraSalida} onChange={e => setEditHoraSalida(e.target.value)} className="h-7 w-24 text-xs" />
                                      <label className="flex items-center gap-1 ml-2 text-xs text-slate-600 cursor-pointer">
                                        <input type="checkbox" className="rounded border-slate-300" checked={editEsCortado} onChange={e => setEditEsCortado(e.target.checked)} />
                                        Cortado
                                      </label>
                                    </div>
                                    {editEsCortado && (
                                      <div className="flex items-center gap-2">
                                        <Input type="time" value={editHoraEntrada2} onChange={e => setEditHoraEntrada2(e.target.value)} className="h-7 w-24 text-xs" />
                                        <span className="text-slate-300">→</span>
                                        <Input type="time" value={editHoraSalida2} onChange={e => setEditHoraSalida2(e.target.value)} className="h-7 w-24 text-xs" />
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <div className="text-xs text-amber-800 font-medium flex items-center gap-1.5">
                                      <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shadow-sm">{r.hora_entrada}</span>
                                      <span className="text-amber-400 font-bold">→</span>
                                      <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shadow-sm">{r.hora_salida}</span>
                                    </div>
                                    {!!r.es_cortado && (
                                      <>
                                        <div className="w-3 h-[2px] bg-amber-200/60 mx-0.5 rounded-full"></div>
                                        <div className="text-xs text-amber-800 font-medium flex items-center gap-1.5">
                                          <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shadow-sm">{r.hora_entrada_2}</span>
                                          <span className="text-amber-400 font-bold">→</span>
                                          <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shadow-sm">{r.hora_salida_2}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                                {(r.updated_at || r.updated_by) && (
                                  <div className="text-[10px] text-amber-600/60 font-normal mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={`Modificado: ${r.updated_at} por ${r.updated_by}`}>
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
                                      hora_salida: editHoraSalida,
                                      es_cortado: editEsCortado ? 1 : 0,
                                      hora_entrada_2: editEsCortado ? editHoraEntrada2 : null,
                                      hora_salida_2: editEsCortado ? editHoraSalida2 : null
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
                                  <Button variant="ghost" size="icon" onClick={() => { 
                                    setEditingRuleId(r.id_horario); 
                                    setEditHoraEntrada(r.hora_entrada); 
                                    setEditHoraSalida(r.hora_salida);
                                    setEditEsCortado(!!r.es_cortado);
                                    setEditHoraEntrada2(r.hora_entrada_2 || '');
                                    setEditHoraSalida2(r.hora_salida_2 || '');
                                  }} className="text-amber-600/60 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveRegla(r.id_horario)} className="text-amber-600/60 hover:text-red-600 hover:bg-red-50 transition-colors">
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
  );
}
