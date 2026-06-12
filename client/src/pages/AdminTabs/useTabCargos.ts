import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function useTabCargos() {
  const trpcContext = trpc.useContext();
  
  const { data: cargos, isLoading: isCargosLoading } = trpc.admin.getCargos.useQuery();

  const addCargoMutation = trpc.admin.addCargo.useMutation();
  const editCargoMutation = trpc.admin.editCargo.useMutation();
  const removeCargoMutation = trpc.admin.removeCargo.useMutation();

  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [cargoDesc, setCargoDesc] = useState('');
  const [inlineCargoDesc, setInlineCargoDesc] = useState('');
  
  const [editingCargoId, setEditingCargoId] = useState<number | null>(null);
  const [editCargoDesc, setEditCargoDesc] = useState('');
  
  const [cargoSortConfig, setCargoSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [cargoFilterText, setCargoFilterText] = useState('');

  const sortedAndFilteredCargos = useMemo(() => {
    let result = cargos ? [...cargos] : [];
    if (cargoFilterText) {
      const lowerFilter = cargoFilterText.toLowerCase();
      result = result.filter((c: any) => 
        c.id_cargo.toString().includes(lowerFilter) ||
        c.descripcion.toLowerCase().includes(lowerFilter)
      );
    }
    if (cargoSortConfig) {
      result.sort((a: any, b: any) => {
        const aVal = a[cargoSortConfig.key];
        const bVal = b[cargoSortConfig.key];
        if (aVal < bVal) return cargoSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return cargoSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [cargos, cargoSortConfig, cargoFilterText]);

  const handleCargoSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (cargoSortConfig && cargoSortConfig.key === key && cargoSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setCargoSortConfig({ key, direction });
  };

  const handleAddCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCargoMutation.mutateAsync({ descripcion: cargoDesc });
      toast.success('Cargo añadido');
      setIsCargoModalOpen(false);
      setCargoDesc('');
      trpcContext.admin.getCargos.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al añadir cargo');
    }
  };

  const handleAddInlineCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineCargoDesc.trim()) return;
    try {
      await addCargoMutation.mutateAsync({ descripcion: inlineCargoDesc });
      toast.success('Cargo añadido globalmente');
      setInlineCargoDesc('');
      trpcContext.admin.getCargos.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al añadir cargo');
    }
  };

  const handleRemoveCargo = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este cargo?')) return;
    try {
      await removeCargoMutation.mutateAsync({ id_cargo: id });
      toast.success('Cargo eliminado');
      trpcContext.admin.getCargos.invalidate();
    } catch (err: any) {
      toast.error('Error al eliminar');
    }
  };

  const handleUpdateCargo = async (id: number) => {
    try {
      await editCargoMutation.mutateAsync({ id_cargo: id, descripcion: editCargoDesc });
      toast.success('Cargo actualizado');
      setEditingCargoId(null);
      trpcContext.admin.getCargos.invalidate();
    } catch (err: any) {
      toast.error('Error al actualizar cargo');
    }
  };

  return {
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
  };
}
