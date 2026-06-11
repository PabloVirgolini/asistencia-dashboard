import { TRPCError } from "@trpc/server";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as crypto from 'crypto';
import { COOKIE_NAME } from '../shared/const';
import { 
  getSectors, getActivePersonal, getCargos, getSectoresCargos, 
  insertSector, deleteSector, updateSector, updateSectorCargos, 
  insertCargo, updateCargo, deleteCargo, 
  insertPersonal, updatePersonal, deletePersonal 
} from "./services/personal.service";
import { 
  getTurnosHorarios, addTurnoHorario, removeTurnoHorario, 
  getHorariosReglas, addHorario, updateHorario, removeHorario, batchUpdateHorarios, 
  duplicateSectorRules, duplicateCargoRules 
} from "./services/horarios.service";
import { getNovedades, insertNovedad, deleteNovedad } from './services/novedades.service';
import { getPersonalPlanificable, savePlanificacionMasiva } from './services/planificador.service';
import { 
  getFichadasByDate, getPresentesByDate, getAusentesByDate, getAttendanceSummary 
} from "./services/asistencia.service";
import { 
  getAdminByEmail, createAdmin, isValidDate, getTodayDate 
} from "./services/admin.service";
import { signToken } from "./jwt";

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    login: publicProcedure
      .input(z.object({ email: z.string().trim().toLowerCase().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const admin = getAdminByEmail(input.email);
        if (!admin || !admin.password) {
          throw new Error("Credenciales inválidas");
        }
        
        const hashed = hashPassword(input.password);
        if (hashed !== admin.password) {
          throw new Error("Credenciales inválidas");
        }

        const token = await signToken({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'admin'
        });

        // Set cookie
        ctx.res.cookie(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24h
        });

        return { success: true };
      }),

    register: publicProcedure
      .input(z.object({ name: z.string().trim(), email: z.string().trim().toLowerCase().email(), password: z.string().min(6) }))
      .mutation(async ({ input, ctx }) => {
        // En un caso real, validaríamos que solo se pueda registrar si no hay admins o usando un invite code.
        // Aquí permitiremos el registro del primer admin libremente por simplicidad inicial.
        try {
          const hashed = hashPassword(input.password);
          createAdmin(input.name, input.email, hashed);
          return { success: true };
        } catch (error: any) {
          if (error.message && error.message.includes('UNIQUE')) {
            throw new Error("El email ya está registrado");
          }
          throw error;
        }
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        maxAge: -1,
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        path: '/',
      });
      return { success: true };
    }),
  }),

  admin: router({
    // Procedimientos protegidos para gestión de sectores
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

    // Procedimientos protegidos para gestión de personal
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
      .input(z.object({ legajo: z.string(), nombre: z.string(), sector: z.string(), cargo_id: z.number(), es_rotativo: z.number().default(0) }))
      .mutation(({ input }) => {
        insertPersonal(input.legajo, input.nombre, input.sector, input.cargo_id, input.es_rotativo);
        return { success: true };
      }),

    editPerson: adminProcedure
      .input(z.object({ legajo: z.string(), nombre: z.string(), sector: z.string(), activo: z.number(), cargo_id: z.number().nullable().optional(), es_rotativo: z.number().default(0) }))
      .mutation(({ input }) => {
        updatePersonal(input.legajo, input.nombre, input.sector, input.activo, input.cargo_id || 1, input.es_rotativo);
        return { success: true };
      }),

    removePerson: adminProcedure
      .input(z.object({ legajo: z.string() }))
      .mutation(({ input }) => {
        deletePersonal(input.legajo);
        return { success: true };
      }),

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

    getPlanificable: adminProcedure
      .input(z.object({ sector: z.string(), fecha_inicio: z.string(), fecha_fin: z.string() }))
      .query(({ input }) => {
        return getPersonalPlanificable(input.sector, input.fecha_inicio, input.fecha_fin);
      }),

    savePlanificacion: adminProcedure
      .input(z.object({
        asignaciones: z.array(z.object({
          legajo: z.string(),
          id_turno: z.number(),
          fecha_inicio: z.string(),
          fecha_fin: z.string()
        }))
      }))
      .mutation(({ input }) => {
        savePlanificacionMasiva(input.asignaciones);
        return { success: true };
      }),

    getTurnosHorarios: adminProcedure.query(() => {
      return getTurnosHorarios();
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
          return { success: true };
        } catch (e: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
        }
      }),
    
    addHorario: adminProcedure
      .input(z.object({
        id_sector: z.number().nullable(),
        id_cargo: z.number().nullable(),
        legajo: z.string().nullable(),
        id_turno: z.number(),
        dias: z.array(z.number()),
        hora_entrada: z.string(),
        hora_salida: z.string()
      }))
      .mutation(({ input, ctx }) => {
        try {
          addHorario(
            input.id_sector, 
            input.id_cargo, 
            input.legajo, 
            input.id_turno, 
            input.dias, 
            input.hora_entrada, 
            input.hora_salida,
            ctx.user?.name || 'Administrador'
          );
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
          return { success: true };
        } catch (e: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
        }
      }),

    updateHorario: adminProcedure
      .input(z.object({
        id_horario: z.number(),
        hora_entrada: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"),
        hora_salida: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)")
      }))
      .mutation(({ input, ctx }) => {
        try {
          updateHorario(input.id_horario, input.hora_entrada, input.hora_salida, ctx.user?.name || 'Administrador');
          return { success: true };
        } catch (e: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
        }
      }),

    batchUpdateHorarios: adminProcedure
      .input(z.object({
        id_horarios: z.array(z.number()),
        hora_entrada: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"),
        hora_salida: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)")
      }))
      .mutation(({ input, ctx }) => {
        try {
          batchUpdateHorarios(input.id_horarios, input.hora_entrada, input.hora_salida, ctx.user?.name || 'Administrador');
          return { success: true };
        } catch (e: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
        }
      }),
  }),

  attendance: router({
    getSectors: publicProcedure.query(() => {
      return getSectors();
    }),

    getByDate: publicProcedure
      .input(
        z.object({
          date: z.string().refine(isValidDate, "Fecha inválida. Use formato YYYY-MM-DD"),
          sector: z.string().optional(),
          toleranciaMinutos: z.number().optional().default(0),
        })
      )
      .query(({ input }) => {
        const presentes = getPresentesByDate(input.date, input.sector, input.toleranciaMinutos);
        const ausentes = getAusentesByDate(input.date, input.sector);
        const summary = getAttendanceSummary(input.date);

        return {
          presentes,
          ausentes,
          summary,
          date: input.date,
          sector: input.sector || "todos",
        };
      }),

    getSummary: publicProcedure
      .input(
        z.object({
          date: z.string().refine(isValidDate, "Fecha inválida. Use formato YYYY-MM-DD"),
          sector: z.string().optional(),
          toleranciaMinutos: z.number().optional().default(0),
        })
      )
      .query(({ input }) => {
        return getAttendanceSummary(input.date);
      }),

    getTodayDate: publicProcedure.query(() => {
      return { date: getTodayDate() };
    }),
  }),
});

export type AppRouter = typeof appRouter;
