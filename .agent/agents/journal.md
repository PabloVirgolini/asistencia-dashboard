# Journal del Proyecto: Asistencia Personal

Este archivo es un bitÃ¡cora para documentar todos los avances, diagnÃ³sticos, soluciones implementadas y aprendizajes adquiridos durante la fase de correcciÃ³n de la aplicaciÃ³n.

## Entradas

### [2026-06-09] - Fase de InicializaciÃ³n y Setup
- **Avance:** Se generÃ³ la carpeta `agents`. Se guardÃ³ el perfil del agente especializado en debugging y se inicializÃ³ este journal.
- **Observaciones del Sistema:** Se realizÃ³ una lectura inicial del `README.md`. La arquitectura consta de un dashboard React 19 en el frontend interactuando vÃ­a tRPC con un backend Node.js y base de datos SQLite (`data2.db`).
- **PrÃ³ximos Pasos:**
  1. Identificar los errores especÃ­ficos que la aplicaciÃ³n presenta actualmente.
  2. Levantar el entorno de desarrollo y verificar logs en consola y terminal.
  3. Ejecutar los scripts de test (`pnpm test` / `pnpm check`) para buscar errores de tipado o lÃ³gica.

### [2026-06-09] - ResoluciÃ³n de Problemas en el Entorno Local (Windows)
- **Avance:** Se logrÃ³ levantar el servidor localmente en Windows usando pnpm v10.
- **Problemas resueltos:**
  1. **Conflicto de parches:** pnpm fallaba al instalar `wouter` debido a que la versiÃ³n requerida por el parche (3.7.1) no coincidÃ­a con el caret en `package.json` (`^3.3.5`). Se forzÃ³ a la versiÃ³n exacta `3.7.1`.
  2. **Scripts de post-instalaciÃ³n ignorados:** En pnpm v10 los scripts de compilaciÃ³n nativos (`esbuild`, `better-sqlite3`) se bloquean por seguridad. Se agregÃ³ `"onlyBuiltDependencies": ["better-sqlite3", "esbuild"]` al `package.json` y se corriÃ³ `pnpm rebuild`.
  3. **Variables de entorno en Windows:** El uso de `NODE_ENV=development` crasheaba en CMD. Se instalÃ³ `cross-env` y se actualizaron los scripts `dev` y `start`.
  4. **TerminaciÃ³n abrupta en Batch:** El script `dev-windows.bat` se cerraba solo por ejecutar `pnpm --version` sin el prefijo `call`, comportamiento nativo de Windows al ejecutar `.cmd`. Se agregÃ³ el `call`.
  5. **Silencio inicial de Vite:** Se identificÃ³ que al arrancar `tsx watch` y Vite, el log de `[Attendance Dashboard] Server running...` tarda unos ~15 segundos en aparecer y a veces Windows retiene el buffer, dando la falsa impresiÃ³n de que el programa "no levanta".

### [2026-06-09] - RenovaciÃ³n del Master Implementation Plan
- **Avance:** Se reseteÃ³ y sobreescribiÃ³ el archivo `master_implementation_plan.md` a la versiÃ³n 2.0.
- **Detalle:** Al haber estabilizado el entorno y completado el backlog original, se definiÃ³ una nueva hoja de ruta centrada en la estabilizaciÃ³n de OAuth, generaciÃ³n de reportes (PDF/Excel), Notificaciones Web Push y configuraciÃ³n final para producciÃ³n.

### [2026-06-09] - ImplementaciÃ³n de Panel de Control y Auth Local (Fase 1 Completada)
- **Avance:** Se descartÃ³ el modelo OAuth genÃ©rico en favor de un sistema de JWT local y se creÃ³ un Panel de AdministraciÃ³n cerrado.
- **Detalle ArquitectÃ³nico:**
  1. Se verificÃ³ (leyendo los scripts Python `ImportarFichadas.py`, etc.) que el reloj biomÃ©trico solo alimenta la tabla `fichadas`. Las tablas `personal` y `sectores` son seguras para administrar desde la web.
  2. Se configurÃ³ una tabla `admins` en SQLite y un flujo de JWT (`jose`) con cookies seguras (`httpOnly`).
  3. Se diseÃ±aron las rutas `/login` y `/admin` calcando la estÃ©tica *Premium* solicitada, creando una bifurcaciÃ³n clara: la ruta raÃ­z `/` es el monitor pÃºblico "solo lectura" para los empleados, y `/login` es la puerta exclusiva para Recursos Humanos.

### [2026-06-09] - Fase 8: LÃ³gica Avanzada de Turnos y Cargos
- **Avance:** Se implementÃ³ una lÃ³gica de negocio compleja para soportar turnos rotativos, cargos con distinto nivel de criticidad y control de llegadas tarde.
- **Detalle ArquitectÃ³nico:**
  1. Se crearon las tablas `cargos`, `turnos_horarios`, `horarios` e `historial_turnos` para mapear de manera precisa a quÃ© hora debe ingresar un empleado segÃºn su sector, cargo, dÃ­a de la semana y turno histÃ³rico.
  2. Se modificaron las consultas en el backend (`server/attendance.ts`) para realizar cruces de informaciÃ³n y calcular al vuelo la variable `llegadaTarde`.
  3. Se actualizÃ³ el Dashboard visualmente bajo las directrices del Agente UX: los encargados tienen el prefijo `(E)` y se pueden ocultar con un switch. Aquellos con rol crÃ­tico que faltan tiÃ±en de rojo la tabla de ausentes con un badge de "Cargo CrÃ­tico". Los presentes con retraso reciben un badge naranja de "LlegÃ³ Tarde".

### [2026-06-09] - ResoluciÃ³n de Bug de Zona Horaria (Timezones)
- **Problema:** El selector de fechas del Dashboard (`SelectorFecha.tsx`) parecÃ­a "trabarse" y no dejaba avanzar a la fecha actual (ej. 9/6/2026), mostrando errÃ³neamente el dÃ­a anterior (8/6/2026).
- **DiagnÃ³stico:** Se descubriÃ³ que al usar `new Date("YYYY-MM-DD")` en JavaScript, el motor asume automÃ¡ticamente que la hora es `00:00:00 UTC`. Al aplicar la zona horaria local de Argentina (GMT-3), el horario retrocedÃ­a 3 horas, cayendo en las `21:00:00` del dÃ­a anterior. Esto causaba un desajuste visual (el render mostraba el dÃ­a 8) y un desajuste lÃ³gico (la validaciÃ³n creÃ­a que la variable ya estaba en el dÃ­a 9).
- **SoluciÃ³n:** Se reemplazÃ³ el parseo de string directo por la construcciÃ³n explÃ­cita `new Date(year, month - 1, day)`, la cual instruye al motor de JS a utilizar el huso horario local desde el momento de la instanciaciÃ³n de la fecha.

### [2026-06-09] - ConsolidaciÃ³n de Matriz de Turnos y UX "Tree Schema"
- **Avance:** Se simplificÃ³ radicalmente la base de datos eliminando tablas obsoletas heredadas del diseÃ±o viejo (`horario_franja`, `horario_excepcion`) para converger en una SÃºper-Tabla Ãºnica (`horarios`) de formato "Matriz".
- **Detalle ArquitectÃ³nico y UX:**
  1. Se implementÃ³ un algoritmo robusto en el backend (Node.js) que evalÃºa las prioridades de los turnos en memoria. Las "Excepciones por Persona" siempre pisan y sobreescriben a las "Reglas Generales de Sector+Cargo".
  2. Bajo directriz del Agente UX, se rediseÃ±Ã³ la "Matriz Actual" en el Panel de AdministraciÃ³n. Se abandonÃ³ el modelo de tabla plana en favor de un formato "Tree Schema / Crumble" que agrupa visualmente las reglas en ramas colapsables (`Turno > Sector > Cargo > Franjas Horarias`), reduciendo la carga cognitiva.
  3. Se instaurÃ³ una nueva norma de diseÃ±o obligatoria: "Tablas Interactivas". A partir de ahora, todo grid de datos incorpora automÃ¡ticamente buscadores en tiempo real (barras de texto) y ordenamiento interactivo (flechas up/down) en sus cabeceras.
  4. El Agente QA desarrollÃ³ en paralelo pruebas unitarias usando `vitest` que blindan el cÃ¡lculo de prioridades matemÃ¡ticas y las validaciones de llegadas tardes, mockeando la base de datos `better-sqlite3`. Se solucionaron problemas de tipado agregando `@testing-library/jest-dom`.

### [2026-06-10] - Fase 9: PersonalizaciÃ³n DinÃ¡mica de Sectores y Cargos
- **Avance:** Se completÃ³ el rediseÃ±o de la arquitectura de la relaciÃ³n Sector-Cargo. Se implementÃ³ una tabla intermedia `sectores_cargos` que permite definir quÃ© cargos existen en quÃ© sector y su nivel de criticidad independiente.
- **Detalle ArquitectÃ³nico y UX:**
  1. Se agregÃ³ la posibilidad de editar (inline) el nombre de los sectores directamente desde el Admin Panel (`AdminPanel.tsx`).
  2. Se creÃ³ un Modal de ConfiguraciÃ³n interactivo para cada Sector donde los administradores habilitan/deshabilitan los cargos (usando un listado global) y les asignan un valor de criticidad del 1 al 5.
  3. Se interconectÃ³ esta nueva fuente de verdad con el Creador de Reglas (`AdminTurnos.tsx`): Al seleccionar un Sector, el combo de Cargos disponibles se filtra dinÃ¡micamente limitÃ¡ndose Ãºnicamente a los habilitados por la administraciÃ³n en dicho sector.
  4. La suite de pruebas de QA se blindÃ³ agregando protecciÃ³n transaccional para evitar desactivar un cargo en un sector si ya hay empleados usÃ¡ndolo o reglas asociadas a Ã©l, logrando mantener una cobertura del 100% de la suite.

### [2026-06-10] - Fase 8: Hito de Completitud (GestiÃ³n de Cargos y Tolerancia Interactiva)
- **Avance:** Se completaron los componentes pendientes de la Fase 8, aÃ±adiendo la capacidad de administrar los Cargos globalmente y hacer dinÃ¡mica la visualizaciÃ³n de llegadas tarde.
- **Detalle ArquitectÃ³nico y UX:**
  1. **CRUD Central de Cargos:** Se aÃ±adiÃ³ una nueva pestaÃ±a "Cargos" en el Panel de Administrador, permitiendo gestionar los cargos sin necesidad de scripts de base de datos directos, implementando validaciones estrictas de borrado (no se puede borrar si ya estÃ¡ configurado en un sector, personal u horario).
  2. **Criticidad Desacoplada:** Se validÃ³ junto al usuario que el "Nivel de Criticidad" pertenece Ãºnicamente a la relaciÃ³n Sector-Cargo, por lo que el cargo base se mantiene simple.
  3. **UX Simulable (Tolerancia DinÃ¡mica):** En vez de hardcodear un "tiempo de gracia" en el backend para la llegada tarde, se implementÃ³ un control interactivo (slider de 0 a 60 minutos) en el Dashboard. El backend (`getPresentesByDate`) recibe este parÃ¡metro al vuelo, permitiendo al usuario visualizar el panorama del dÃ­a y jugar con los minutos de tolerancia de forma bidireccional en tiempo real.

### [2026-06-10] - OptimizaciÃ³n Continua de UX y ReorganizaciÃ³n de Agentes
- **Avance:** Se completÃ³ una serie de mejoras "in-line" para la gestiÃ³n de empleados y asignaciÃ³n de cargos, eliminando bucles y pasos intermedios, reduciendo drÃ¡sticamente la cantidad de clicks.
- **Detalle ArquitectÃ³nico y UX:**
  1. **AsignaciÃ³n RÃ¡pida de Cargos:** En la pestaÃ±a "Sectores", los cargos se movieron a su propia columna. Ahora se muestran como pequeÃ±os recuadros (*badges*) al lado del sector, y permiten ser desvinculados directamente tocando una "X". Se aÃ±adiÃ³ un popover flotante ("+") que lista Ãºnicamente los cargos no asignados, permitiendo vinculaciones con un solo click.
  2. **Formulario Inteligente de EdiciÃ³n:** El modal de ediciÃ³n de empleados fue corregido para que cruce correctamente la string de descripciÃ³n de sector del backend con el ID numÃ©rico que manejan los selectores de shadcn/ui. Esto permite auto-seleccionar por defecto el sector y el cargo actual del empleado, previniendo reseteos accidentales al editar otros campos.
  3. **ActualizaciÃ³n del "Agente UI/UX":** Se actualizÃ³ formalmente el perfil del estilista (`ui_ux_stylist.md`) con la directiva explÃ­cita de "Agilidad Operativa", forzÃ¡ndolo a priorizar componentes que reduzcan pasos para los usuarios.
  4. **CorrecciÃ³n del Optimizador de Tests:** Se restaurÃ³ y oficializÃ³ la instrucciÃ³n del script de Python local `run_tests.py` dentro del perfil de QA para ejecutar compilaciones e integraciones usando escasos tokens.

### [2026-06-10] - ResoluciÃ³n de Bugs CrÃ­ticos en AutenticaciÃ³n
- **Problema 1 (Falsas credenciales invÃ¡lidas):** Los usuarios reciÃ©n creados no podÃ­an ingresar. El motivo era que SQLite almacena los emails en formato case-sensitive y con los espacios originales, lo que causaba desencuentros si se tipeaba distinto al registrarse vs al loguearse.
- **SoluciÃ³n 1:** Se endurecieron los esquemas de Zod en `routers.ts` forzando `z.string().trim().toLowerCase().email()` para limpiar e igualar los inputs en todas las rutas.
- **Problema 2 ("Â¡Bienvenido!" seguido de "Acceso Denegado"):** Al loguearse exitosamente, la web redirigÃ­a al panel y rebotaba inmediatamente hacia el login. 
- **DiagnÃ³stico:** Un error de arquitectura silencioso. La mutaciÃ³n de login guardaba el JWT en una cookie llamada `app_session_id` (a travÃ©s de la constante central `COOKIE_NAME`), pero la funciÃ³n constructora del contexto de TRPC (`createContext` en `server/_core/context.ts`) estaba hardcodeada para leer la cookie `session_token`. Al no encontrarla, la sesiÃ³n figuraba como nula.
- **SoluciÃ³n 2:** Se reemplazÃ³ el texto hardcodeado por la variable de entorno importada `COOKIE_NAME` unificando la lectura y escritura. Estos *quirks* de autenticaciÃ³n fueron documentados en el perfil del agente de debugging.

### [2026-06-10] - ImplementaciÃ³n de Motor de Calendario Semanal (VisualizaciÃ³n y UX)
- **Avance:** Se desarrollÃ³ un "Motor de Calendario" para ofrecer una alternativa visual ultra-compacta a la estructura de Ã¡rbol al momento de administrar las reglas de horarios.
- **Detalle ArquitectÃ³nico y UX:**
  1. **WeeklyCalendar.tsx:** Se creÃ³ un componente encapsulado que dibuja los 7 dÃ­as de la semana y una escala vertical de 24 horas en no mÃ¡s de 380px de altura (sin scroll). Utiliza hashing de strings para auto-colorear las cajas segÃºn el nombre del sector.
  2. **Inteligencia Computacional de Superposiciones:** Los horarios que cruzan la medianoche se particionan automÃ¡ticamente y se extienden al dÃ­a siguiente (manteniendo la integridad). Los solapamientos simultÃ¡neos (ej. dos empleados en guardia en el mismo lugar) no arrojan error, sino que conviven armÃ³nicamente ajustando sus mÃ¡rgenes para mostrarse empalmados.
  3. **Filtros Inteligentes de Contexto:** Se insertÃ³ un Toggle List/Calendar. AdemÃ¡s, en vez de obligar al usuario a usar Ãºnicamente la barra de texto libre, se implementaron listas desplegables Select (`Turno`, `Sector`, `Cargo`). Estas listas son dinÃ¡micas y se retroalimentan del pull de `reglas` activas (solo listan opciones con datos).
  4. **Mejora de UX (Colapsables):** Como peticiÃ³n paralela a la larga "Matriz de Ãrbol", se instalaron botones de `Colapsar todo` que, mediante un uso ingenioso de React `useEffect` en conjunciÃ³n con tokens numÃ©ricos desde el componente padre, permite esconder todas las ramas del Ã¡rbol al unÃ­sono, aliviando la carga visual instantÃ¡neamente.

### [2026-06-10] - EdiciÃ³n Masiva de Horarios (Batch Edit)
- **Avance:** Se implementÃ³ la capacidad de seleccionar y modificar dinÃ¡micamente el horario de mÃºltiples dÃ­as/reglas al mismo tiempo.
- **Detalle ArquitectÃ³nico y UX:**
  1. Se habilitÃ³ un modo de "EdiciÃ³n MÃºltiple" en la barra de herramientas del Creador de Reglas.
  2. La UX utiliza una **Barra de AcciÃ³n Flotante** (Floating Action Bar) para que el usuario visualice la cantidad de reglas seleccionadas y lance el modal de ediciÃ³n, manteniendo el panel despejado el resto del tiempo.
  3. En el backend Node.js (`server/attendance.ts`), se introdujo un nuevo endpoint `batchUpdateHorarios` que envuelve las mutaciones en una **transacciÃ³n de base de datos** (`db.transaction()`). Esto garantiza seguridad y atomicidad. Si una regla fallara al guardarse, se revierten todas las anteriores de ese lote automÃ¡ticamente.

### [2026-06-10] - Mejoras UX y Funcionalidades Premium de Matriz (Changelog y ReplicaciÃ³n)
- **Avance:** Se implementÃ³ una de las propuestas premium de mejora continua enfocada en la trazabilidad (AuditorÃ­a) y la agilizaciÃ³n extrema (ReplicaciÃ³n de Cargos).
- **Detalle ArquitectÃ³nico y UX:**
  1. **AuditorÃ­a Transparente (Changelog en DB):** Se alterÃ³ la estructura de la tabla `horarios` en caliente usando SQLite `ALTER TABLE` controlados por bloques `try...catch` en `db.ts` para agregar columnas `updated_at` y `updated_by`. Todo cambio masivo o unitario registra silenciosamente quÃ© administrador (mediante lectura JWT en tRPC ctx) modificÃ³ esa regla.
  2. **Micro-Interacciones de AuditorÃ­a (UX):** Se inyectaron bloques informativos de tamaÃ±o diminuto (textos en escala `text-[10px]`) que aparecen con `group-hover` en el Ã¡rbol y en el HoverCard del Calendario Semanal, manteniendo la estÃ©tica limpia mientras se entrega la trazabilidad.
  3. **ReplicaciÃ³n Inteligente de Cargos:** Expandiendo el botÃ³n "Replicar Sector", se instaurÃ³ la misma lÃ³gica transaccional a nivel "Cargo". El backend `duplicateCargoRules` chequea obligatoriamente la tabla `personal` para prevenir la clonaciÃ³n ciega hacia cargos deshabilitados o sin miembros en el destino.
  4. **Ocultamiento Contextual:** Se estipulÃ³ por regla de diseÃ±o que los botones "Borrar Nivel" y "Replicar" queden invisibles por defecto, emergiendo (`opacity-0 group-hover:opacity-100`) para evitar ruidos cognitivos ante la inmensidad de reglas del Dashboard.

### [2026-06-10] - ResoluciÃ³n de Bug "ReferenceError: cargosData is not defined"
- **Problema:** Al intentar usar la vista del Ã¡rbol (despuÃ©s de una actualizaciÃ³n previa) la web rompÃ­a en blanco (White Screen of Death) por un error de React: `ReferenceError: cargosData is not defined`.
- **DiagnÃ³stico:** Un error de Shadowing. Al anidar mÃºltiples mapas (`Object.entries(sectores).map(([sector, cargos]) => ...`), la variable externa `cargos` (traÃ­da por TRPC) quedaba en la sombra del argumento iterador. Durante la escritura del componente se intentÃ³ esquivar el shadowing llamando a la variable global como `cargosData`, pero no se habÃ­a renombrado su declaraciÃ³n original (`const { data: cargos } = ...`).
- **SoluciÃ³n:** Se renombrÃ³ el destructuring top-level de la query a `const { data: cargosData }` para asegurar que todo el Ã¡rbol JSX hijo pueda acceder a los datos de cargos brutos sin colisionar con el iterador dinÃ¡mico de las ramas.

### [2026-06-10] - Tweak UX: Tonalidades de Cargos en Calendario Semanal
- **Avance:** Se refinÃ³ la paleta de colores dinÃ¡micos del `WeeklyCalendar`.
- **Detalle:** Originalmente, todos los cargos de un mismo sector usaban exactamente el mismo color de Tailwind (ej. `bg-emerald-500`). Se migrÃ³ la paleta `COLORS` a un `COLOR_PALETTES` que contiene mÃºltiples matices por familia de color (`400`, `500`, `600`, `700`). El color principal (la familia) sigue siendo asignado segÃºn el hashing del *Sector*, mientras que la saturaciÃ³n/brillo (el matiz) es calculado en base al hashing del *Cargo*. AsÃ­, un sector conserva su identidad de color, pero permite diferenciar sutilmente los distintos cargos visualmente.

### [2026-06-10] - AuditorÃ­a QA: RefactorizaciÃ³n ArquitectÃ³nica de Backend
- **Avance:** Se validÃ³ la exitosa separaciÃ³n del monolito `server/attendance.ts` en la arquitectura de servicios distribuidos (`admin.service.ts`, `asistencia.service.ts`, `horarios.service.ts`, `personal.service.ts`).
- **Detalle ArquitectÃ³nico y QA:**
  1. **Bajo Acoplamiento y SRP:** Se comprobÃ³ que cada nuevo servicio tiene una responsabilidad Ãºnica y clara. La lÃ³gica de negocio pesada fue correctamente extraÃ­da de los routers tRPC.
  2. **Cobertura de Unit Tests:** Los archivos `server/attendance.test.ts` y `server/attendance.rules.test.ts` fueron analizados confirmando que mockean correctamente la base de datos (`better-sqlite3`) y validan de manera robusta casos comunes, solapamientos, flujos negativos y reglas de prioridad entre excepciones de legajo y reglas generales, manteniendo una alta cobertura.
  3. **Directivas Cumplidas:** Se han cumplido rigurosamente las Reglas Maestras de Arquitectura establecidas en el sprint anterior, blindando la aplicaciÃ³n contra el anti-patrÃ³n "God Class".

### [2026-06-10] - AuditorÃ­a de Seguridad y Poda de CÃ³digo Muerto (OAuth)
- **Avance:** Se eliminÃ³ por completo el boilerplate heredado de OAuth tras confirmaciÃ³n de inactividad.
- **Detalle ArquitectÃ³nico y Seguridad:**
  1. Los agentes *Security QA* y *Systems Analyst* auditaron el flujo de autenticaciÃ³n, concluyendo que el login local (basado en JWT contra SQLite local y guardado en la cookie segura `app_session_id`) era 100% independiente de los archivos `oauth.ts` y `sdk.ts`.
  2. Se suprimieron todos los endpoints (`auth.oauth_login`, `auth.oauth_callback`) y variables de entorno huÃ©rfanas (`OAUTH_SERVER_URL`), reduciendo drÃ¡sticamente la superficie de ataque y el ruido del cÃ³digo base.

### [2026-06-10] - Gran RefactorizaciÃ³n de UI: Desacoplamiento de AdminTurnos
- **Avance:** Se desmantelÃ³ el componente monolÃ­tico `AdminTurnos.tsx` (>1000 lÃ­neas), aplicando los mismos principios de *Arquitectura Limpia* (SRP) que se aplicaron en el backend.
- **Detalle ArquitectÃ³nico y UX:**
  1. **Aislamiento de Estado y Red:** Se creÃ³ el hook `useAdminTurnos.ts` que encierra todas las consultas (`useQuery`) y mutaciones (`useMutation`) de tRPC, ocultando la complejidad de las recargas (invalidation) y el manejo de errores a la vista.
  2. **Subcomponentes Puros:** Se dividiÃ³ la pantalla en mÃ³dulos autÃ³nomos: `GestionTurnos.tsx` (para crear/eliminar Turnos Maestros) y `CreadorReglasForm.tsx` (que maneja independientemente todos los inputs, combinaciones de horas y excepciones).
  3. **Orquestador Visual:** Se creÃ³ `MatrizHorarios.tsx`, un poderoso contenedor interactivo que aloja toda la lÃ³gica de filtros dinÃ¡micos y alterna entre la vista de Calendario (`WeeklyCalendar`) y la reciÃ©n abstraÃ­da vista de Ãrbol interactivo (`MatrizList.tsx`).
  4. **ConclusiÃ³n:** El archivo `AdminTurnos.tsx` quedÃ³ reducido a ~60 lÃ­neas, operando exclusivamente como un *Shell* importador de subcomponentes. El agente *QA Specialist* verificÃ³ la integraciÃ³n, garantizando que el Ã¡rbol de componentes sigue estando respaldado por las 43 pruebas de `vitest`.

### [2026-06-11] - Planificador Semanal Ãgil y MÃ³dulo de Novedades
- **Avance:** Se completÃ³ exitosamente la Etapa 4 del Master Implementation Plan introduciendo soporte interactivo para el diseÃ±o de turnos semanales de personal rotativo.
- **Detalle ArquitectÃ³nico y UX:**
  1. **Flag de Rotatividad:** Se alterÃ³ la tabla `personal` incorporando `es_rotativo`. Solo el personal con este flag en `1` serÃ¡ expuesto a la planificaciÃ³n semanal.
  2. **Cruce Inteligente con Novedades:** Se creÃ³ la tabla `novedades_licencias`. El nuevo servicio de backend `planificador.service.ts` cruza automÃ¡ticamente a los empleados contra sus licencias y bloquea/tacha en la vista del planificador a aquellos que se encuentran ausentes (enfermedad, vacaciones) en el rango de fechas seleccionado, previniendo asignaciones errÃ³neas.
  3. **AbstracciÃ³n Front/Back:** Se previnieron los anti-patrones "God Class". Se aislaron `AdminNovedades.tsx` y `PlanificadorTurnos.tsx` como orquestadores limpios utilizando `useAdminNovedades.ts` y `usePlanificadorSemanal.ts` y se delegaron las grillas visuales a `GrillaAsignacion.tsx`.
  4. **Bulk Inserts (Transaccional):** Para la asignaciÃ³n masiva de turnos se utiliza `db.transaction()` en SQLite. Obligatoriamente se elimina (`DELETE`) el historial previo superpuesto en el mismo rango de fechas para el empleado antes de inyectar el nuevo turno, garantizando que `historial_turnos` no acumule basura o inconsistencias lÃ³gicas.
  5. **Quirk Detectado:** Al usar literales de plantilla (backticks) multilÃ­nea dentro de queries complejas para las herramientas de IA, TypeScript puede arrojar errores de parseo o de sintaxis escapada (\`). Es recomendable utilizar comillas simples/dobles o evitar backslashes innecesarios al construir sentencias SQL manuales.

---

## ðï¸ DIRECTIVAS ARQUITECTÃNICAS OBLIGATORIAS (NUEVO ESTÃNDAR)
## ðŸ ›ï¸  DIRECTIVAS ARQUITECTÃ“NICAS OBLIGATORIAS (NUEVO ESTÃ NDAR)

A partir de este punto del desarrollo (Tras la auditorÃ­a de QA en `AdminTurnos.tsx` y `attendance.ts`), **TODOS LOS AGENTES** deben regirse bajo los siguientes principios innegociables:

1. **Bajo Acoplamiento (Low Coupling):** Los componentes de UI no deben contener lÃ³gica de negocio densa ni cÃ¡lculos de base de datos.
2. **Principio de Responsabilidad Ãšnica (SRP):** Cada archivo, funciÃ³n y componente debe cumplir con UN Ãºnico objetivo claramente definido. Si una funciÃ³n hace dos cosas, debe ser dividida.
3. **Cobertura con Unit Tests:** Todo objetivo principal (regla de negocio extraÃ­da) debe estar respaldado por un Unit Test con `Vitest`. Queda estrictamente prohibido programar lÃ³gica compleja sin su arnÃ©s de prueba.
4. **No más "God Classes":** Prohibido crear componentes React de más de 300-400 líneas o archivos de backend monolíticos. Siempre aplicar Patrón Repositorio / Servicios.

### [2026-06-11] - Fase 1 & 2: Desmembramiento de God Classes (routers.ts y AdminPanel.tsx)
- **Avance:** Se extrajeron exitosamente los componentes gigantescos del proyecto cumpliendo la regla de "No más God Classes".
- **Backend (Fase 1):** El `routers.ts` principal (451 líneas) fue desmembrado en sub-enrutadores (`server/routers/admin`, `auth`, `attendance`). El archivo original quedó como un simple orquestador de 10 líneas. Además, se introdujeron cabeceras JSDoc estándar (`@module` y `@description`) en todos los servicios de la capa de lógica para asegurar la mantenibilidad y el entendimiento a futuro.
- **Frontend (Fase 2):** El componente `AdminPanel.tsx` (976 líneas) fue particionado. Todo el ABM e interfaces de administración se encapsularon en `<TabPersonal />`, `<TabSectores />` y `<TabCargos />` (ubicados en `client/src/pages/AdminTabs/`). El Panel quedó reducido a 85 líneas, dedicado puramente a Layout y sesión.
- **Lección Aprendida:** tRPC soporta nativamente el esparcimiento (spread operator `...`) de objetos de procedimientos dentro de un `router({})`, lo que permite organizar el backend de forma horizontal y componible sin perder el tipado fuerte que viaja al frontend. React Query (`useQuery`) comparte el caché entre pestañas de manera automática, por lo que desmembrar componentes grandes no impacta negativamente en el uso de red.

### [2026-06-11] - Fase 3 & 4: Refactorización Profunda de UI (AdminTurnos) y JSDoc
- **Avance:** Se completó el plan arquitectónico eliminando el resto de las God Classes del frontend y estandarizando la documentación.
- **Detalle Fase 3:**
  1. Se dividió `CreadorReglasForm.tsx` separando su estado a `useCreadorReglas.ts` y dividiendo su extensa UI en `<ReglaGeneralCampos />` y `<ReglaExcepcionCampos />`.
  2. El mega-componente `MatrizHorarios.tsx` fue despojado de sus modales (ahora en `<Modales />`) y su estado complejo y métodos mutadores (replicar, eliminar en lote) fueron migrados a `useMatrizHorarios.ts`.
  3. El árbol iterativo infinito de `MatrizList.tsx` se separó lógicamente en `<MatrizListGenerales />` y `<MatrizListExcepciones />`.
- **Detalle Fase 4:** Todos los Custom Hooks abstractos extraídos durante el día (`useMatrizHorarios`, `useCreadorReglas`) fueron equipados con cabeceras de bloque `JSDoc` que detallan estrictamente sus responsabilidades, mejorando el onboarding de futuros agentes y desarrolladores.

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

### [2026-06-09] - ResoluciÃ³n de Problemas en el Entorno Local (Windows)
- **Avance:** Se logró levantar el servidor localmente en Windows usando pnpm v10.
- **Problemas resueltos:**
  1. **Conflicto de parches:** pnpm fallaba al instalar `wouter` debido a que la versión requerida por el parche (3.7.1) no coincidía con el caret en `package.json` (`^3.3.5`). Se forzó a la versión exacta `3.7.1`.
  2. **Scripts de post-instalación ignorados:** En pnpm v10 los scripts de compilación nativos (`esbuild`, `better-sqlite3`) se bloquean por seguridad. Se agregó `"onlyBuiltDependencies": ["better-sqlite3", "esbuild"]` al `package.json` y se corrió `pnpm rebuild`.
  3. **Variables de entorno en Windows:** El uso de `NODE_ENV=development` crasheaba en CMD. Se instaló `cross-env` y se actualizaron los scripts `dev` y `start`.
  4. **Terminación abrupta en Batch:** El script `dev-windows.bat` se cerraba solo por ejecutar `pnpm --version` sin el prefijo `call`, comportamiento nativo de Windows al ejecutar `.cmd`. Se agregó el `call`.
  5. **Silencio inicial de Vite:** Se identificó que al arrancar `tsx watch` y Vite, el log de `[Attendance Dashboard] Server running...` tarda unos ~15 segundos en aparecer y a veces Windows retiene el buffer, dando la falsa impresión de que el programa "no levanta".

### [2026-06-09] - RenovaciÃ³n del Master Implementation Plan
- **Avance:** Se reseteó y sobreescribió el archivo `master_implementation_plan.md` a la versión 2.0.
- **Detalle:** Al haber estabilizado el entorno y completado el backlog original, se definió una nueva hoja de ruta centrada en la estabilización de OAuth, generación de reportes (PDF/Excel), Notificaciones Web Push y configuración final para producción.

### [2026-06-09] - ImplementaciÃ³n de Panel de Control y Auth Local (Fase 1 Completada)
- **Avance:** Se descartó el modelo OAuth genérico en favor de un sistema de JWT local y se creó un Panel de Administración cerrado.
- **Detalle Arquitectónico:**
  1. Se verificó (leyendo los scripts Python `ImportarFichadas.py`, etc.) que el reloj biométrico solo alimenta la tabla `fichadas`. Las tablas `personal` y `sectores` son seguras para administrar desde la web.
  2. Se configuró una tabla `admins` en SQLite y un flujo de JWT (`jose`) con cookies seguras (`httpOnly`).
  3. Se diseñaron las rutas `/login` y `/admin` calcando la estética *Premium* solicitada, creando una bifurcación clara: la ruta raíz `/` es el monitor público "solo lectura" para los empleados, y `/login` es la puerta exclusiva para Recursos Humanos.

### [2026-06-09] - Fase 8: LÃ³gica Avanzada de Turnos y Cargos
- **Avance:** Se implementó una lógica de negocio compleja para soportar turnos rotativos, cargos con distinto nivel de criticidad y control de llegadas tarde.
- **Detalle Arquitectónico:**
  1. Se crearon las tablas `cargos`, `turnos_horarios`, `horarios` e `historial_turnos` para mapear de manera precisa a qué hora debe ingresar un empleado según su sector, cargo, día de la semana y turno histórico.
  2. Se modificaron las consultas en el backend (`server/attendance.ts`) para realizar cruces de información y calcular al vuelo la variable `llegadaTarde`.
  3. Se actualizó el Dashboard visualmente bajo las directrices del Agente UX: los encargados tienen el prefijo `(E)` y se pueden ocultar con un switch. Aquellos con rol crítico que faltan tiñen de rojo la tabla de ausentes con un badge de "Cargo Crítico". Los presentes con retraso reciben un badge naranja de "Llegó Tarde".

### [2026-06-09] - ResoluciÃ³n de Bug de Zona Horaria (Timezones)
- **Problema:** El selector de fechas del Dashboard (`SelectorFecha.tsx`) parecía "trabarse" y no dejaba avanzar a la fecha actual (ej. 9/6/2026), mostrando erróneamente el día anterior (8/6/2026).
- **Diagnóstico:** Se descubrió que al usar `new Date("YYYY-MM-DD")` en JavaScript, el motor asume automáticamente que la hora es `00:00:00 UTC`. Al aplicar la zona horaria local de Argentina (GMT-3), el horario retrocedía 3 horas, cayendo en las `21:00:00` del día anterior. Esto causaba un desajuste visual (el render mostraba el día 8) y un desajuste lógico (la validación creía que la variable ya estaba en el día 9).
- **Solución:** Se reemplazó el parseo de string directo por la construcción explícita `new Date(year, month - 1, day)`, la cual instruye al motor de JS a utilizar el huso horario local desde el momento de la instanciación de la fecha.

### [2026-06-09] - ConsolidaciÃ³n de Matriz de Turnos y UX "Tree Schema"
- **Avance:** Se simplificó radicalmente la base de datos eliminando tablas obsoletas heredadas del diseño viejo (`horario_franja`, `horario_excepcion`) para converger en una Súper-Tabla única (`horarios`) de formato "Matriz".
- **Detalle Arquitectónico y UX:**
  1. Se implementó un algoritmo robusto en el backend (Node.js) que evalúa las prioridades de los turnos en memoria. Las "Excepciones por Persona" siempre pisan y sobreescriben a las "Reglas Generales de Sector+Cargo".
  2. Bajo directriz del Agente UX, se rediseñó la "Matriz Actual" en el Panel de Administración. Se abandonó el modelo de tabla plana en favor de un formato "Tree Schema / Crumble" que agrupa visualmente las reglas en ramas colapsables (`Turno > Sector > Cargo > Franjas Horarias`), reduciendo la carga cognitiva.
  3. Se instauró una nueva norma de diseño obligatoria: "Tablas Interactivas". A partir de ahora, todo grid de datos incorpora automáticamente buscadores en tiempo real (barras de texto) y ordenamiento interactivo (flechas up/down) en sus cabeceras.
  4. El Agente QA desarrolló en paralelo pruebas unitarias usando `vitest` que blindan el cálculo de prioridades matemáticas y las validaciones de llegadas tardes, mockeando la base de datos `better-sqlite3`. Se solucionaron problemas de tipado agregando `@testing-library/jest-dom`.

### [2026-06-10] - Fase 9: PersonalizaciÃ³n DinÃ¡mica de Sectores y Cargos
- **Avance:** Se completó el rediseño de la arquitectura de la relación Sector-Cargo. Se implementó una tabla intermedia `sectores_cargos` que permite definir qué cargos existen en qué sector y su nivel de criticidad independiente.
- **Detalle Arquitectónico y UX:**
  1. Se agregó la posibilidad de editar (inline) el nombre de los sectores directamente desde el Admin Panel (`AdminPanel.tsx`).
  2. Se creó un Modal de Configuración interactivo para cada Sector donde los administradores habilitan/deshabilitan los cargos (usando un listado global) y les asignan un valor de criticidad del 1 al 5.
  3. Se interconectó esta nueva fuente de verdad con el Creador de Reglas (`AdminTurnos.tsx`): Al seleccionar un Sector, el combo de Cargos disponibles se filtra dinámicamente limitándose únicamente a los habilitados por la administración en dicho sector.
  4. La suite de pruebas de QA se blindó agregando protección transaccional para evitar desactivar un cargo en un sector si ya hay empleados usándolo o reglas asociadas a él, logrando mantener una cobertura del 100% de la suite.

### [2026-06-10] - Fase 8: Hito de Completitud (GestiÃ³n de Cargos y Tolerancia Interactiva)
- **Avance:** Se completaron los componentes pendientes de la Fase 8, añadiendo la capacidad de administrar los Cargos globalmente y hacer dinámica la visualización de llegadas tarde.
- **Detalle Arquitectónico y UX:**
  1. **CRUD Central de Cargos:** Se añadió una nueva pestaña "Cargos" en el Panel de Administrador, permitiendo gestionar los cargos sin necesidad de scripts de base de datos directos, implementando validaciones estrictas de borrado (no se puede borrar si ya está configurado en un sector, personal u horario).
  2. **Criticidad Desacoplada:** Se validó junto al usuario que el "Nivel de Criticidad" pertenece únicamente a la relación Sector-Cargo, por lo que el cargo base se mantiene simple.
  3. **UX Simulable (Tolerancia Dinámica):** En vez de hardcodear un "tiempo de gracia" en el backend para la llegada tarde, se implementó un control interactivo (slider de 0 a 60 minutos) en el Dashboard. El backend (`getPresentesByDate`) recibe este parámetro al vuelo, permitiendo al usuario visualizar el panorama del día y jugar con los minutos de tolerancia de forma bidireccional en tiempo real.

### [2026-06-10] - OptimizaciÃ³n Continua de UX y ReorganizaciÃ³n de Agentes
- **Avance:** Se completó una serie de mejoras "in-line" para la gestión de empleados y asignación de cargos, eliminando bucles y pasos intermedios, reduciendo drásticamente la cantidad de clicks.
- **Detalle Arquitectónico y UX:**
  1. **Asignación Rápida de Cargos:** En la pestaña "Sectores", los cargos se movieron a su propia columna. Ahora se muestran como pequeños recuadros (*badges*) al lado del sector, y permiten ser desvinculados directamente tocando una "X". Se añadió un popover flotante ("+") que lista únicamente los cargos no asignados, permitiendo vinculaciones con un solo click.
  2. **Formulario Inteligente de Edición:** El modal de edición de empleados fue corregido para que cruce correctamente la string de descripción de sector del backend con el ID numérico que manejan los selectores de shadcn/ui. Esto permite auto-seleccionar por defecto el sector y el cargo actual del empleado, previniendo reseteos accidentales al editar otros campos.
  3. **Actualización del "Agente UI/UX":** Se actualizó formalmente el perfil del estilista (`ui_ux_stylist.md`) con la directiva explícita de "Agilidad Operativa", forzándolo a priorizar componentes que reduzcan pasos para los usuarios.
  4. **Corrección del Optimizador de Tests:** Se restauró y oficializó la instrucción del script de Python local `run_tests.py` dentro del perfil de QA para ejecutar compilaciones e integraciones usando escasos tokens.

### [2026-06-10] - ResoluciÃ³n de Bugs CrÃ­ticos en AutenticaciÃ³n
- **Problema 1 (Falsas credenciales inválidas):** Los usuarios recién creados no podían ingresar. El motivo era que SQLite almacena los emails en formato case-sensitive y con los espacios originales, lo que causaba desencuentros si se tipeaba distinto al registrarse vs al loguearse.
- **Solución 1:** Se endurecieron los esquemas de Zod en `routers.ts` forzando `z.string().trim().toLowerCase().email()` para limpiar e igualar los inputs en todas las rutas.
- **Problema 2 ("¡Bienvenido!" seguido de "Acceso Denegado"):** Al loguearse exitosamente, la web redirigía al panel y rebotaba inmediatamente hacia el login. 
- **Diagnóstico:** Un error de arquitectura silencioso. La mutación de login guardaba el JWT en una cookie llamada `app_session_id` (a través de la constante central `COOKIE_NAME`), pero la función constructora del contexto de TRPC (`createContext` en `server/_core/context.ts`) estaba hardcodeada para leer la cookie `session_token`. Al no encontrarla, la sesión figuraba como nula.
- **Solución 2:** Se reemplazó el texto hardcodeado por la variable de entorno importada `COOKIE_NAME` unificando la lectura y escritura. Estos *quirks* de autenticación fueron documentados en el perfil del agente de debugging.

### [2026-06-10] - ImplementaciÃ³n de Motor de Calendario Semanal (VisualizaciÃ³n y UX)
- **Avance:** Se desarrolló un "Motor de Calendario" para ofrecer una alternativa visual ultra-compacta a la estructura de árbol al momento de administrar las reglas de horarios.
- **Detalle Arquitectónico y UX:**
  1. **WeeklyCalendar.tsx:** Se creó un componente encapsulado que dibuja los 7 días de la semana y una escala vertical de 24 horas en no más de 380px de altura (sin scroll). Utiliza hashing de strings para auto-colorear las cajas según el nombre del sector.
  2. **Inteligencia Computacional de Superposiciones:** Los horarios que cruzan la medianoche se particionan automáticamente y se extienden al día siguiente (manteniendo la integridad). Los solapamientos simultáneos (ej. dos empleados en guardia en el mismo lugar) no arrojan error, sino que conviven armónicamente ajustando sus márgenes para mostrarse empalmados.
  3. **Filtros Inteligentes de Contexto:** Se insertó un Toggle List/Calendar. Además, en vez de obligar al usuario a usar únicamente la barra de texto libre, se implementaron listas desplegables Select (`Turno`, `Sector`, `Cargo`). Estas listas son dinámicas y se retroalimentan del pull de `reglas` activas (solo listan opciones con datos).
  4. **Mejora de UX (Colapsables):** Como petición paralela a la larga "Matriz de Árbol", se instalaron botones de `Colapsar todo` que, mediante un uso ingenioso de React `useEffect` en conjunción con tokens numéricos desde el componente padre, permite esconder todas las ramas del árbol al unísono, aliviando la carga visual instantáneamente.

### [2026-06-10] - EdiciÃ³n Masiva de Horarios (Batch Edit)
- **Avance:** Se implementó la capacidad de seleccionar y modificar dinámicamente el horario de múltiples días/reglas al mismo tiempo.
- **Detalle Arquitectónico y UX:**
  1. Se habilitó un modo de "Edición Múltiple" en la barra de herramientas del Creador de Reglas.
  2. La UX utiliza una **Barra de Acción Flotante** (Floating Action Bar) para que el usuario visualice la cantidad de reglas seleccionadas y lance el modal de edición, manteniendo el panel despejado el resto del tiempo.
  3. En el backend Node.js (`server/attendance.ts`), se introdujo un nuevo endpoint `batchUpdateHorarios` que envuelve las mutaciones en una **transacción de base de datos** (`db.transaction()`). Esto garantiza seguridad y atomicidad. Si una regla fallara al guardarse, se revierten todas las anteriores de ese lote automáticamente.

### [2026-06-10] - Mejoras UX y Funcionalidades Premium de Matriz (Changelog y ReplicaciÃ³n)
- **Avance:** Se implementó una de las propuestas premium de mejora continua enfocada en la trazabilidad (Auditoría) y la agilización extrema (Replicación de Cargos).
- **Detalle Arquitectónico y UX:**
  1. **Auditoría Transparente (Changelog en DB):** Se alteró la estructura de la tabla `horarios` en caliente usando SQLite `ALTER TABLE` controlados por bloques `try...catch` en `db.ts` para agregar columnas `updated_at` y `updated_by`. Todo cambio masivo o unitario registra silenciosamente qué administrador (mediante lectura JWT en tRPC ctx) modificó esa regla.
  2. **Micro-Interacciones de Auditoría (UX):** Se inyectaron bloques informativos de tamaño diminuto (textos en escala `text-[10px]`) que aparecen con `group-hover` en el árbol y en el HoverCard del Calendario Semanal, manteniendo la estética limpia mientras se entrega la trazabilidad.
  3. **Replicación Inteligente de Cargos:** Expandiendo el botón "Replicar Sector", se instauró la misma lógica transaccional a nivel "Cargo". El backend `duplicateCargoRules` chequea obligatoriamente la tabla `personal` para prevenir la clonación ciega hacia cargos deshabilitados o sin miembros en el destino.
  4. **Ocultamiento Contextual:** Se estipuló por regla de diseño que los botones "Borrar Nivel" y "Replicar" queden invisibles por defecto, emergiendo (`opacity-0 group-hover:opacity-100`) para evitar ruidos cognitivos ante la inmensidad de reglas del Dashboard.

### [2026-06-10] - ResoluciÃ³n de Bug "ReferenceError: cargosData is not defined"
- **Problema:** Al intentar usar la vista del árbol (después de una actualización previa) la web rompía en blanco (White Screen of Death) por un error de React: `ReferenceError: cargosData is not defined`.
- **Diagnóstico:** Un error de Shadowing. Al anidar múltiples mapas (`Object.entries(sectores).map(([sector, cargos]) => ...`), la variable externa `cargos` (traída por TRPC) quedaba en la sombra del argumento iterador. Durante la escritura del componente se intentó esquivar el shadowing llamando a la variable global como `cargosData`, pero no se había renombrado su declaración original (`const { data: cargos } = ...`).
- **Solución:** Se renombró el destructuring top-level de la query a `const { data: cargosData }` para asegurar que todo el árbol JSX hijo pueda acceder a los datos de cargos brutos sin colisionar con el iterador dinámico de las ramas.

### [2026-06-10] - Tweak UX: Tonalidades de Cargos en Calendario Semanal
- **Avance:** Se refinó la paleta de colores dinámicos del `WeeklyCalendar`.
- **Detalle:** Originalmente, todos los cargos de un mismo sector usaban exactamente el mismo color de Tailwind (ej. `bg-emerald-500`). Se migró la paleta `COLORS` a un `COLOR_PALETTES` que contiene múltiples matices por familia de color (`400`, `500`, `600`, `700`). El color principal (la familia) sigue siendo asignado según el hashing del *Sector*, mientras que la saturación/brillo (el matiz) es calculado en base al hashing del *Cargo*. Así, un sector conserva su identidad de color, pero permite diferenciar sutilmente los distintos cargos visualmente.

### [2026-06-10] - AuditorÃ­a QA: RefactorizaciÃ³n ArquitectÃ³nica de Backend
- **Avance:** Se validó la exitosa separación del monolito `server/attendance.ts` en la arquitectura de servicios distribuidos (`admin.service.ts`, `asistencia.service.ts`, `horarios.service.ts`, `personal.service.ts`).
- **Detalle Arquitectónico y QA:**
  1. **Bajo Acoplamiento y SRP:** Se comprobó que cada nuevo servicio tiene una responsabilidad única y clara. La lógica de negocio pesada fue correctamente extraída de los routers tRPC.
  2. **Cobertura de Unit Tests:** Los archivos `server/attendance.test.ts` y `server/attendance.rules.test.ts` fueron analizados confirmando que mockean correctamente la base de datos (`better-sqlite3`) y validan de manera robusta casos comunes, solapamientos, flujos negativos y reglas de prioridad entre excepciones de legajo y reglas generales, manteniendo una alta cobertura.
  3. **Directivas Cumplidas:** Se han cumplido rigurosamente las Reglas Maestras de Arquitectura establecidas en el sprint anterior, blindando la aplicación contra el anti-patrón "God Class".

### [2026-06-10] - AuditorÃ­a de Seguridad y Poda de CÃ³digo Muerto (OAuth)
- **Avance:** Se eliminó por completo el boilerplate heredado de OAuth tras confirmación de inactividad.
- **Detalle Arquitectónico y Seguridad:**
  1. Los agentes *Security QA* y *Systems Analyst* auditaron el flujo de autenticación, concluyendo que el login local (basado en JWT contra SQLite local y guardado en la cookie segura `app_session_id`) era 100% independiente de los archivos `oauth.ts` y `sdk.ts`.
  2. Se suprimieron todos los endpoints (`auth.oauth_login`, `auth.oauth_callback`) y variables de entorno huérfanas (`OAUTH_SERVER_URL`), reduciendo drásticamente la superficie de ataque y el ruido del código base.

### [2026-06-10] - Gran RefactorizaciÃ³n de UI: Desacoplamiento de AdminTurnos
- **Avance:** Se desmanteló el componente monolítico `AdminTurnos.tsx` (>1000 líneas), aplicando los mismos principios de *Arquitectura Limpia* (SRP) que se aplicaron en el backend.
- **Detalle Arquitectónico y UX:**
  1. **Aislamiento de Estado y Red:** Se creó el hook `useAdminTurnos.ts` que encierra todas las consultas (`useQuery`) y mutaciones (`useMutation`) de tRPC, ocultando la complejidad de las recargas (invalidation) y el manejo de errores a la vista.
  2. **Subcomponentes Puros:** Se dividió la pantalla en módulos autónomos: `GestionTurnos.tsx` (para crear/eliminar Turnos Maestros) y `CreadorReglasForm.tsx` (que maneja independientemente todos los inputs, combinaciones de horas y excepciones).
  3. **Orquestador Visual:** Se creó `MatrizHorarios.tsx`, un poderoso contenedor interactivo que aloja toda la lógica de filtros dinámicos y alterna entre la vista de Calendario (`WeeklyCalendar`) y la recién abstraída vista de árbol interactivo (`MatrizList.tsx`).
  4. **Conclusión:** El archivo `AdminTurnos.tsx` quedó reducido a ~60 líneas, operando exclusivamente como un *Shell* importador de subcomponentes. El agente *QA Specialist* verificó la integración, garantizando que el árbol de componentes sigue estando respaldado por las 43 pruebas de `vitest`.

### [2026-06-11] - Planificador Semanal Ã gil y MÃ³dulo de Novedades
- **Avance:** Se completó exitosamente la Etapa 4 del Master Implementation Plan introduciendo soporte interactivo para el diseño de turnos semanales de personal rotativo.
- **Detalle Arquitectónico y UX:**
  1. **Flag de Rotatividad:** Se alteró la tabla `personal` incorporando `es_rotativo`. Solo el personal con este flag en `1` será expuesto a la planificación semanal.
  2. **Cruce Inteligente con Novedades:** Se creó la tabla `novedades_licencias`. El nuevo servicio de backend `planificador.service.ts` cruza automáticamente a los empleados contra sus licencias y bloquea/tacha en la vista del planificador a aquellos que se encuentran ausentes (enfermedad, vacaciones) en el rango de fechas seleccionado, previniendo asignaciones erróneas.
  3. **Abstracción Front/Back:** Se previnieron los anti-patrones "God Class". Se aislaron `AdminNovedades.tsx` y `PlanificadorTurnos.tsx` como orquestadores limpios utilizando `useAdminNovedades.ts` y `usePlanificadorSemanal.ts` y se delegaron las grillas visuales a `GrillaAsignacion.tsx`.
  4. **Bulk Inserts (Transaccional):** Para la asignación masiva de turnos se utiliza `db.transaction()` en SQLite. Obligatoriamente se elimina (`DELETE`) el historial previo superpuesto en el mismo rango de fechas para el empleado antes de inyectar el nuevo turno, garantizando que `historial_turnos` no acumule basura o inconsistencias lógicas.
  5. **Quirk Detectado:** Al usar literales de plantilla (backticks) multilínea dentro de queries complejas para las herramientas de IA, TypeScript puede arrojar errores de parseo o de sintaxis escapada (`). Es recomendable utilizar comillas simples/dobles o evitar backslashes innecesarios al construir sentencias SQL manuales.

---

## 🏗️ DIRECTIVAS ARQUITECTÓNICAS OBLIGATORIAS (NUEVO ESTÁNDAR)

A partir de este punto del desarrollo (Tras la auditoría de QA en `AdminTurnos.tsx` y `attendance.ts`), **TODOS LOS AGENTES** deben regirse bajo los siguientes principios innegociables:

1. **Bajo Acoplamiento (Low Coupling):** Los componentes de UI no deben contener lógica de negocio densa ni cálculos de base de datos.
2. **Principio de Responsabilidad Única (SRP):** Cada archivo, función y componente debe cumplir con UN único objetivo claramente definido. Si una función hace dos cosas, debe ser dividida.
3. **Cobertura con Unit Tests:** Todo objetivo principal (regla de negocio extraída) debe estar respaldado por un Unit Test con `Vitest`. Queda estrictamente prohibido programar lógica compleja sin su arnés de prueba.
4. **No más "God Classes":** Prohibido crear componentes React de más de 300-400 líneas o archivos de backend monolíticos. Siempre aplicar Patrón Repositorio / Servicios.

### [2026-06-11] - Fase 1 & 2: Desmembramiento de God Classes (routers.ts y AdminPanel.tsx)
- **Avance:** Se extrajeron exitosamente los componentes gigantescos del proyecto cumpliendo la regla de "No más God Classes".
- **Backend (Fase 1):** El `routers.ts` principal (451 líneas) fue desmembrado en sub-enrutadores (`server/routers/admin`, `auth`, `attendance`). El archivo original quedó como un simple orquestador de 10 líneas. Además, se introdujeron cabeceras JSDoc estándar (`@module` y `@description`) en todos los servicios de la capa de lógica para asegurar la mantenibilidad y el entendimiento a futuro.
- **Frontend (Fase 2):** El componente `AdminPanel.tsx` (976 líneas) fue particionado. Todo el ABM e interfaces de administración se encapsularon en `<TabPersonal />`, `<TabSectores />` y `<TabCargos />` (ubicados en `client/src/pages/AdminTabs/`). El Panel quedó reducido a 85 líneas, dedicado puramente a Layout y sesión.
- **Lección Aprendida:** tRPC soporta nativamente el esparcimiento (spread operator `...`) de objetos de procedimientos dentro de un `router({})`, lo que permite organizar el backend de forma horizontal y componible sin perder el tipado fuerte que viaja al frontend. React Query (`useQuery`) comparte el caché entre pestañas de manera automática, por lo que desmembrar componentes grandes no impacta negativamente en el uso de red.

### [2026-06-11] - Fase 3 & 4: Refactorización Profunda de UI (AdminTurnos) y JSDoc
- **Avance:** Se completó el plan arquitectónico eliminando el resto de las God Classes del frontend y estandarizando la documentación.
- **Detalle Fase 3:**
  1. Se dividió `CreadorReglasForm.tsx` separando su estado a `useCreadorReglas.ts` y dividiendo su extensa UI en `<ReglaGeneralCampos />` y `<ReglaExcepcionCampos />`.
  2. El mega-componente `MatrizHorarios.tsx` fue despojado de sus modales (ahora en `<Modales />`) y su estado complejo y métodos mutadores (replicar, eliminar en lote) fueron migrados a `useMatrizHorarios.ts`.
  3. El árbol iterativo infinito de `MatrizList.tsx` se separó lógicamente en `<MatrizListGenerales />` y `<MatrizListExcepciones />`.
- **Detalle Fase 4:** Todos los Custom Hooks abstractos extraídos durante el día (`useMatrizHorarios`, `useCreadorReglas`) fueron equipados con cabeceras de bloque `JSDoc` que detallan estrictamente sus responsabilidades, mejorando el onboarding de futuros agentes y desarrolladores.

### [2026-06-11] - Corrección de Turnos Cortados y Edición Dinámica
- **Problema 1 (Fallo en Creación):** Al crear un turno cortado desde el formulario, el sistema no estaba pasando los parámetros `es_cortado`, `hora_entrada_2` y `hora_salida_2` a la mutación en `AdminTurnos.tsx`, causando que se guarden como turnos simples.
- **Problema 2 (Edición Limitada):** Las funciones `updateHorario` y `batchUpdateHorarios` no permitían alterar la segunda franja del turno, forzando al usuario a borrar y recrear la regla si quería modificarla. Además, un error de tipografía en SQLite (`datetime("now", "localtime")` con comillas dobles) generaba un error al actualizar por referenciar una columna inexistente.
- **Solución y UX Avanzada:**
  1. Se modificó el backend para usar literales simples (`'now'`) en la sintaxis SQL.
  2. Se expandió drásticamente el componente de edición rápida (*inline edit* en el árbol). Al apretar el lápiz, ahora se despliega una casilla *"Cortado"*. Al tildarla, aparece instantáneamente una segunda fila de horarios, permitiendo transformar cualquier turno a formato cortado (y viceversa) sin recargar la página.
  3. Esta misma lógica dinámica se implementó en el modal de Edición por Lotes (Batch Edit), permitiendo transformar múltiples turnos seleccionados en cortados simultáneamente.
  4. La regla de UX/UI sigue intacta: mantener todo ágil y *in-place* sin entorpecer visualmente, evitando abrir ventanas grandes a menos que sea necesario.

### [2026-06-11] - Rediseño del Planificador y Separación de Esquemas (UI/UX & DB)
- **Avance UI/UX (Planificador Ágil):** Se reconstruyó completamente `GrillaAsignacion.tsx`. Se erradicó el antiguo dropdown unificado, reemplazándolo por un sistema de columnas separadas por cada `Turno Maestro` disponible. Se implementaron botones distintivos (codificados por color), *Sticky Headers*, contadores dinámicos de personal efectivo asignado, y una fila resumen en la base de la tabla.
- **Avance Estado "En Capacitación":** Se incorporó la columna `enCapacitacion` en la base de datos de empleados. Desde el frontend (en la misma grilla) el usuario ahora tiene un "Switch" para alternar rápidamente este estado. Al activarse, la persona deja de contar para la suma de efectivos totales del turno en los reportes en vivo.
- **Lección Aprendida (Esquema de Base de Datos):** La Matriz de Horarios y el Planificador pueden prestarse a confusión terminológica. Es imperativo recordar que:
  1. `turnos_horarios`: Tabla que funge como "diccionario" de Turnos Maestros (Solo IDs y Nombres).
  2. `horarios`: Tabla de *Reglas Generales*. La Matriz de Horarios del frontend DIBUJA EL ÁRBOL EXCLUSIVAMENTE a partir de las reglas creadas aquí. Un Turno Maestro que no posea registros en esta tabla NO será renderizado en el árbol.
  3. `historial_turnos` / `turno_asignado`: Tablas de asignación transaccional creadas desde la vista del Planificador. Asignar un empleado a un Turno Maestro en el Planificador no equivale a crearle una regla a ese Turno Maestro en la Matriz.
- **Quirk Técnico (Truncamiento y Flexbox vs CSS Grid):** Al implementar funciones de truncamiento visual (`truncate` de Tailwind) dentro de contenedores padre de tipo `flex`, los elementos tienden a encogerse (shrink) dramáticamente si su propiedad `flex-basis` colisiona con restricciones de espacio. Se aprendió que para divisiones estrictas de panel (Ej: Layout 50% vs 50% de `MatrizList.tsx`), el uso de `grid grid-cols-1 xl:grid-cols-2` es ampliamente superior a `flex flex-col xl:flex-row`, ya que el Grid restringe y asegura el ancho computado de las columnas, obligando a los componentes internos a truncarse correctamente sin deformar ni colapsar la estructura general de la página.

### [2026-06-11] - Cumplimiento QA y Edición de Novedades
- **Avance:** Se completaron exitosamente las directivas de Arquitectura Limpia solicitadas por el QA para el Planificador Semanal, y se expandió el módulo de Novedades con funcionalidades de edición/extensión.
- **Detalle Arquitectónico y UX:**
  1. **Abstracción Front/Back:** Se separaron completamente las acciones de mutación ('Editar Plan' y 'Eliminar Plan') de los componentes visuales (ListadoPlanesGuardados.tsx) hacia hooks aislados (usePlanificadorSemanal.ts y useListadoPlanesGuardados.ts), respetando el SRP.
  2. **Pruebas de Integración y Unitarias:** Se instalaron suites de tests usando Vitest tanto en el Frontend (usePlanificadorSemanal.test.ts) como en el Backend (planificador.service.test.ts), blindando la persistencia de turnos y logrando compilar exitosamente pnpm check y pnpm test.
  3. **Edición In-Place de Novedades:** Se creó la mutación tRPC updateNovedad y su contraparte en BD. En la UX, se reutilizó el modal de 'Nueva Novedad', que ahora reacciona contextualmente actuando como modal de 'Actualización' si se hace clic en el nuevo botón del lápiz. Esto evita colisiones de registros y simplifica reportes futuros.

### [2026-06-11] - Dashboard Agrupado y Mejoras UX Generales
- **Avance:** Se transformó la visualización del Dashboard principal para agrupar las asistencias por Turnos en lugar de listas planas, y se resolvieron varios bugs de interfaz en la administración.
- **Detalle Arquitectónico y UX:**
  1. **Dashboard Predictivo:** Se rediseñó el backend (`asistencia.service.ts`) para procesar el `historial_turnos` y cruzarlo con el calendario del día, devolviendo estructuras agrupadas por turno. En el frontend se implementó `<GrupoTurnoAsistencia>` encapsulando estas lógicas en subcomponentes colapsables, mejorando la legibilidad.
  2. **Bug de Duplicación (Llegadas Tarde):** Se diagnosticó y corrigió un error en el algoritmo de agrupamiento que estaba insertando a los empleados demorados en el array de `Presentes` simultáneamente con el de `Llegada Tarde`, causando doble renderizado.
  3. **Corrección de UX en ABM (Scroll Reset):** Se identificó un patrón molesto donde el componente `Loader2` de React Query desmontaba prematuramente el grid de datos al momento de guardar cambios (tras invalidar cache), ocasionando que el navegador resetease el scroll del usuario al top de la pantalla. Se corrigió en todos los tabs (Personal, Sectores, Cargos) ajustando las comprobaciones para que el spinner solo se muestre en initial load.
  4. **Cascada de Actualizaciones (Legajo Único):** Se habilitó la edición libre del número de legajo en el ABM de Personal. Para mantener integridad referencial a pesar de no usar Foreign Keys explícitos con `ON UPDATE CASCADE` en este diseño inicial, se implementó una actualización manual transaccional (`db.transaction`) sobre las tablas asociadas (`historial_turnos`, `novedades_licencias`).
  5. **Filtros Relacionales Dinámicos:** Se ajustó la ventana modal de Replicación de Reglas (por cargo) para que su lista desplegable cruce información con la tabla `sectores_cargos` e impida clonar reglas hacia cargos inhabilitados para ese sector en particular.

### [2026-06-12] - Correcci�n de Bugs: Duplicados en Dashboard y Scroll Jump en Modales
- **Avance:** Se corrigieron dos bugs molestos reportados por el usuario.
- **Detalle Arquitect�nico y UX:**
  1. **Duplicaci�n de Personal:** El empleado aparec�a dos veces (en 'Presentes' y en 'Fuera de Turno'). El origen era un \LEFT JOIN\ multiplicativo en \queryPersonal\ (\sistencia.service.ts\) provocado por duplicados o sobreposiciones en \sectores_cargos\. Se solucion� aplicando \GROUP BY p.legajo\ y \MAX(sc.nivel_criticidad)\ para asegurar unicidad de registros antes de procesarlos en memoria.
  2. **Salto de Scroll (Scroll Jump) en Dialogs:** Al editar un empleado, el modal cerraba y la p�gina se reiniciaba hacia arriba. Esto es un 'quirk' conocido de Radix UI (usado por shadcn/ui), donde al no estar envuelto el bot�n de edici�n en un \DialogTrigger\, Radix retorna el foco a la fuerza al �nico \DialogTrigger\ existente (el bot�n superior 'A�adir Empleado'). Se corrigi� pasando \onCloseAutoFocus={(e) => e.preventDefault()}\ al \DialogContent\.


### [2026-06-12] - Historial de Fichadas y Blindaje de Base de Datos
- **Avance Arquitectónico:** Se migró el esquema de SQLite para utilizar `PRAGMA foreign_keys = ON` y `ON UPDATE CASCADE ON DELETE CASCADE` en las tablas de `historial_turnos` y `novedades_licencias`, removiendo la frágil gestión manual de cascadas en código.
- **Avance Testing:** Se implementaron pruebas unitarias completas con Vitest y una base de datos `:memory:` simulada para los servicios de personal, novedades y administración, garantizando el SRP y la fiabilidad de las operaciones ABM.
- **Avance Funcional (Fase 2):** Se construyó e integró el `HistorialFichadasModal` en el Dashboard. Ahora las filas de empleados son interactivas (clicables) y despliegan una bitácora detallada de entradas/salidas puras consumidas directamente desde el servicio de asistencia.

### [2026-06-12] - Mejoras de UX y Flujos Rapidos de Carga
- **Avance UX:** Se redise�o el flujo de carga manual en la Grilla del Planificador. Se a�adio un selector de 'Asignacion Rapida con Enter' que, combinado con la limpieza automatica del filtro de texto, permite asignar turnos masivamente a alta velocidad sin quitar las manos del teclado.
- **Avance UX (Atajos):** Se habilitaron atajos de teclado dinamicos (Ctrl + Letra) basados en el primer caracter distintivo del turno (ej. M para Ma�ana), ignorando prefijos estaticos como 'Turno'.

### [2026-06-12] - Arquitectura de Auto-Sincronizacion (Delta Sync)
- **Avance Arquitectonico:** Se reemplazo el viejo sistema de importacion manual/externa por un Worker de Delta Sync integrado en el backend de Node.js (sync.service.ts).
- **Detalle:** El Worker hace polling cada 15 segundos mediante ATTACH DATABASE hacia la unidad remota, extrayendo unicamente los registros donde 
roFichada es mayor al maximo local. Esto elimina bloqueos y asegura latencia casi en tiempo real.
- **Configuracion:** Se extrajeron todas las variables duras (rutas de red, intervalos de timer) a server/config.ts para facilitar futuros cambios en el despliegue.
