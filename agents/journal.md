# Journal del Proyecto: Asistencia Personal

Este archivo es un bitácora para documentar todos los avances, diagnósticos, soluciones implementadas y aprendizajes adquiridos durante la fase de corrección de la aplicación.

## Entradas

### [2026-06-09] - Fase de Inicialización y Setup
- **Avance:** Se generó la carpeta `agents`. Se guardó el perfil del agente especializado en debugging y se inicializó este journal.
- **Observaciones del Sistema:** Se realizó una lectura inicial del `README.md`. La arquitectura consta de un dashboard React 19 en el frontend interactuando vía tRPC con un backend Node.js y base de datos SQLite (`data2.db`).
- **Próximos Pasos:**
  1. Identificar los errores específicos que la aplicación presenta actualmente.
  2. Levantar el entorno de desarrollo y verificar logs en consola y terminal.
  3. Ejecutar los scripts de test (`pnpm test` / `pnpm check`) para buscar errores de tipado o lógica.

### [2026-06-09] - Resolución de Problemas en el Entorno Local (Windows)
- **Avance:** Se logró levantar el servidor localmente en Windows usando pnpm v10.
- **Problemas resueltos:**
  1. **Conflicto de parches:** pnpm fallaba al instalar `wouter` debido a que la versión requerida por el parche (3.7.1) no coincidía con el caret en `package.json` (`^3.3.5`). Se forzó a la versión exacta `3.7.1`.
  2. **Scripts de post-instalación ignorados:** En pnpm v10 los scripts de compilación nativos (`esbuild`, `better-sqlite3`) se bloquean por seguridad. Se agregó `"onlyBuiltDependencies": ["better-sqlite3", "esbuild"]` al `package.json` y se corrió `pnpm rebuild`.
  3. **Variables de entorno en Windows:** El uso de `NODE_ENV=development` crasheaba en CMD. Se instaló `cross-env` y se actualizaron los scripts `dev` y `start`.
  4. **Terminación abrupta en Batch:** El script `dev-windows.bat` se cerraba solo por ejecutar `pnpm --version` sin el prefijo `call`, comportamiento nativo de Windows al ejecutar `.cmd`. Se agregó el `call`.
  5. **Silencio inicial de Vite:** Se identificó que al arrancar `tsx watch` y Vite, el log de `[Attendance Dashboard] Server running...` tarda unos ~15 segundos en aparecer y a veces Windows retiene el buffer, dando la falsa impresión de que el programa "no levanta".

### [2026-06-09] - Renovación del Master Implementation Plan
- **Avance:** Se reseteó y sobreescribió el archivo `master_implementation_plan.md` a la versión 2.0.
- **Detalle:** Al haber estabilizado el entorno y completado el backlog original, se definió una nueva hoja de ruta centrada en la estabilización de OAuth, generación de reportes (PDF/Excel), Notificaciones Web Push y configuración final para producción.

### [2026-06-09] - Implementación de Panel de Control y Auth Local (Fase 1 Completada)
- **Avance:** Se descartó el modelo OAuth genérico en favor de un sistema de JWT local y se creó un Panel de Administración cerrado.
- **Detalle Arquitectónico:**
  1. Se verificó (leyendo los scripts Python `ImportarFichadas.py`, etc.) que el reloj biométrico solo alimenta la tabla `fichadas`. Las tablas `personal` y `sectores` son seguras para administrar desde la web.
  2. Se configuró una tabla `admins` en SQLite y un flujo de JWT (`jose`) con cookies seguras (`httpOnly`).
  3. Se diseñaron las rutas `/login` y `/admin` calcando la estética *Premium* solicitada, creando una bifurcación clara: la ruta raíz `/` es el monitor público "solo lectura" para los empleados, y `/login` es la puerta exclusiva para Recursos Humanos.

### [2026-06-09] - Fase 8: Lógica Avanzada de Turnos y Cargos
- **Avance:** Se implementó una lógica de negocio compleja para soportar turnos rotativos, cargos con distinto nivel de criticidad y control de llegadas tarde.
- **Detalle Arquitectónico:**
  1. Se crearon las tablas `cargos`, `turnos_horarios`, `horarios` e `historial_turnos` para mapear de manera precisa a qué hora debe ingresar un empleado según su sector, cargo, día de la semana y turno histórico.
  2. Se modificaron las consultas en el backend (`server/attendance.ts`) para realizar cruces de información y calcular al vuelo la variable `llegadaTarde`.
  3. Se actualizó el Dashboard visualmente bajo las directrices del Agente UX: los encargados tienen el prefijo `(E)` y se pueden ocultar con un switch. Aquellos con rol crítico que faltan tiñen de rojo la tabla de ausentes con un badge de "Cargo Crítico". Los presentes con retraso reciben un badge naranja de "Llegó Tarde".

### [2026-06-09] - Resolución de Bug de Zona Horaria (Timezones)
- **Problema:** El selector de fechas del Dashboard (`SelectorFecha.tsx`) parecía "trabarse" y no dejaba avanzar a la fecha actual (ej. 9/6/2026), mostrando erróneamente el día anterior (8/6/2026).
- **Diagnóstico:** Se descubrió que al usar `new Date("YYYY-MM-DD")` en JavaScript, el motor asume automáticamente que la hora es `00:00:00 UTC`. Al aplicar la zona horaria local de Argentina (GMT-3), el horario retrocedía 3 horas, cayendo en las `21:00:00` del día anterior. Esto causaba un desajuste visual (el render mostraba el día 8) y un desajuste lógico (la validación creía que la variable ya estaba en el día 9).
- **Solución:** Se reemplazó el parseo de string directo por la construcción explícita `new Date(year, month - 1, day)`, la cual instruye al motor de JS a utilizar el huso horario local desde el momento de la instanciación de la fecha.

### [2026-06-09] - Consolidación de Matriz de Turnos y UX "Tree Schema"
- **Avance:** Se simplificó radicalmente la base de datos eliminando tablas obsoletas heredadas del diseño viejo (`horario_franja`, `horario_excepcion`) para converger en una Súper-Tabla única (`horarios`) de formato "Matriz".
- **Detalle Arquitectónico y UX:**
  1. Se implementó un algoritmo robusto en el backend (Node.js) que evalúa las prioridades de los turnos en memoria. Las "Excepciones por Persona" siempre pisan y sobreescriben a las "Reglas Generales de Sector+Cargo".
  2. Bajo directriz del Agente UX, se rediseñó la "Matriz Actual" en el Panel de Administración. Se abandonó el modelo de tabla plana en favor de un formato "Tree Schema / Crumble" que agrupa visualmente las reglas en ramas colapsables (`Turno > Sector > Cargo > Franjas Horarias`), reduciendo la carga cognitiva.
  3. Se instauró una nueva norma de diseño obligatoria: "Tablas Interactivas". A partir de ahora, todo grid de datos incorpora automáticamente buscadores en tiempo real (barras de texto) y ordenamiento interactivo (flechas up/down) en sus cabeceras.
  4. El Agente QA desarrolló en paralelo pruebas unitarias usando `vitest` que blindan el cálculo de prioridades matemáticas y las validaciones de llegadas tardes, mockeando la base de datos `better-sqlite3`. Se solucionaron problemas de tipado agregando `@testing-library/jest-dom`.
