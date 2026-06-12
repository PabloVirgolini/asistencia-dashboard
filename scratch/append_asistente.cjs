const fs = require('fs');

const entry = `
- **Quirk de Stale Data en Inconsistencias**: Si la interfaz muestra correctamente a un empleado en un sector/turno pero tiene una etiqueta errónea ("Ausencia"), esto se debe a que la etiqueta proviene de la tabla \`inconsistencias_calculadas\` que no se ha refrescado. El UI es dinámico pero las alertas son cacheadas. Si haces cambios en los planes (\`historial_turnos\`), asegúrate siempre de disparar o reciclar el Motor de Inconsistencias (ej. \`npx tsx scripts/calculate-inconsistencias.ts\`) para limpiar el stale data y que la interfaz sea coherente.
`;

fs.appendFileSync('.agent/agents/agente_asistente.md', entry);
console.log('Asistente updated.');
