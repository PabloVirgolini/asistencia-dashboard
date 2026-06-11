import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure } from "../../_core/trpc";
import { getNovedades, insertNovedad, deleteNovedad } from "../../services/novedades.service";

export const novedadesProcedures = {
  getNovedades: adminProcedure.query(() => {
    return getNovedades();
  }),

  addNovedad: adminProcedure
    .input(z.object({ legajo: z.string(), tipo: z.string(), fecha_inicio: z.string(), fecha_fin: z.string(), observaciones: z.string().optional() }))
    .mutation(({ input }) => {
      try {
        insertNovedad(input.legajo, input.tipo, input.fecha_inicio, input.fecha_fin, input.observaciones);
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),

  removeNovedad: adminProcedure
    .input(z.object({ id_novedad: z.number() }))
    .mutation(({ input }) => {
      deleteNovedad(input.id_novedad);
      return { success: true };
    }),
};
