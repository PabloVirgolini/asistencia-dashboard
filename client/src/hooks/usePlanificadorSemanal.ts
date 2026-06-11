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

  const saveMutation = trpc.admin.savePlanificacion.useMutation({
    onSuccess: () => {
      toast.success('Planificación guardada exitosamente');
      refetch();
    },
    onError: (err) => {
      toast.error(`Error al guardar: ${err.message}`);
    }
  });

  const handleSelectTurno = (legajo: string, asig: AsignacionType) => {
    setAsignaciones(prev => ({ ...prev, [legajo]: asig }));
  };

  const handleSelectMasivo = (asig: AsignacionType) => {
    const nuevasAsignaciones: Record<string, AsignacionType> = {};
    personalPlanificable.forEach(p => {
      if (!p.novedad_activa) {
        nuevasAsignaciones[p.legajo] = asig;
      }
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
    isSaving: saveMutation.isPending
  };
}
