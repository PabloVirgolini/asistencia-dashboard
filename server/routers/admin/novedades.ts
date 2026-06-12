import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure } from "../../_core/trpc";
import { getNovedades, insertNovedad, deleteNovedad, updateNovedad } from "../../services/novedades.service";
import { isValidDate } from "../../services/admin.service";
import { exec } from "child_process";

export const novedadesProcedures = {
  getNovedades: adminProcedure.query(() => {
    return getNovedades();
  }),

  addNovedad: adminProcedure
    .input(z.object({ 
      legajo: z.string().trim().toLowerCase(), 
      tipo: z.string(), 
      fecha_inicio: z.string().refine(isValidDate, "Fecha inválida"), 
      fecha_fin: z.string().refine(isValidDate, "Fecha inválida"), 
      observaciones: z.string().optional(), 
      mostrar_en_dashboard: z.boolean().default(true) 
    }))
    .mutation(({ input }) => {
      try {
        insertNovedad(input.legajo, input.tipo, input.fecha_inicio, input.fecha_fin, input.observaciones, input.mostrar_en_dashboard);
        exec('npx tsx scripts/calculate-inconsistencies.ts');
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),

  removeNovedad: adminProcedure
    .input(z.object({ id_novedad: z.number() }))
    .mutation(({ input }) => {
      deleteNovedad(input.id_novedad);
      exec('npx tsx scripts/calculate-inconsistencies.ts');
      return { success: true };
    }),

  updateNovedad: adminProcedure
    .input(z.object({ 
      id_novedad: z.number(), 
      legajo: z.string().trim().toLowerCase(), 
      tipo: z.string(), 
      fecha_inicio: z.string().refine(isValidDate, "Fecha inválida"), 
      fecha_fin: z.string().refine(isValidDate, "Fecha inválida"), 
      observaciones: z.string().optional(),
      mostrar_en_dashboard: z.boolean().default(true)
    }))
    .mutation(({ input }) => {
      try {
        updateNovedad(input.id_novedad, input.legajo, input.tipo, input.fecha_inicio, input.fecha_fin, input.observaciones, input.mostrar_en_dashboard);
        exec('npx tsx scripts/calculate-inconsistencies.ts');
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),
};
