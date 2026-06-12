import { z } from "zod";
import { adminProcedure } from "../../_core/trpc";
import { getPersonalPlanificable, savePlanificacionMasiva, getPlanificacionGuardada, getListaPlanesGuardados, deletePlanGuardado } from "../../services/planificador.service";

export const planificadorProcedures = {
  getPlanificable: adminProcedure
    .input(z.object({ sector: z.string(), fecha_inicio: z.string(), fecha_fin: z.string() }))
    .query(({ input }) => {
      return getPersonalPlanificable(input.sector, input.fecha_inicio, input.fecha_fin);
    }),

  savePlanificacion: adminProcedure
    .input(z.object({
      asignaciones: z.array(z.object({
        legajo: z.string(),
        id_turno: z.number().nullable(),
        fecha_inicio: z.string(),
        fecha_fin: z.string(),
        es_excepcional: z.number().nullable().optional(),
        hora_entrada_excepcional: z.string().nullable().optional(),
        hora_salida_excepcional: z.string().nullable().optional(),
        id_sector_excepcional: z.number().nullable().optional(),
        nombre_plan: z.string().nullable().optional()
      }))
    }))
    .mutation(({ input }) => {
      savePlanificacionMasiva(input.asignaciones);
      return { success: true };
    }),

  getPlanificacionGuardada: adminProcedure
    .input(z.object({ sector: z.string(), fecha_inicio: z.string(), fecha_fin: z.string() }))
    .query(({ input }) => {
      return getPlanificacionGuardada(input.sector, input.fecha_inicio, input.fecha_fin);
    }),

  getListaPlanesGuardados: adminProcedure
    .query(() => {
      return getListaPlanesGuardados();
    }),

  deletePlanGuardado: adminProcedure
    .input(z.object({ sector: z.string(), fecha_inicio: z.string(), fecha_fin: z.string().optional() }))
    .mutation(({ input }) => {
      deletePlanGuardado(input.sector, input.fecha_inicio, input.fecha_fin || '');
      return { success: true };
    }),
};
