const fs = require('fs');
const content = `
### [2026-06-12] - Configuraciones y Novedades Compartidas
- **Avance Arquitectónico:** Se migró la configuración estática a un archivo central \`server/config.ts\` y variables UI al \`constants.ts\` del frontend para evitar "números mágicos" hardcodeados en los servicios y hooks.
- **Avance Funcional (Fase 2):** Se añadió la opción de "Compartir en Dashboard" en el administrador de novedades. Ahora las licencias públicas se pueden visualizar en una tabla de sólo lectura al pie del Dashboard Público sin exponer información sensible o controles administrativos.
`;
fs.appendFileSync('.agent/agents/journal.md', content);
