const fs = require('fs');
const content = `
### [2026-06-12] - Cruces de Medianoche y Datos Cacheados (Read Models)
- **Cruce de Frontera de Medianoche**: Se implementó la utilidad \`getVentanaTurno\` para reemplazar la evaluación de fichadas bajo un "Día Calendario". Ahora, los turnos nocturnos "absorben" las fichadas de la mañana siguiente (ampliando la ventana hasta 16 horas posteriores al inicio del turno), evitando que estas fichadas se marquen erróneamente como "Esperados" o "Fichadas Inesperadas" en el día libre del empleado.
- **Datos Cacheados (Stale Data) en Read Models**: Se descubrió un defecto en la metodología de pruebas de inconsistencias. Como el Dashboard no calcula las inconsistencias al vuelo, sino que las lee de la tabla \`inconsistencias_calculadas\`, corregir la lógica en \`inconsistencias.service.ts\` no tiene impacto visual inmediato. **Aprendizaje:** Toda modificación a motores de cálculo asíncronos REQUIERE obligatoriamente ejecutar sus respectivos scripts de recálculo (ej. \`npm run calculate-inconsistencies\` o \`npx tsx scripts/calculate-inconsistencies.ts\`) para refrescar la caché en la BD, antes de validar visualmente los resultados en la interfaz.
`;
fs.appendFileSync('.agent/agents/journal.md', content);
