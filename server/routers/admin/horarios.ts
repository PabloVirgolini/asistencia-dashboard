import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure } from "../../_core/trpc";
import { 
  getTurnosHorarios, getTurnosPorSector, addTurnoHorario, removeTurnoHorario, updateTurnoHorario,
  getHorariosReglas, duplicateSectorRules, duplicateCargoRules,
  addHorario, updateHorario, removeHorario, batchUpdateHorarios
} from "../../services/horarios.service";
import { exec } from "child_process";

export const horariosProcedures = {
  getTurnosHorarios: adminProcedure.query(() => {
    return getTurnosHorarios();
  }),
  
  getTurnosPorSector: adminProcedure
    .input(z.object({ id_sector: z.number() }))
    .query(({ input }) => {
      return getTurnosPorSector(input.id_sector);
    }),
  
  addTurnoHorario: adminProcedure
    .input(z.object({ descripcion: z.string().min(1) }))
    .mutation(({ input }) => {
      try {
        addTurnoHorario(input.descripcion);
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),
    
  updateTurnoHorario: adminProcedure
    .input(z.object({ id_turno: z.number(), descripcion: z.string().min(1) }))
    .mutation(({ input }) => {
      try {
        updateTurnoHorario(input.id_turno, input.descripcion);
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),

  removeTurnoHorario: adminProcedure
    .input(z.object({ id_turno: z.number() }))
    .mutation(({ input }) => {
      try {
        removeTurnoHorario(input.id_turno);
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),
    
  getHorariosReglas: adminProcedure.query(() => {
    return getHorariosReglas();
  }),
  
  duplicateSectorRules: adminProcedure
    .input(z.object({
      id_turno: z.number(),
      source_sector: z.number(),
      target_sector: z.number()
    }))
    .mutation(({ input, ctx }) => {
      try {
        duplicateSectorRules(input.id_turno, input.source_sector, input.target_sector, ctx.user?.name || 'Administrador');
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),
    
  duplicateCargoRules: adminProcedure
    .input(z.object({
      id_turno: z.number(),
      id_sector: z.number(),
      source_cargo: z.number(),
      target_cargo: z.number()
    }))
    .mutation(({ input, ctx }) => {
      try {
        duplicateCargoRules(input.id_turno, input.id_sector, input.source_cargo, input.target_cargo, ctx.user?.name || 'Administrador');
        exec('npx tsx scripts/calculate-inconsistencies.ts');
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),
  
  addHorario: adminProcedure
    .input(z.object({
      id_sector: z.number().nullable(),
      id_cargo: z.number().nullable(),
      legajo: z.string().trim().toLowerCase().nullable(),
      id_turno: z.number(),
      dias: z.array(z.number()),
      hora_entrada: z.string(),
      hora_salida: z.string(),
      es_cortado: z.number().default(0),
      hora_entrada_2: z.string().nullable().optional(),
      hora_salida_2: z.string().nullable().optional()
    }))
    .mutation(({ input, ctx }) => {
      try {
        addHorario(
          input.id_sector, 
          input.id_cargo, 
          input.legajo?.trim().toLowerCase() || null,
          input.id_turno,
          input.dias,
          input.hora_entrada, 
          input.hora_salida,
          ctx.user?.name || 'Sistema',
          input.es_cortado,
          input.hora_entrada_2 || null,
          input.hora_salida_2 || null
        );
        exec('npx tsx scripts/calculate-inconsistencies.ts');
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),
    
  removeHorario: adminProcedure
    .input(z.object({ id_horario: z.number() }))
    .mutation(({ input }) => {
      try {
        removeHorario(input.id_horario);
        exec('npx tsx scripts/calculate-inconsistencies.ts');
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),

  updateHorario: adminProcedure
    .input(z.object({
      id_horario: z.number(),
      hora_entrada: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"),
      hora_salida: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"),
      es_cortado: z.number().default(0),
      hora_entrada_2: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)").nullable().optional(),
      hora_salida_2: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)").nullable().optional()
    }))
    .mutation(({ input, ctx }) => {
      try {
        updateHorario(
          input.id_horario, 
          input.hora_entrada, 
          input.hora_salida, 
          ctx.user?.name || 'Administrador',
          input.es_cortado,
          input.hora_entrada_2 || null,
          input.hora_salida_2 || null
        );
        exec('npx tsx scripts/calculate-inconsistencies.ts');
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),

  batchUpdateHorarios: adminProcedure
    .input(z.object({
      id_horarios: z.array(z.number()),
      hora_entrada: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"),
      hora_salida: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"),
      es_cortado: z.number().default(0),
      hora_entrada_2: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)").nullable().optional(),
      hora_salida_2: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)").nullable().optional()
    }))
    .mutation(({ input, ctx }) => {
      try {
        batchUpdateHorarios(
          input.id_horarios, 
          input.hora_entrada, 
          input.hora_salida, 
          ctx.user?.name || 'Administrador',
          input.es_cortado,
          input.hora_entrada_2 || null,
          input.hora_salida_2 || null
        );
        exec('npx tsx scripts/calculate-inconsistencies.ts');
        return { success: true };
      } catch (e: any) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
      }
    }),
};
