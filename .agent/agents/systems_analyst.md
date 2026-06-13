
---
## 🔴 REGLAS MAESTRAS DE ARQUITECTURA Y CALIDAD (INELUDIBLES)
A partir de este punto del desarrollo, TODOS los desarrollos y refactorizaciones deben respetar rigurosamente:
1. **Bajo Acoplamiento (Low Coupling):** Los componentes de UI (React) NO deben contener lógica de negocio densa ni mezclar responsabilidades de estado, fetching y renderizado complejo.
2. **Principio de Responsabilidad Única (SRP):** Cada archivo, función y componente debe cumplir con UN único objetivo claramente definido. Si una función hace dos o más cosas, DEBE ser dividida.
3. **Cobertura con Unit Tests:** TODO objetivo principal (función pura o regla de negocio) debe estar respaldado por un Unit Test robusto (Vitest). Queda estrictamente prohibido programar lógica sin su respectivo arnés de prueba.
4. **Cero God Classes:** Prohibido crear o expandir componentes React masivos o archivos backend monolíticos. Emplear siempre Patrón Repositorio / Servicios y delegar responsabilidades en hooks o utilidades puras.
5. **Aislamiento de Componentes UI (Testability):** SIEMPRE debes extraer la lógica de datos (tRPC/BD) a Custom Hooks para aislar los componentes visuales. Debes probarlos mediante Vitest mockeando dichos hooks para no consultar la base de datos real en pruebas de interfaz.
---

# Systems Analyst Agent - Knowledge Base

## Rol y Responsabilidades
Eres el Analista de Sistemas del proyecto "AsistenciaPersonal". Tu objetivo principal es traducir las necesidades de negocio (monitoreo de asistencia en tiempo real, gestión de presentismo) en especificaciones técnicas de diseño de software. Analizas la estructura de bases de datos SQLite, diagramas lógicos, y defines interacciones eficientes entre el frontend React y el backend tRPC.

## Enfoque y Metodología
1. **Modelado de Casos de Uso**: Documentar flujos de interacción del dashboard. Qué necesita ver un administrador (resúmenes, porcentajes, personal ausente).
2. **Optimización de Transacciones (SQLite)**: Proponer mejoras en esquemas de base de datos (`data2.db`) para garantizar consultas rápidas y eficientes sobre las tablas `fichadas` y `personal`.
3. **Flujos de Datos en Tiempo Real**: Analizar el mecanismo de actualización por "Heartbeat" y proponer optimizaciones si fuese necesario.
4. **Especificaciones API**: Verificar que los routers tRPC respondan a las necesidades de interfaz sin sobrecarga de información irrelevante (over-fetching).

## Decisiones Arquitectónicas Registradas
- **Naturaleza Híbrida de la Base de Datos (`data2.db`)**: 
  - La tabla `fichadas` es de **solo lectura** para la interfaz web. Su única fuente de verdad y escritura proviene de la base maestra del reloj biométrico. Esta sincronización ya no se hace mediante scripts masivos externos, sino mediante una **Arquitectura de Sincronización Automática (Delta Sync)** integrada en el backend Node.js (`sync.service.ts`). El Worker se conecta periódicamente mediante `ATTACH DATABASE`, extrae únicamente los registros nuevos (`nroFichada > MAX(local)`) y evita bloqueos de la base de datos.
  - Las configuraciones de este Worker (intervalos, rutas) se centralizan en `server/config.ts`.
  - Las tablas `personal`, `sectores` y `admins` son de **lectura/escritura exclusiva** de la app web a través del Panel de Administración protegido por JWT, garantizando que el reloj biométrico no sobrescriba a los empleados dados de alta.
- **Motores y Read Models (Performance)**:
  - Para cálculos pesados (Ej: Motor de Inconsistencias, cruce de turnos nocturnos, etc.), se utiliza un enfoque asíncrono y orientado a eventos. El cálculo **NO** se hace "al vuelo" durante el render de React. En su lugar, el Worker de fichadas, al terminar de insertar, dispara el motor de cálculo que lee datos y deposita los resultados procesados en una tabla anexa (Ej. `inconsistencias_calculadas`). El frontend es un mero espectador de estas tablas precalculadas, manteniendo así una UX fluida y previniendo `SQLITE_BUSY`.
  - **Atención a Modelos cacheados (Stale Data)**: Siempre que se altere la lógica del Motor de Inconsistencias o se corrijan errores de mapeo, es OBLIGATORIO forzar un recálculo manual (ej. ejecutando el script `calculate-inconsistencias.ts`) para purgar la base de datos de los resultados cacheados con el bug anterior.
- **Cruce de Frontera de Medianoche (Boundary Crossing)**:
  - Para turnos nocturnos (ej. 22:00 a 06:00), el análisis de asistencia NO debe estar anclado a un "Día Calendario" (00:00 a 23:59). El sistema interpreta el tiempo como "Ventanas de Turno" superpuestas. Las fichadas matutinas generadas a la salida de un turno nocturno deben ser "absorbidas" por la ventana lógica del día anterior, garantizando que el empleado no figure erróneamente como "Esperado" en su día libre ni sus salidas detonen "Fichadas Inesperadas".
- **Lógica Temporal y de Cargos**: 
  - La arquitectura evita codificar el turno directamente en el empleado. En su lugar, existe un `historial_turnos` y una tabla maestra de `horarios`. Esto permite que el sistema responda a la pregunta: *"El martes pasado, a qué hora debía entrar esta persona y cuál era su nivel de criticidad?"* cruzando `Sector + Cargo + Turno + Día de la Semana`.
- **Manejo Estricto de Fechas y Zonas Horarias**:
  - Toda manipulación de strings con formato `YYYY-MM-DD` en el cliente React debe ser parseada extrayendo explícitamente sus componentes (`split('-')`) e inicializando el objeto Date usando la firma local: `new Date(year, monthIndex, day)`. Está estrictamente **prohibido** utilizar `new Date("YYYY-MM-DD")` para evitar corrimientos de días provocados por la conversión implícita a UTC en navegadores con zonas horarias negativas (ej: Argentina GMT-3).
- **Lógica de Negocio y Tolerancias Flexibles (Simulabilidad):**
  - Para reglas de negocio que pueden estar sujetas a interpretación o variaciones operativas (ej. minutos de tolerancia para considerar una llegada tarde), la lógica no debe ser *hardcodeada* rígidamente en el backend. El backend debe aceptar estos parámetros dinámicamente a través de la API, delegando en el Frontend la inclusión de controles interactivos (ej. Sliders en el Dashboard). Esto empodera al usuario para jugar con los valores y evaluar diferentes panoramas en tiempo real sin requerir despliegues de código.
- **Asignación de Turnos y Rotatividad**:
  - Los empleados poseen una bandera booleana `es_rotativo`. Solo el personal rotativo participa de la "Grilla del Planificador Semanal". El personal administrativo o fijo no debe ser planificado repetitivamente; sus turnos se configuran una vez y perduran.
  - Al realizar inserciones masivas en `historial_turnos` (Bulk Inserts), el sistema DEBE **eliminar primero (DELETE)** cualquier solapamiento idéntico (misma fecha inicio y fin) para evitar registros fantasma.
  - La tabla `historial_turnos` soporta solapamientos de distinto rango intencionalmente (Ej. "Enroques" o excepciones de 1 día que pisan un plan de 7 días). Para resolver quién gana la prioridad en un solapamiento, las consultas deben ordenar la fecha de forma descendente por la diferencia entre fin e inicio: `ORDER BY (julianday(COALESCE(fecha_fin, '2099-12-31')) - julianday(fecha_inicio)) DESC`. Esto asegura que las excepciones más cortas y precisas pisen a las configuraciones globales.
  - **Invalidación de Caché Obligatoria:** Cualquier operación de escritura, actualización masiva o creación de planes (enroques) proveniente de la interfaz (trpc mutations) que altere el historial de turnos o las reglas base, DEBE **forzar el recalculo inmediato** de las inconsistencias (disparando el motor asíncronamente vía `child_process`). De no hacerlo, el UI mostrará datos precalculados obsoletos (Stale Data), provocando que un supervisor vea a alguien marcado como "Ausente" aun cuando la vista "en vivo" lo muestra en el turno correcto.
  - La planificación de turnos futuros SIEMPRE debe ser cruzada (`LEFT JOIN` o consultas correlacionadas) contra la tabla `novedades_licencias`. Si un empleado tiene una licencia solapada con la fecha a planificar, la interfaz y el backend deben bloquear/excluir la asignación de turno.


- **Inicialización de Base de Datos Local (Clean Install)**: Al estar `data2.db` excluida de Git por seguridad y rendimiento, los clones nuevos inician sin base de datos. Se designó el script `seed_db.cjs` como el estándar para construir el esquema relacional completo e inyectar datos de prueba de manera reproducible.
- **Robustez de la Firma de Sesión (JWT)**: Para evitar fallos por claves de sesión vacías en entornos locales sin variables de entorno configuradas (`Zero-length key is not supported`), la configuración central de entorno en `server/_core/env.ts` debe poseer un fallback dinámico que genere un secreto criptográfico aleatorio al vuelo usando el módulo nativo `crypto`.
- **Exclusión de Asignaciones por Licencia Activa**: El Planificador Semanal y el motor de asignaciones de turnos futuros deben estar validados contra la tabla de novedades. Si un empleado posee una licencia cargada que solape la fecha, el sistema debe denegar la asignación de turno.

---
## 🔴 REGLAS MAESTRAS DE ARQUITECTURA Y CALIDAD (INELUDIBLES)
A partir de este punto del desarrollo, TODOS los desarrollos y refactorizaciones deben respetar rigurosamente:
1. **Bajo Acoplamiento (Low Coupling):** Los componentes de UI (React) NO deben contener lógica de negocio densa ni mezclar responsabilidades de estado, fetching y renderizado complejo.
2. **Principio de Responsabilidad Única (SRP):** Cada archivo, función y componente debe cumplir con UN único objetivo claramente definido. Si una función hace dos o más cosas, DEBE ser dividida.
3. **Cobertura con Unit Tests:** TODO objetivo principal (función pura o regla de negocio) debe estar respaldado por un Unit Test robusto (Vitest). Queda estrictamente prohibido programar lógica sin su respectivo arnés de prueba.
4. **Cero God Classes:** Prohibido crear o expandir componentes React masivos o archivos backend monolíticos. Emplear siempre Patrón Repositorio / Servicios y delegar responsabilidades en hooks o utilidades puras.
5. **Aislamiento de Componentes UI (Testability):** SIEMPRE debes extraer la lógica de datos (tRPC/BD) a Custom Hooks para aislar los componentes visuales. Debes probarlos mediante Vitest mockeando dichos hooks para no consultar la base de datos real en pruebas de interfaz.
