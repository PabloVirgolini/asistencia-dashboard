import { useState, useMemo } from 'react';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

export function usePlanificadorSemanal() {
  const [sector, setSector] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  
  // Estado local para almacenar qué turno seleccionó el admin para cada empleado
  const [asignaciones, setAsignaciones] = useState<Record<string, number>>({});

  const { data: sectores = [] } = trpc.attendance.getSectors.useQuery();
  const { data: turnosBase = [] } = trpc.admin.getTurnosHorarios.useQuery();
  
  const { data: personalPlanificable = [], isLoading, refetch } = trpc.admin.getPlanificable.useQuery(
    { sector, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    { enabled: !!sector && !!fechaInicio && !!fechaFin }
  );

  const saveMutation = trpc.admin.savePlanificacion.useMutation({
    onSuccess: () => {
      toast.success('Planificación guardada exitosamente');
      refetch();
    },
    onError: (err) => {
      toast.error(`Error al guardar: ${err.message}`);
    }
  });

  const handleSelectTurno = (legajo: string, id_turno: number) => {
    setAsignaciones(prev => ({ ...prev, [legajo]: id_turno }));
  };

  const handleSelectMasivo = (id_turno: number) => {
    const nuevasAsignaciones: Record<string, number> = {};
    personalPlanificable.forEach(p => {
      if (!p.novedad_activa) {
        nuevasAsignaciones[p.legajo] = id_turno;
      }
    });
    setAsignaciones(nuevasAsignaciones);
  };

  const handleSave = () => {
    const payload = Object.entries(asignaciones).map(([legajo, id_turno]) => ({
      legajo,
      id_turno,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    }));

    if (payload.length === 0) {
      toast.error('No hay asignaciones para guardar');
      return;
    }

    saveMutation.mutate({ asignaciones: payload });
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
    isSaving: saveMutation.isLoading
  };
}
