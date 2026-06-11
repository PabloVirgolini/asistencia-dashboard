import { useState, useMemo } from 'react';
import { trpc } from '../utils/trpc';
import toast from 'react-hot-toast';

export function usePlanificadorSemanal() {
  const [sector, setSector] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  
  // Estado local para almacenar qué turno seleccionó el admin para cada empleado
  const [asignaciones, setAsignaciones] = useState<Record<string, number>>({});

  const { data: sectores = [] } = trpc.getSectores.useQuery();
  const { data: turnosBase = [] } = trpc.getTurnosHorarios.useQuery();
  
  const { data: personalPlanificable = [], isLoading, refetch } = trpc.getPlanificable.useQuery(
    { sector, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    { enabled: !!sector && !!fechaInicio && !!fechaFin }
  );

  const saveMutation = trpc.savePlanificacion.useMutation({
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
