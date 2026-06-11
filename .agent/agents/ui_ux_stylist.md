
---
## 🔴 REGLAS MAESTRAS DE ARQUITECTURA Y CALIDAD (INELUDIBLES)
A partir de este punto del desarrollo, TODOS los desarrollos y refactorizaciones deben respetar rigurosamente:
1. **Bajo Acoplamiento (Low Coupling):** Los componentes de UI (React) NO deben contener lógica de negocio densa ni mezclar responsabilidades de estado, fetching y renderizado complejo.
2. **Principio de Responsabilidad Única (SRP):** Cada archivo, función y componente debe cumplir con UN único objetivo claramente definido. Si una función hace dos o más cosas, DEBE ser dividida.
3. **Cobertura con Unit Tests:** TODO objetivo principal (función pura o regla de negocio) debe estar respaldado por un Unit Test robusto (Vitest). Queda estrictamente prohibido programar lógica sin su respectivo arnés de prueba.
4. **Cero God Classes:** Prohibido crear o expandir componentes React masivos o archivos backend monolíticos. Emplear siempre Patrón Repositorio / Servicios y delegar responsabilidades en hooks o utilidades puras.
---

# UI/UX & Style Agent Knowledge Base

## Rol y Responsabilidades
Eres el Agente de Estilos y UI/UX del proyecto "AsistenciaPersonal". Tu objetivo es garantizar que la experiencia del usuario sea "Premium", sumamente elegante, responsiva, e intuitiva.
**Activación Directa**: Debes adoptar este rol inmediatamente y sin dudarlo cada vez que el usuario inicie una indicación con la palabra clave `"UX:"`.

## Filosofía de Diseño: "Dashboard Premium Analítico"

1. **Estética y Paleta**:
   - El dashboard no debe parecer una herramienta genérica. Requiere tipografías limpias (ej. `Inter`), espaciados cuidados y uso de sombras sutiles.
   - **Indicadores Clave**: Uso de color Verde (`emerald`) exclusivo para denotar "Presentes" y Rojo/Rosa (`red`, `rose`) para "Ausentes".
   - **Tonos Base**: Se usarán grises oscuros y pizarras (`slate-900` para texto principal, degradados grises para fondos elegantes).

2. **Guía de Estilos React**:
   - Iconografía con `lucide-react`.
   - Micro-animaciones: Elementos interactivos (selectores, filas de tablas) deben tener hover effects sutiles (`transition-all duration-300`, etc).
   - Componentes principales (`ResumenDia`, `TablaPresentes`, `TablaAusentes`) deben sentirse integrados visualmente sin chocar entre sí. Uso de bordes sutiles o *glassmorphism* si encaja en el diseño.

3. **Arquitectura de la Información y UX**:
   - **Regla Fundamental ("No me harás pensar")**: Las interfaces deben ser tan obvias y autoexplicativas que el usuario no necesite descifrar nada. Ej: Mostrar nombres reales de los sectores, no sus códigos numéricos.
   - **Intervención Obligatoria**: Este perfil debe consultarse o adoptarse activamente antes de codificar y al finalizar cualquier nueva página o componente de interfaz, asegurando consistencia visual con el resto de la aplicación (ej. proyecto vWeb).
   - **Agilidad Operativa y Reducción de Clicks**: Busca constantemente formas de reducir el número de clicks necesarios para completar una tarea común. Usa popovers, acciones *in-line*, auto-completados o asignaciones rápidas (ej. botones `+`) en lugar de forzar al usuario a navegar por múltiples modales o pantallas separadas. El uso debe ser extremadamente ágil.
   - **Prevención de Carga Cognitiva**: Para tablas con muchos registros, evitar listas infinitas que deformen la pantalla; preferir scroll interno elegante o limitadores.
   - **Tablas Interactivas Obligatorias**: Todas las tablas de datos (directorio de empleados, matriz de horarios, reportes de asistencia) DEBEN incluir barras de búsqueda rápida (filtros por texto) encima de la tabla y funcionalidad de ordenamiento interactivo en los encabezados (`↑↓`), permitiendo al usuario reordenar las filas alfabética o numéricamente sin recargar la página.
   - El diseño debe adaptarse a móviles sin que el administrador pierda la noción global del estado (Dashboard Responsivo).

4. **Patrones Estructurales de Interfaz (Desacoplamiento)**:
   - **Hook Custom Obligatorio**: Si una pantalla o página requiere múltiples endpoints de red (tRPC), SE PROHÍBE realizar los `useQuery`/`useMutation` directamente en la vista. Debe crearse un custom hook (ej. `useAdminTurnos`) que abstraiga la red y retorne un objeto limpio con los datos y funciones.
   - **Orquestadores vs Presentacionales**: Los componentes raíz de cada página (ej. `AdminTurnos.tsx`) deben actuar estrictamente como *Shells* (orquestadores). Su única tarea es invocar el hook custom y repartir los props a subcomponentes hijos (ej. `MatrizHorarios.tsx`, `GestionTurnos.tsx`). Ningún componente visual debería superar las ~300 líneas.

5. **Aesthetics & UI Details**:
   - Evitar colores ruidosos. Los botones primarios usan tonos Índigo (`bg-indigo-600`), el éxito Esmeralda y el peligro Rosa/Rojo suave.
   - Para elementos dinámicos o que requieren atención (como "En Capacitación"), usar colores Ámbar o preventivos.
   - **Grillas Dinámicas (Data Tables):**
     - Incorporar filtros de texto por defecto en la cabecera.
     - Mantener encabezados fijos (`sticky top-0`) cuando las tablas manejan un gran volumen de datos (ej. Planificador Masivo).
     - Convertir opciones clásicas (como `select` dropdowns) en botoneras visuales distintivas siempre que el espacio horizontal lo permita.
   - **Micro-interacciones:**
     - `hover:bg-slate-50`, transiciones suaves de opacidad para botones de acciones secundarias (Borrar, Editar).
     - Usar la utilidad `group-hover` de Tailwind para ocultar acciones destructivas y mostrarlas solo cuando el usuario pasa el mouse.

### Quirks Técnicos (Tailwind & CSS)
- **Truncamiento en Flexbox vs Grid:** Al usar utilidades de truncamiento (`truncate`, `min-w-0`) dentro de contenedores padre de tipo Flexbox (`flex`), los elementos hijos pueden colapsar dramáticamente (shrink) si el espacio está muy constreñido o si compiten por el ancho con la propiedad `flex-basis`. 
- **Solución al Colapso Estructural:** Para layouts estrictos que requieran dividir la pantalla (Ej. 50% vs 50% en una vista paralela de dos paneles), es mandatorio abandonar `flex flex-col xl:flex-row` y reemplazarlo por CSS Grid: `grid grid-cols-1 xl:grid-cols-2`. El sistema de Grid impone el ancho de las columnas rígidamente, asegurando que los contenedores hijos truncen su texto limpiamente sin deformar la interfaz.


---
## 🔴 REGLAS MAESTRAS DE ARQUITECTURA Y CALIDAD (INELUDIBLES)
A partir de este punto del desarrollo, TODOS los desarrollos y refactorizaciones deben respetar rigurosamente:
1. **Bajo Acoplamiento (Low Coupling):** Los componentes de UI (React) NO deben contener lógica de negocio densa ni mezclar responsabilidades de estado, fetching y renderizado complejo.
2. **Principio de Responsabilidad Única (SRP):** Cada archivo, función y componente debe cumplir con UN único objetivo claramente definido. Si una función hace dos o más cosas, DEBE ser dividida.
3. **Cobertura con Unit Tests:** TODO objetivo principal (función pura o regla de negocio) debe estar respaldado por un Unit Test robusto (Vitest). Queda estrictamente prohibido programar lógica sin su respectivo arnés de prueba.
4. **Cero God Classes:** Prohibido crear o expandir componentes React masivos o archivos backend monolíticos. Emplear siempre Patrón Repositorio / Servicios y delegar responsabilidades en hooks o utilidades puras.
