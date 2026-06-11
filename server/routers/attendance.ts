import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { 
  getFichadasByDate, getPresentesByDate, getAusentesByDate, getAttendanceSummary 
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
});
