import { calcularInconsistenciasPorFecha } from '../server/services/inconsistencias.service.js';
import { getTodayDate } from '../server/services/admin.service.js';

async function main() {
  const today = getTodayDate();
  
  // Calcular para hoy
  console.log(`[Motor] Calculando inconsistencias para hoy: ${today}`);
  calcularInconsistenciasPorFecha(today);

  // Calcular para ayer (por si quedaron fichadas nocturnas pendientes)
  const yesterdayDate = new Date(Date.now() - 86400000);
  const yesterday = yesterdayDate.toISOString().split('T')[0];
  console.log(`[Motor] Calculando inconsistencias para ayer: ${yesterday}`);
  calcularInconsistenciasPorFecha(yesterday);

  console.log('[Motor] ¡Cálculo de inconsistencias finalizado exitosamente!');
  process.exit(0);
}

main().catch(err => {
  console.error('[Motor] Error calculando inconsistencias:', err);
  process.exit(1);
});
