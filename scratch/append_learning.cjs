const fs = require('fs');

const entry = `
### 12-06-2026: Soporte Nativo para Enroques y Desincronización de Caché en Inconsistencias
- **Problema 1:** Era necesario soportar "Enroques" (ej. dos personas intercambian su turno por un día). El diseño de la base de datos (\`historial_turnos\`) lo permitía nativamente por sus campos \`fecha_inicio\` y \`fecha_fin\`.
- **Solución 1:** Se agregó la consulta SQL \`ORDER BY (julianday(COALESCE(fecha_fin, '2099-12-31')) - julianday(fecha_inicio)) DESC\` al extraer los turnos. Esto prioriza el rango de fechas más corto. Si hay un plan de 7 días y uno de 1 día superpuestos, gana siempre el más corto (Excepción/Enroque).
- **Problema 2:** Después de cargar el plan, la interfaz ponía al usuario en el Turno correcto ("Turno Tarde"), pero la etiqueta decía "Ausencia". 
- **Solución 2:** Esto se debió a **Stale Data**. La interfaz agrupaba los turnos al vuelo (\`asistencia.service.ts\`), pero leía los badges desde la tabla precalculada \`inconsistencias_calculadas\`, la cual se había calculado *antes* del enroque. Se corrigió haciendo que \`savePlanificacionMasiva\` dispare en background \`calculate-inconsistencias.ts\` forzando un recálculo inmediato para limpiar datos obsoletos.
`;

fs.appendFileSync('.agent/agents/journal.md', entry);
console.log('Journal updated.');
