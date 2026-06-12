import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function useTabSectores() {
  const trpcContext = trpc.useContext();
  
  const { data: sectores, isLoading: isSectoresLoading } = trpc.attendance.getSectors.useQuery();
  const { data: cargos } = trpc.admin.getCargos.useQuery();
  const { data: sectoresCargos } = trpc.admin.getSectoresCargos.useQuery();

  const addSectorMutation = trpc.admin.addSector.useMutation();
  const removeSectorMutation = trpc.admin.removeSector.useMutation();
  const updateSectorMutation = trpc.admin.updateSector.useMutation();
  const updateSectorCargosMutation = trpc.admin.updateSectorCargos.useMutation();

  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [sectorId, setSectorId] = useState('');
  const [sectorDesc, setSectorDesc] = useState('');

  const [editingSectorId, setEditingSectorId] = useState<number | null>(null);
  const [editSectorDesc, setEditSectorDesc] = useState('');
  
  const [isCargosModalOpen, setIsCargosModalOpen] = useState(false);
  const [selectedConfigSector, setSelectedConfigSector] = useState<number | null>(null);
  const [cargosParams, setCargosParams] = useState<{id_cargo: number, nivel_criticidad: number}[]>([]);

  const [sectorSortConfig, setSectorSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [sectorFilterText, setSectorFilterText] = useState('');

  const sortedAndFilteredSectores = useMemo(() => {
    let result = sectores ? [...sectores] : [];
    
    if (sectorFilterText) {
      const lowerFilter = sectorFilterText.toLowerCase();
      result = result.filter((s: any) => 
        s.idSector.toString().includes(lowerFilter) ||
        s.descripcion.toLowerCase().includes(lowerFilter)
      );
    }
    
    if (sectorSortConfig) {
      result.sort((a: any, b: any) => {
        const aVal = a[sectorSortConfig.key];
        const bVal = b[sectorSortConfig.key];
        
        if (aVal < bVal) return sectorSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sectorSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [sectores, sectorSortConfig, sectorFilterText]);

  const handleSectorSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sectorSortConfig && sectorSortConfig.key === key && sectorSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSectorSortConfig({ key, direction });
  };

  const handleAddSector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSectorMutation.mutateAsync({ 
        idSector: parseInt(sectorId), 
        descripcion: sectorDesc 
      });
      toast.success('Sector añadido');
      setIsSectorModalOpen(false);
      trpcContext.attendance.getSectors.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al añadir sector');
    }
  };

  const handleRemoveSector = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este sector?')) return;
    try {
      await removeSectorMutation.mutateAsync({ idSector: id });
      toast.success('Sector eliminado');
      trpcContext.attendance.getSectors.invalidate();
    } catch (err: any) {
      toast.error('Error al eliminar');
    }
  };

  const handleUpdateSector = async (id: number) => {
    try {
      await updateSectorMutation.mutateAsync({ idSector: id, descripcion: editSectorDesc });
      toast.success('Sector actualizado');
      setEditingSectorId(null);
      trpcContext.attendance.getSectors.invalidate();
    } catch (err: any) {
      toast.error('Error al actualizar sector');
    }
  };

  const handleOpenCargosModal = (idSector: number) => {
    setSelectedConfigSector(idSector);
    const sectorMap = (sectoresCargos || []).filter((sc: any) => sc.id_sector === idSector);
    setCargosParams(sectorMap.map((sc: any) => ({ id_cargo: sc.id_cargo, nivel_criticidad: sc.nivel_criticidad })));
    setIsCargosModalOpen(true);
  };

  const handleSaveCargos = async () => {
    if (!selectedConfigSector) return;
    try {
      await updateSectorCargosMutation.mutateAsync({ idSector: selectedConfigSector, cargosParams });
      toast.success('Cargos actualizados');
      setIsCargosModalOpen(false);
      trpcContext.admin.getSectoresCargos.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar cargos');
    }
  };

  const handleRemoveCargoFromSector = async (sectorId: number, cargoId: number) => {
    try {
      const currentConfig = sectoresCargos?.filter((sc: any) => sc.id_sector === sectorId) || [];
      const newConfig = currentConfig
        .filter((sc: any) => sc.id_cargo !== cargoId)
        .map((sc: any) => ({ id_cargo: sc.id_cargo, nivel_criticidad: sc.nivel_criticidad }));
        
      await updateSectorCargosMutation.mutateAsync({ idSector: sectorId, cargosParams: newConfig });
      trpcContext.admin.getSectoresCargos.invalidate();
      toast.success('Cargo retirado del sector');
    } catch (err: any) {
      toast.error(err.message || 'Error al retirar cargo');
    }
  };

  const handleAddCargoToSector = async (sectorId: number, cargoId: number) => {
    try {
      const currentConfig = sectoresCargos?.filter((sc: any) => sc.id_sector === sectorId) || [];
      const newConfig = currentConfig.map((sc: any) => ({ id_cargo: sc.id_cargo, nivel_criticidad: sc.nivel_criticidad }));
      newConfig.push({ id_cargo: cargoId, nivel_criticidad: 0 }); 
      
      await updateSectorCargosMutation.mutateAsync({ idSector: sectorId, cargosParams: newConfig });
      trpcContext.admin.getSectoresCargos.invalidate();
      toast.success('Cargo asignado al sector');
    } catch (err: any) {
      toast.error(err.message || 'Error al añadir cargo');
    }
  };

  return {
    sectores,
    cargos,
    sectoresCargos,
    isSectorModalOpen, setIsSectorModalOpen,
    sectorId, setSectorId,
    sectorDesc, setSectorDesc,
    editingSectorId, setEditingSectorId,
    editSectorDesc, setEditSectorDesc,
    isCargosModalOpen, setIsCargosModalOpen,
    selectedConfigSector, setSelectedConfigSector,
    cargosParams, setCargosParams,
    sectorFilterText, setSectorFilterText,
    sortedAndFilteredSectores,
    handleSectorSort,
    handleAddSector,
    handleRemoveSector,
    handleUpdateSector,
    handleOpenCargosModal,
    handleSaveCargos,
    handleRemoveCargoFromSector,
    handleAddCargoToSector
  };
}
