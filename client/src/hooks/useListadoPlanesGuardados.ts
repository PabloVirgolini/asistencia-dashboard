import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function useListadoPlanesGuardados() {
  const trpcContext = trpc.useContext();
  const { data: planes, isLoading } = trpc.admin.getListaPlanesGuardados.useQuery();
  const deletePlanMutation = trpc.admin.deletePlanGuardado.useMutation();
  const [expandedPlanIndex, setExpandedPlanIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    if (expandedPlanIndex === index) {
      setExpandedPlanIndex(null);
    } else {
      setExpandedPlanIndex(index);
    }
  };

  const handleDeletePlan = async (e: React.MouseEvent, sector: string, fechaInicio: string, fechaFin: string | null) => {
    e.stopPropagation();
    if (!window.confirm('¿Seguro que deseas eliminar este plan? Se borrarán todos los turnos asignados para este sector en estas fechas.')) {
      return;
    }
    
    try {
      await deletePlanMutation.mutateAsync({ 
        sector, 
        fecha_inicio: fechaInicio, 
        fecha_fin: fechaFin || ''
      });
      toast.success('Plan eliminado correctamente');
      trpcContext.admin.getListaPlanesGuardados.invalidate();
      if (expandedPlanIndex !== null) setExpandedPlanIndex(null);
    } catch (err: any) {
      toast.error('Error al eliminar el plan: ' + err.message);
    }
  };

  return {
    planes,
    isLoading,
    expandedPlanIndex,
    toggleExpand,
    handleDeletePlan
  };
}
