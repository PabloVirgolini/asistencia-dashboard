import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Modales({
  batchModalOpen, setBatchModalOpen,
  batchHoraEntrada, setBatchHoraEntrada,
  batchHoraSalida, setBatchHoraSalida,
  handleBatchUpdateSubmit,
  selectedRules,
  
  duplicateModalOpen, setDuplicateModalOpen,
  duplicateSource, duplicateTargetSector, setDuplicateTargetSector,
  uniqueSectores, reglas, handleDuplicateSector,
  
  duplicateCargoModalOpen, setDuplicateCargoModalOpen,
  duplicateCargoSource, duplicateCargoTarget, setDuplicateCargoTarget,
  cargosData, handleDuplicateCargo
}: any) {
  return (
    <>
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
            <Button onClick={handleBatchUpdateSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
                {uniqueSectores.filter((s: string) => s !== duplicateSource?.nombreSector).map((s: string) => {
                  const sObj = reglas?.find((r: any) => r.sector === s);
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
                {cargosData?.filter((c: any) => c.id_cargo !== duplicateCargoSource?.id_cargo).map((c: any) => (
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
