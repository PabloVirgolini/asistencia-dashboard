const fs = require('fs');
const content = `
### [2026-06-12] - Motor de Inconsistencias Independiente
- **Decisión Arquitectónica:** Se implementó el 'Motor de Inconsistencias' como un servicio en segundo plano que se alimenta de la inmutabilidad de la tabla \`fichadas\`. Los cálculos (llegadas tarde, salidas anticipadas, faltas) se depositan en el modelo de lectura \`inconsistencias_calculadas\`.
- **Beneficio Operativo:** Esto evita recálculos masivos de turnos nocturnos y rotativos en cada render del Dashboard, manteniendo la UI extremadamente rápida y habilitando futuros flujos para "justificar/revisar" inconsistencias sin alterar el dato crudo.
`;
fs.appendFileSync('.agent/agents/journal.md', content);
