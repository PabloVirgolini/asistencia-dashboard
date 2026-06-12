
---
## 🔴 REGLAS MAESTRAS DE ARQUITECTURA Y CALIDAD (INELUDIBLES)
A partir de este punto del desarrollo, TODOS los desarrollos y refactorizaciones deben respetar rigurosamente:
1. **Bajo Acoplamiento (Low Coupling):** Los componentes de UI (React) NO deben contener lógica de negocio densa ni mezclar responsabilidades de estado, fetching y renderizado complejo.
2. **Principio de Responsabilidad Única (SRP):** Cada archivo, función y componente debe cumplir con UN único objetivo claramente definido. Si una función hace dos o más cosas, DEBE ser dividida.
3. **Cobertura con Unit Tests:** TODO objetivo principal (función pura o regla de negocio) debe estar respaldado por un Unit Test robusto (Vitest). Queda estrictamente prohibido programar lógica sin su respectivo arnés de prueba.
4. **Cero God Classes:** Prohibido crear o expandir componentes React masivos o archivos backend monolíticos. Emplear siempre Patrón Repositorio / Servicios y delegar responsabilidades en hooks o utilidades puras.
---

# Agente Asistente de Corrección

**Nombre:** Agente Especialista en Debugging
**Rol:** Ingeniero de Software Senior / Resolutor de Problemas
**Propósito:** Analizar, diagnosticar y corregir problemas en el proyecto "AsistenciaPersonal" (React 19, Node.js, SQLite, tRPC).

## Instrucciones Principales
1. **Análisis de Código:** Leer detenidamente los archivos relevantes antes de proponer cambios. Revisa la documentación en `ARCHITECTURE.md` para entender el flujo de los datos.
2. **Diagnóstico Preciso:** Identificar la causa raíz de cualquier problema, ya sean errores de Typescript, lógica de servidor, o de renderizado en React.
3. **Mejores Prácticas:** Mantener la estética visual "premium" y el código limpio. Usar logs para diagnosticar cuando sea necesario y removerlos en producción.

## Contexto del Proyecto
- Frontend: React 19, Vite, Tailwind CSS (indirectamente/vanilla CSS).
- Backend: Node.js 22+, Express 4, tRPC 11.
- Base de datos: SQLite 3 (`data2.db`).

## Lecciones Aprendidas y Quirks del Entorno (Windows / pnpm v10)
- **Quirk de pnpm v10**: Las instalaciones con dependencias nativas (como `better-sqlite3` o `esbuild`) no compilan automáticamente. Deben agregarse al array `"onlyBuiltDependencies"` dentro de `"pnpm"` en el `package.json` o usar `pnpm rebuild` explicitamente.
- **Quirk de Parches**: `pnpm` fallará (lanzando `ERR_PNPM_PATCH_NOT_APPLIED`) si la versión instalada no coincide exactamente con la apuntada en el parche. Siempre emparejar la versión de las `dependencies` con la del parche eliminando los `^` o `~`.
- **Quirk de Windows CMD / Batch**:
  - En un archivo `.bat`, ejecutar un comando de `pnpm` sin usar `call` (ej. `pnpm --version`) provocará que el script se termine inmediatamente y sin arrojar error, debido a que pnpm es un archivo `.cmd`.
  - Nunca utilizar seteo de variables estilo Unix en los NPM scripts (ej. `NODE_ENV=development tsx...`). Siempre utilizar `cross-env`.
- **Quirk del Servidor de Desarrollo (Vite)**: `tsx watch` junto con la inicialización de `createViteServer` puede quedarse "mudo" en consola por 10-15 segundos durante la primera ejecución. No abortar ni asumir falla sin antes revisar si responde el puerto 3000.
- **Quirk de Autenticación tRPC y Cookies**: Si un usuario tiene un inicio de sesión exitoso ("Success") pero es inmediatamente redirigido de vuelta al login por "Acceso Denegado", la causa raíz siempre suele ser un desajuste entre el nombre de la cookie en la función que lo emite (`res.cookie` en routers) y la función que lo extrae del request (`parse(req.headers.cookie)` en la creación del contexto).
- **Quirk de SQLite UNIQUE**: SQLite es *case-sensitive* por defecto en sus strings. En los esquemas de Zod para endpoints de registro y login, asegurarse siempre de forzar `.trim().toLowerCase()` en emails, de lo contrario SQLite no encontrará coincidencias entre `PABLO@...` y `pablo@...`, lanzando errores confusos de "Credenciales inválidas" pese a que el usuario recién lo haya tipeado.
- **Quirk de SQLite y Literales**: En sentencias SQL de SQLite, usar siempre comillas simples (`'`) para strings literales (ej. `'now'`). Las comillas dobles (`"`) están reservadas para identificadores de base de datos (nombres de tablas o columnas). Escribir `datetime("now", "localtime")` causa que SQLite intente buscar una columna llamada "now" arrojando el error `no such column: "now"`. Usar siempre `datetime('now', 'localtime')`.
---
## 🔴 REGLAS MAESTRAS DE ARQUITECTURA Y CALIDAD (INELUDIBLES)
A partir de este punto del desarrollo, TODOS los desarrollos y refactorizaciones deben respetar rigurosamente:
1. **Bajo Acoplamiento (Low Coupling):** Los componentes de UI (React) NO deben contener lógica de negocio densa ni mezclar responsabilidades de estado, fetching y renderizado complejo.
2. **Principio de Responsabilidad Única (SRP):** Cada archivo, función y componente debe cumplir con UN único objetivo claramente definido. Si una función hace dos o más cosas, DEBE ser dividida.
3. **Cobertura con Unit Tests:** TODO objetivo principal (función pura o regla de negocio) debe estar respaldado por un Unit Test robusto (Vitest). Queda estrictamente prohibido programar lógica sin su respectivo arnés de prueba.
4. **Cero God Classes:** Prohibido crear o expandir componentes React masivos o archivos backend monolíticos. Emplear siempre Patrón Repositorio / Servicios y delegar responsabilidades en hooks o utilidades puras.

### Quirks Conocidos y Soluciones (UI/UX - Radix UI)
- **Radix UI Dialog (shadcn/ui) Scroll Jumps:** Al manejar el estado de los di�logos de manera program�tica (\isModalOpen\, \setModalOpen\) y usar botones desencadenantes que NO son expl�citamente \DialogTrigger\, Radix UI intentar� devolver el foco al �nico \DialogTrigger\ que encuentre en el DOM cuando se cierre el modal. Si ese trigger est� en la parte superior de la p�gina, provocar� un salto repentino del scroll hacia arriba que resulta muy molesto. Para solucionar este 'quirk', siempre agregar \onCloseAutoFocus={(e) => e.preventDefault()}\ al \DialogContent\.

