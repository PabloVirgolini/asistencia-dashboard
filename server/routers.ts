import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as crypto from 'crypto';
import {
  getSectors,
  getPresentesByDate,
  getAusentesByDate,
  getAttendanceSummary,
  isValidDate,
  getTodayDate,
  createAdmin,
  getAdminByEmail,
  insertSector,
  deleteSector,
  insertPersonal,
  updatePersonal,
  deletePersonal,
  getActivePersonal,
  getCargos,
  getTurnosHorarios,
  addTurnoHorario,
  removeTurnoHorario,
  getHorariosReglas,
  addHorario,
  removeHorario
} from "./attendance";
import { signToken } from "./jwt";

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
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
        ctx.res.cookie('session_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24h
        });

        return { success: true };
      }),

    register: publicProcedure
      .input(z.object({ name: z.string(), email: z.string().email(), password: z.string().min(6) }))
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
      ctx.res.clearCookie('session_token');
      return { success: true };
    }),
  }),

  admin: router({
    // Procedimientos protegidos para gestión de sectores
    addSector: adminProcedure
      .input(z.object({ idSector: z.number(), descripcion: z.string() }))
      .mutation(({ input }) => {
        insertSector(input.idSector, input.descripcion);
        return { success: true };
      }),
      
    removeSector: adminProcedure
      .input(z.object({ idSector: z.number() }))
      .mutation(({ input }) => {
        deleteSector(input.idSector);
        return { success: true };
      }),

    // Procedimientos protegidos para gestión de personal
    getPersonal: adminProcedure.query(() => {
        return getActivePersonal();
    }),

    getCargos: adminProcedure.query(() => {
        return getCargos();
    }),

    addPerson: adminProcedure
      .input(z.object({ legajo: z.string(), nombre: z.string(), sector: z.string() }))
      .mutation(({ input }) => {
        insertPersonal(input.legajo, input.nombre, input.sector);
        return { success: true };
      }),

    editPerson: adminProcedure
      .input(z.object({ legajo: z.string(), nombre: z.string(), sector: z.string(), activo: z.number(), cargo_id: z.number().nullable().optional() }))
      .mutation(({ input }) => {
        updatePersonal(input.legajo, input.nombre, input.sector, input.activo, input.cargo_id || 1);
        return { success: true };
      }),

    removePerson: adminProcedure
      .input(z.object({ legajo: z.string() }))
      .mutation(({ input }) => {
        deletePersonal(input.legajo);
        return { success: true };
      }),

    getTurnosHorarios: adminProcedure.query(() => {
      return getTurnosHorarios();
    }),
    
    addTurnoHorario: adminProcedure
      .input(z.object({ descripcion: z.string().min(1) }))
      .mutation(({ input }) => {
        addTurnoHorario(input.descripcion);
        return { success: true };
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
      .mutation(({ input }) => {
        addHorario(
          input.id_sector, 
          input.id_cargo, 
          input.legajo, 
          input.id_turno, 
          input.dias, 
          input.hora_entrada, 
          input.hora_salida
        );
        return { success: true };
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
        })
      )
      .query(({ input }) => {
        const presentes = getPresentesByDate(input.date, input.sector);
        const ausentes = getAusentesByDate(input.date, input.sector);
        const summary = getAttendanceSummary(input.date, input.sector);

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
        })
      )
      .query(({ input }) => {
        return getAttendanceSummary(input.date, input.sector);
      }),

    getTodayDate: publicProcedure.query(() => {
      return { date: getTodayDate() };
    }),
  }),
});

export type AppRouter = typeof appRouter;
