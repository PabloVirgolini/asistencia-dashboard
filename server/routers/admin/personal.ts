import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure } from "../../_core/trpc";
import { 
  getActivePersonal, getCargos, insertCargo, updateCargo, deleteCargo, 
  insertPersonal, updatePersonal, deletePersonal, toggleEnCapacitacion
} from "../../services/personal.service";

export const personalProcedures = {
  getPersonal: adminProcedure.query(() => {
      return getActivePersonal();
  }),

  getCargos: adminProcedure.query(() => {
      return getCargos();
  }),

  addCargo: adminProcedure
    .input(z.object({ descripcion: z.string().min(1) }))
    .mutation(({ input }) => {
      insertCargo(input.descripcion);
      return { success: true };
    }),

  editCargo: adminProcedure
    .input(z.object({ id_cargo: z.number(), descripcion: z.string().min(1) }))
    .mutation(({ input }) => {
      updateCargo(input.id_cargo, input.descripcion);
      return { success: true };
    }),

  removeCargo: adminProcedure
    .input(z.object({ id_cargo: z.number() }))
    .mutation(({ input }) => {
      try {
        deleteCargo(input.id_cargo);
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),

  addPerson: adminProcedure
    .input(z.object({ legajo: z.string().trim().toLowerCase(), nombre: z.string(), sector: z.string(), cargo_id: z.number(), es_rotativo: z.number().default(0), en_capacitacion: z.boolean().default(false) }))
    .mutation(({ input }) => {
      insertPersonal(input.legajo, input.nombre, input.sector, input.cargo_id, input.es_rotativo, input.en_capacitacion);
      return { success: true };
    }),

  editPerson: adminProcedure
    .input(z.object({ originalLegajo: z.string().trim().toLowerCase(), legajo: z.string().trim().toLowerCase(), nombre: z.string(), sector: z.string(), activo: z.number(), cargo_id: z.number().nullable().optional(), es_rotativo: z.number().default(0), en_capacitacion: z.boolean().default(false) }))
    .mutation(({ input }) => {
      updatePersonal(input.originalLegajo, input.legajo, input.nombre, input.sector, input.activo, input.cargo_id || 1, input.es_rotativo, input.en_capacitacion);
      return { success: true };
    }),

  removePerson: adminProcedure
    .input(z.object({ legajo: z.string().trim().toLowerCase() }))
    .mutation(({ input }) => {
      deletePersonal(input.legajo);
      return { success: true };
    }),

  toggleCapacitacion: adminProcedure
    .input(z.object({ legajo: z.string().trim().toLowerCase(), estado: z.boolean() }))
    .mutation(({ input }) => {
      toggleEnCapacitacion(input.legajo, input.estado);
      return { success: true };
    }),
};
