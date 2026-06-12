import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Plus, Trash2, ArrowUpDown, Search, Settings, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useTabSectores } from './useTabSectores';

export function TabSectores() {
  const {
    sectores, cargos, sectoresCargos,
    isSectorModalOpen, setIsSectorModalOpen,
    sectorId, setSectorId, sectorDesc, setSectorDesc,
    editingSectorId, setEditingSectorId, editSectorDesc, setEditSectorDesc,
    isCargosModalOpen, setIsCargosModalOpen, selectedConfigSector, setSelectedConfigSector,
    cargosParams, setCargosParams, sectorFilterText, setSectorFilterText,
    sortedAndFilteredSectores, handleSectorSort, handleAddSector,
    handleRemoveSector, handleUpdateSector, handleOpenCargosModal,
    handleSaveCargos, handleRemoveCargoFromSector, handleAddCargoToSector
  } = useTabSectores();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Sectores</CardTitle>
        <Dialog open={isSectorModalOpen} onOpenChange={setIsSectorModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Añadir Sector
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Sector</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSector} className="space-y-4">
              <div>
                <Label>ID de Sector (Numérico)</Label>
                <Input type="number" value={sectorId} onChange={e => setSectorId(e.target.value)} required />
              </div>
              <div>
                <Label>Descripción</Label>
                <Input value={sectorDesc} onChange={e => setSectorDesc(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Buscar por descripción o ID..." 
            className="pl-9"
            value={sectorFilterText}
            onChange={(e) => setSectorFilterText(e.target.value)}
          />
        </div>
        {!sectores ? <Loader2 className="animate-spin mx-auto my-8 text-indigo-600" /> : (
          <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSectorSort('idSector')}>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">ID <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSectorSort('descripcion')}>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">Descripción <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </TableHead>
                <TableHead>
                  <div className="font-semibold text-slate-700">Cargos Asignados</div>
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredSectores.map((s: any) => (
                <TableRow key={s.idSector}>
                  <TableCell className="font-medium">{s.idSector}</TableCell>
                  <TableCell>
                    {editingSectorId === s.idSector ? (
                      <Input 
                        value={editSectorDesc}
                        onChange={(e) => setEditSectorDesc(e.target.value)}
                        className="h-8 max-w-[200px]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateSector(s.idSector);
                          if (e.key === 'Escape') setEditingSectorId(null);
                        }}
                      />
                    ) : (
                      <span className="font-medium text-slate-800">{s.descripcion}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {sectoresCargos?.filter((sc: any) => sc.id_sector === s.idSector).map((sc: any) => {
                        const c = cargos?.find((c: any) => c.id_cargo === sc.id_cargo);
                        if (!c) return null;
                        return (
                          <span key={c.id_cargo} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-medium bg-white border shadow-sm text-slate-700">
                            {c.descripcion} 
                            <button 
                              onClick={() => handleRemoveCargoFromSector(s.idSector, c.id_cargo)} 
                              className="hover:bg-red-100 hover:text-red-600 rounded-full p-0.5 transition-colors"
                              title="Retirar cargo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                      {editingSectorId !== s.idSector && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200 shadow-sm" title="Añadir cargo rápidamente">
                              <Plus className="w-3 h-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto min-w-[200px] max-w-[320px] p-2" align="start">
                            <div className="space-y-2">
                              <h4 className="font-medium text-xs text-slate-500 uppercase tracking-wider">Añadir a {s.descripcion}</h4>
                              <div className="grid gap-1">
                                {cargos?.filter((c:any) => !sectoresCargos?.some((sc:any) => sc.id_sector === s.idSector && sc.id_cargo === c.id_cargo)).map((c:any) => (
                                  <Button 
                                    key={c.id_cargo} 
                                    variant="ghost" 
                                    size="sm" 
                                    className="justify-start h-auto py-1.5 px-2 text-xs font-normal whitespace-normal text-left" 
                                    onClick={() => handleAddCargoToSector(s.idSector, c.id_cargo)}
                                  >
                                    <Plus className="w-3 h-3 mr-2 shrink-0 text-slate-400" />
                                    <span className="leading-tight">{c.descripcion}</span>
                                  </Button>
                                ))}
                                {cargos?.filter((c:any) => !sectoresCargos?.some((sc:any) => sc.id_sector === s.idSector && sc.id_cargo === c.id_cargo)).length === 0 && (
                                  <span className="text-xs text-slate-500 p-2 text-center block">Todos los cargos asignados.</span>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingSectorId === s.idSector ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleUpdateSector(s.idSector)}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingSectorId(null)}>
                          <X className="w-4 h-4 text-slate-400" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" title="Configurar Cargos" onClick={() => handleOpenCargosModal(s.idSector)}>
                          <Settings className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingSectorId(s.idSector); setEditSectorDesc(s.descripcion); }}>
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSector(s.idSector)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {sortedAndFilteredSectores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500 py-6">
                    No se encontraron sectores
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isCargosModalOpen} onOpenChange={setIsCargosModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configurar Cargos: {selectedConfigSector} - {sectores?.find((s: any) => s.idSector === selectedConfigSector)?.descripcion || ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Selecciona los cargos que están habilitados para el sector y define su nivel de criticidad específico.
            </p>
            
            {cargos && cargos.map((cargo: any) => {
              const mapped = cargosParams.find(cp => cp.id_cargo === cargo.id_cargo);
              const isEnabled = !!mapped;
              
              return (
                <div key={cargo.id_cargo} className="flex items-center gap-4 p-3 border rounded-md hover:bg-slate-50">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    checked={isEnabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCargosParams([...cargosParams, { id_cargo: cargo.id_cargo, nivel_criticidad: 1 }]);
                      } else {
                        setCargosParams(cargosParams.filter(cp => cp.id_cargo !== cargo.id_cargo));
                      }
                    }}
                  />
                  <div className="flex-1 font-medium text-slate-700">{cargo.descripcion}</div>
                  {isEnabled && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-slate-500">Criticidad:</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5" 
                        className="w-20 h-8"
                        value={mapped?.nivel_criticidad || 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val > 0) {
                            setCargosParams(cargosParams.map(cp => 
                              cp.id_cargo === cargo.id_cargo ? { ...cp, nivel_criticidad: val } : cp
                            ));
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCargosModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCargos} className="bg-indigo-600 hover:bg-indigo-700">Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
