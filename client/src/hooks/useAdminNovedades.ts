import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

export function useAdminNovedades() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: novedades = [], refetch, isLoading } = trpc.admin.getNovedades.useQuery();
  const { data: personalActivo = [] } = trpc.admin.getPersonal.useQuery();

  const addMutation = trpc.admin.addNovedad.useMutation({
    onSuccess: () => {
      toast.success('Novedad registrada exitosamente');
      refetch();
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  const updateMutation = trpc.admin.updateNovedad.useMutation({
    onSuccess: () => {
      toast.success('Novedad actualizada exitosamente');
      refetch();
      setIsModalOpen(false);
      setEditingId(null);
    },
    onError: (err) => {
      toast.error(`Error al actualizar: ${err.message}`);
    }
  });

  const removeMutation = trpc.admin.removeNovedad.useMutation({
    onSuccess: () => {
      toast.success('Novedad eliminada');
      refetch();
    },
    onError: (err) => {
      toast.error(`Error al eliminar: ${err.message}`);
    }
  });

  const handleAdd = (data: { legajo: string, tipo: string, fecha_inicio: string, fecha_fin: string, observaciones?: string, mostrar_en_dashboard: boolean }) => {
    if (editingId) {
      updateMutation.mutate({ id_novedad: editingId, ...data });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleRemove = (id_novedad: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta novedad/licencia?')) {
      removeMutation.mutate({ id_novedad });
    }
  };

  const handleEditClick = (novedad: any) => {
    setEditingId(novedad.id_novedad);
    setIsModalOpen(true);
  };

  return {
    novedades,
    personalActivo,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    editingId,
    setEditingId,
    handleAdd,
    handleRemove,
    handleEditClick,
    isAdding: addMutation.isPending || removeMutation.isPending || updateMutation.isPending
  };
}
