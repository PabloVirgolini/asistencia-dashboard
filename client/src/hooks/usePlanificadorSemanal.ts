import { useState, useMemo } from 'react';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

export function usePlanificadorSemanal() {
  const [sector, setSector] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  
  type AsignacionType = {
    id_turno: number | null,
    es_excepcional?: boolean,
    hora_entrada_excepcional?: string,
    hora_salida_excepcional?: string,
    id_sector_excepcional?: number
  };

  const [asignaciones, setAsignaciones] = useState<Record<string, AsignacionType>>({});

  const { data: sectores = [] } = trpc.attendance.getSectors.useQuery();
  
  const { data: turnosBase = [] } = trpc.admin.getTurnosPorSector.useQuery(
    { id_sector: parseInt(sector) },
    { enabled: !!sector && !isNaN(parseInt(sector)) }
  );
  
  const { data: personalPlanificable = [], isLoading, refetch } = trpc.admin.getPlanificable.useQuery(
    { sector, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    { enabled: !!sector && !!fechaInicio && !!fechaFin }
  );

  const trpcContext = trpc.useContext();

  const saveMutation = trpc.admin.savePlanificacion.useMutation({
    onSuccess: () => {
      toast.success('Planificación guardada exitosamente');
      refetch();
      trpcContext.admin.getListaPlanesGuardados.invalidate();
    },
    onError: (err) => {
      toast.error(`Error al guardar: ${err.message}`);
    }
  });

  const toggleCapacitacionMutation = trpc.admin.toggleCapacitacion.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => {
      toast.error(`Error al actualizar estado de capacitación: ${err.message}`);
    }
  });

  const handleSelectTurno = (legajo: string, asig: AsignacionType) => {
    setAsignaciones(prev => ({ ...prev, [legajo]: asig }));
  };

  const handleSelectMasivo = (asig: AsignacionType) => {
    const nuevasAsignaciones: Record<string, AsignacionType> = {};
    personalPlanificable.forEach(p => {
      nuevasAsignaciones[p.legajo] = asig;
    });
    setAsignaciones(nuevasAsignaciones);
  };

  const handleSave = () => {
    const payload = Object.entries(asignaciones).map(([legajo, asig]) => ({
      legajo,
      id_turno: asig.id_turno,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      es_excepcional: asig.es_excepcional ? 1 : 0,
      hora_entrada_excepcional: asig.hora_entrada_excepcional,
      hora_salida_excepcional: asig.hora_salida_excepcional,
      id_sector_excepcional: asig.id_sector_excepcional
    }));

    if (payload.length === 0) {
      toast.error('No hay asignaciones para guardar');
      return;
    }

    saveMutation.mutate({ asignaciones: payload });
  };

  const handleResetPlan = () => {
    setSector('');
    setFechaInicio('');
    setFechaFin('');
    setAsignaciones({});
  };

  
  const handleEditPlan = async (editSector: string, editFechaInicio: string, editFechaFin: string) => {
    setSector(editSector);
    setFechaInicio(editFechaInicio);
    setFechaFin(editFechaFin);
    
    try {
      const existingPlan = await trpcContext.client.admin.getPlanificacionGuardada.query({
        sector: editSector,
        fecha_inicio: editFechaInicio,
        fecha_fin: editFechaFin
      });
      
      const newAsignaciones: any = {};
      existingPlan.forEach((p: any) => {
        newAsignaciones[p.legajo] = {
          id_turno: p.id_turno,
          es_excepcional: p.es_excepcional === 1,
          hora_entrada_excepcional: p.hora_entrada_excepcional,
          hora_salida_excepcional: p.hora_salida_excepcional,
          id_sector_excepcional: p.id_sector_excepcional
        };
      });
      
      setAsignaciones(newAsignaciones);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Error loading existing plan", err);
      toast.error('No se pudo cargar el plan existente.');
    }
  };

  return {
    sectores,
    turnosBase,
    sector, setSector,
    fechaInicio, setFechaInicio,
    fechaFin, setFechaFin,
    personalPlanificable,
    isLoading,
    asignaciones,
    handleSelectTurno,
    handleSelectMasivo,
    handleSave,
    isSaving: saveMutation.isPending,
    toggleCapacitacion: toggleCapacitacionMutation.mutateAsync,
    setAsignaciones,
    handleEditPlan,
    handleResetPlan
  };
}
