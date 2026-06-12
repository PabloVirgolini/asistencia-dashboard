const fs = require('fs');

const entry = `
### 3.8. Soporte Nativo para Enroques (Solapamiento y Prioridad)
- **Decisión:** Soportar "Enroques" o excepciones de 1 día permitiendo intencionalmente el solapamiento de registros en la tabla \`historial_turnos\`. La resolución de qué turno aplica para un día determinado se delega puramente al motor de base de datos usando el criterio del "rango más corto gana" mediante \`ORDER BY (julianday(COALESCE(fecha_fin, '2099-12-31')) - julianday(fecha_inicio)) DESC\`.
- **Motivación:** Evita tener que dividir o fragmentar un plan de "Toda la semana" en múltiples registros (Ej. Lunes-Martes, Jueves-Viernes) solo porque el Miércoles hay una excepción. Facilita enormemente la UI y mantiene la base de datos atómica.
- **Consecuencia de Diseño (Stale Data Cache):** Debido a que la vista (UI) y las insignias de inconsistencia provienen de motores separados, una reasignación de enroque debe estar obligatoriamente acoplada a una **invalidación de caché (Recálculo)** inmediata en segundo plano para evitar desincronizaciones visuales.
`;

fs.appendFileSync('.agent/ADR.md', entry);
console.log('ADR updated.');
