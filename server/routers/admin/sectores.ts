import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, protectedProcedure } from "../../_core/trpc";
import { 
  insertSector, deleteSector, updateSector, 
  getSectoresCargos, updateSectorCargos 
} from "../../services/personal.service";

export const sectoresProcedures = {
  addSector: adminProcedure
    .input(z.object({ idSector: z.number(), descripcion: z.string().min(1) }))
    .mutation(({ input }) => {
      insertSector(input.idSector, input.descripcion);
      return { success: true };
    }),
    
  updateSector: adminProcedure
    .input(z.object({ idSector: z.number(), descripcion: z.string().min(1) }))
    .mutation(({ input }) => {
      updateSector(input.idSector, input.descripcion);
      return { success: true };
    }),

  removeSector: adminProcedure
    .input(z.object({ idSector: z.number() }))
    .mutation(({ input }) => {
      deleteSector(input.idSector);
      return { success: true };
    }),

  getSectoresCargos: protectedProcedure.query(() => {
    return getSectoresCargos();
  }),

  updateSectorCargos: adminProcedure
    .input(z.object({
      idSector: z.number(),
      cargosParams: z.array(z.object({
        id_cargo: z.number(),
        nivel_criticidad: z.number()
      }))
    }))
    .mutation(({ input }) => {
      try {
        updateSectorCargos(input.idSector, input.cargosParams);
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),
};
