import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { 
  getFichadasByDate, getAttendanceGroupedByTurno 
} from "../services/asistencia.service";
import { getSectors } from "../services/personal.service";
import { isValidDate, getTodayDate } from "../services/admin.service";

export const attendanceRouter = router({
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
      const result = getAttendanceGroupedByTurno(input.date, input.sector, input.toleranciaMinutos);

      return {
        grupos: result.grupos,
        summary: result.summary,
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
      const result = getAttendanceGroupedByTurno(input.date, input.sector, input.toleranciaMinutos);
      return result.summary;
    }),

  getTodayDate: publicProcedure.query(() => {
    return { date: getTodayDate() };
  }),
});
