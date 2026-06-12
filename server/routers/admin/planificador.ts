import { z } from "zod";
import { adminProcedure } from "../../_core/trpc";
import { getPersonalPlanificable, savePlanificacionMasiva, getPlanificacionGuardada, getListaPlanesGuardados, deletePlanGuardado } from "../../services/planificador.service";
import { exec } from "child_process";

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
      
      // Disparar motor de inconsistencias en background para recalcular con el nuevo plan
      exec('npx tsx scripts/calculate-inconsistencies.ts', (error) => {
        if (error) console.error('[Planificador] Error al disparar motor de inconsistencias:', error);
      });
      
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
      
      // Disparar motor de inconsistencias en background para recalcular tras borrar plan
      exec('npx tsx scripts/calculate-inconsistencies.ts', (error) => {
        if (error) console.error('[Planificador] Error al disparar motor de inconsistencias tras borrado:', error);
      });

      return { success: true };
    }),
};
