import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";
import { attendanceRouter } from "./routers/attendance";

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
  attendance: attendanceRouter,
});

export type AppRouter = typeof appRouter;
