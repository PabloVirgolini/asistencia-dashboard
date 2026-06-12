import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2, ArrowUpDown, Search, Pencil, Check, X, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useTabCargos } from './useTabCargos';

export function TabCargos() {
  const {
    cargos,
    isCargoModalOpen, setIsCargoModalOpen,
    cargoDesc, setCargoDesc,
    inlineCargoDesc, setInlineCargoDesc,
    editingCargoId, setEditingCargoId,
    editCargoDesc, setEditCargoDesc,
    cargoFilterText, setCargoFilterText,
    sortedAndFilteredCargos,
    handleCargoSort,
    handleAddCargo,
    handleAddInlineCargo,
    handleRemoveCargo,
    handleUpdateCargo
  } = useTabCargos();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Cargos Generales</CardTitle>
        <Dialog open={isCargoModalOpen} onOpenChange={setIsCargoModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Añadir Cargo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Cargo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCargo} className="space-y-4">
              <div>
                <Label>Nombre / Descripción</Label>
                <Input value={cargoDesc} onChange={e => setCargoDesc(e.target.value)} required placeholder="Ej: Operario de Mantenimiento" />
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
            placeholder="Buscar cargo..." 
            className="pl-9"
            value={cargoFilterText}
            onChange={(e) => setCargoFilterText(e.target.value)}
          />
        </div>
        {!cargos ? <Loader2 className="animate-spin mx-auto my-8 text-indigo-600" /> : (
          <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors w-24" onClick={() => handleCargoSort('id_cargo')}>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">ID <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleCargoSort('descripcion')}>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">Descripción <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700 w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredCargos.map((c: any) => (
                <TableRow key={c.id_cargo}>
                  <TableCell className="font-medium">{c.id_cargo}</TableCell>
                  <TableCell>
                    {editingCargoId === c.id_cargo ? (
                      <Input 
                        value={editCargoDesc}
                        onChange={(e) => setEditCargoDesc(e.target.value)}
                        className="h-8 max-w-[300px]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateCargo(c.id_cargo);
                          if (e.key === 'Escape') setEditingCargoId(null);
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span>{c.descripcion}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingCargoId === c.id_cargo ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleUpdateCargo(c.id_cargo)}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingCargoId(null)}>
                          <X className="w-4 h-4 text-slate-400" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCargoId(c.id_cargo); setEditCargoDesc(c.descripcion); }}>
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveCargo(c.id_cargo)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {sortedAndFilteredCargos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-500 py-6">
                    No se encontraron cargos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t">
          <Label className="text-sm font-semibold mb-2 block text-slate-700">¿Falta un cargo? Añádelo rápidamente:</Label>
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Nombre del nuevo cargo..." 
              value={inlineCargoDesc}
              onChange={e => setInlineCargoDesc(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInlineCargo(e as any);
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={handleAddInlineCargo} disabled={!inlineCargoDesc.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Crear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
