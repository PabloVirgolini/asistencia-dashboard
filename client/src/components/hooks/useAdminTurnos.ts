import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function useAdminTurnos() {
  const trpcContext = trpc.useContext();
  
  // Queries
  const turnosQuery = trpc.admin.getTurnosHorarios.useQuery();
  const reglasQuery = trpc.admin.getHorariosReglas.useQuery();
  const sectoresQuery = trpc.attendance.getSectors.useQuery();
  const sectoresCargosQuery = trpc.admin.getSectoresCargos.useQuery();
  const cargosQuery = trpc.admin.getCargos.useQuery();
  const personalQuery = trpc.admin.getPersonal.useQuery();

  // Mutations
  const addTurno = trpc.admin.addTurnoHorario.useMutation({
    onSuccess: () => {
      trpcContext.admin.getTurnosHorarios.invalidate();
      toast.success('Turno creado');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al crear turno');
    }
  });

  const removeTurno = trpc.admin.removeTurnoHorario.useMutation({
    onSuccess: () => {
      trpcContext.admin.getTurnosHorarios.invalidate();
      toast.success('Turno eliminado');
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar: ${err.message}`);
    }
  });

  const updateTurnoHorario = trpc.admin.updateTurnoHorario.useMutation({
    onSuccess: () => {
      toast.success('Turno actualizado exitosamente');
      trpcContext.admin.getTurnosHorarios.invalidate();
      trpcContext.admin.getHorariosReglas.invalidate();
    },
    onError: (err: any) => toast.error(`Error al actualizar turno: ${err.message}`)
  });

  const addRegla = trpc.admin.addHorario.useMutation({
    onSuccess: () => {
      trpcContext.admin.getHorariosReglas.invalidate();
    },
    onError: (err: any) => {
      toast.error(`Error al crear regla: ${err.message}`);
    }
  });

  const removeRegla = trpc.admin.removeHorario.useMutation({
    onSuccess: () => {
      trpcContext.admin.getHorariosReglas.invalidate();
      toast.success('Regla eliminada');
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar regla: ${err.message}`);
    }
  });

  const updateHorario = trpc.admin.updateHorario.useMutation({
    onSuccess: () => {
      trpcContext.admin.getTurnosHorarios.invalidate();
      trpcContext.admin.getHorariosReglas.invalidate();
      toast.success('Horario actualizado correctamente');
    },
    onError: (err: any) => {
      toast.error(`Error al actualizar: ${err.message}`);
    }
  });

  const batchUpdate = trpc.admin.batchUpdateHorarios.useMutation({
    onSuccess: () => {
      trpcContext.admin.getHorariosReglas.invalidate();
      toast.success('Horarios actualizados correctamente');
    },
    onError: (err: any) => {
      toast.error(`Error en la actualización masiva: ${err.message}`);
    }
  });

  const duplicateSector = trpc.admin.duplicateSectorRules.useMutation({
    onSuccess: () => {
      trpcContext.admin.getHorariosReglas.invalidate();
      toast.success('Reglas clonadas por sector exitosamente');
    },
    onError: (err: any) => {
      toast.error(`Error al clonar por sector: ${err.message}`);
    }
  });

  const duplicateCargo = trpc.admin.duplicateCargoRules.useMutation({
    onSuccess: () => {
      trpcContext.admin.getHorariosReglas.invalidate();
      toast.success('Reglas clonadas por cargo exitosamente');
    },
    onError: (err: any) => {
      toast.error(`Error al clonar por cargo: ${err.message}`);
    }
  });

  return {
    queries: {
      turnos: turnosQuery.data,
      isTurnosLoading: turnosQuery.isLoading,
      reglas: reglasQuery.data,
      isReglasLoading: reglasQuery.isLoading,
      sectores: sectoresQuery.data,
      sectoresCargos: sectoresCargosQuery.data,
      cargosData: cargosQuery.data,
      personal: personalQuery.data,
    },
    mutations: {
      addTurno,
      removeTurno,
      addRegla,
      removeRegla,
      updateHorario,
      batchUpdate,
      duplicateSector,
      duplicateCargo,
      updateTurnoHorario,
    }
  };
}
