import { router } from "../_core/trpc";
import { sectoresProcedures } from "./admin/sectores";
import { personalProcedures } from "./admin/personal";
import { novedadesProcedures } from "./admin/novedades";
import { planificadorProcedures } from "./admin/planificador";
import { horariosProcedures } from "./admin/horarios";

export const adminRouter = router({
  ...sectoresProcedures,
  ...personalProcedures,
  ...novedadesProcedures,
  ...planificadorProcedures,
  ...horariosProcedures,
});
