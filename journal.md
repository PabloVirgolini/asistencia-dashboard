# Journal - AsistenciaPersonal QA & Testing

## 2026-06-09 - QA Agent: Pruebas Unitarias para Refactorización de Turnos
Se ha realizado una validación y creación de arneses de pruebas para la reciente refactorización de turnos y reglas de horarios.

### Decisiones de Testing Implementadas:
1. **Aislamiento de Base de Datos (`server/attendance.rules.test.ts`)**:
   - Dado que la base de datos es SQLite (`data2.db`), se decidió evitar la polución de datos de producción durante las pruebas mediante el mockeo del módulo `better-sqlite3`. 
   - Se crearon tests aislados para las funciones de backend (`getTurnosHorarios`, `addTurnoHorario`, `getHorariosReglas`, `addHorario`, etc.) garantizando que las queries de inserción y las transacciones funcionen correctamente.
   - **Evaluación de Prioridades**: Se crearon test cases específicos para validar que la lógica de prioridades dentro de `getPresentesByDate` funciona correctamente. Se validaron 3 casos clave:
     - Regla general asumiendo llegada tardía (cuando aplica por sector y cargo).
     - Regla general marcando a tiempo.
     - **Excepción por legajo** anulando exitosamente la regla general correspondiente.

2. **Setup de Vitest Frontend**:
   - Se adaptó `vitest.config.ts` para incluir las pruebas del directorio `client/`.
   - Se instalaron las dependencias esenciales de React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `jsdom`) para posibilitar el renderizado en entorno de pruebas del DOM.

3. **Pruebas de Componentes UI (`client/src/components/AdminTurnos.test.tsx`)**:
   - Se agregó cobertura para el nuevo componente de reglas de turno (`AdminTurnos.tsx`).
   - Se implementó un mock a nivel de módulo del cliente `trpc.useContext()` y `useQuery`/`useMutation` para simular cargas y estados sin requerir conectividad de red ni un backend en ejecución.
   - Se validaron el renderizado correcto de las matrices y las interacciones de creación de turnos desde el cliente.

*Nota: Todas las pruebas pueden correrse con `pnpm test`. Se sugiere que futuros desarrollos continúen usando la aproximación de mock de tRPC para frontend y mocking de `better-sqlite3` para las validaciones estrictas de dominio sin dañar `data2.db`.*

## 2026-06-09 - Ampliación de Tests y Seguridad en Base de Datos
Se identificaron brechas lógicas en la base de datos para la configuración de Reglas de Horarios, que se cubrieron con validaciones en cascada y transacciones seguras:
1. **Anti-Duplicación de Etiquetas**: Bloqueo case-insensitive para prevenir creación de Turnos ("Turno Noche" vs "turno noche") duplicados.
2. **Validación de Integridad Relacional**: Bloqueo al intentar eliminar etiquetas usadas por una Regla, o eliminar reglas si existen Empleados activos asociados (sea como Excepción o bajo Cargo/Sector).
3. **Anti-Solapamiento Transaccional**: El servidor rechaza solapamientos exactos de día, turno y perfil.

**Cobertura Total**: El ingeniero de QA expandió exitosamente la suite a **16 pruebas unitarias exhaustivas** en `server/attendance.rules.test.ts`. Asimismo, se fixearon pruebas adyacentes (`AdminTurnos.test.tsx` y `auth.logout.test.ts`) para garantizar que la suite global (`pnpm test`) esté al **100% pasando (30 tests)**.
