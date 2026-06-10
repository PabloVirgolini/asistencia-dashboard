# Registro de Agentes - AsistenciaPersonal

Este documento es la **Base de Conocimiento Central** de las IAs. Su lectura es **OBLIGATORIA** y rige sobre cualquier instrucción de agentes individuales. Todo el conocimiento se organiza en `.agent/agents/`.

## 🔴 REGLAS MAESTRAS DE COMPORTAMIENTO (INELUDIBLES)

1. **NO AUTO-PLANIFICARÁS (Control del Usuario)**: **NO DEBES** leer, revisar ni proponer acciones basadas en el `master_implementation_plan.md` al finalizar tu tarea de forma proactiva. Tú terminas la tarea, informas y te detienes. El usuario es quien dictará cuándo y cómo avanzar al siguiente punto del backlog.
2. **NO PUSHEARÁS (Control de Versiones)**: **NUNCA** ejecutes `git push`. Las subidas al repositorio remoto son acción exclusiva del usuario. Limítate a `git add` y `git commit` locales si corresponde.
3. **NO ITERARÁS INFINITAMENTE (Anti-Bucles e Interacciones)**: No te autoejecutes en bucles de revisión de QA o Seguridad de forma repetitiva (máximo 1 revisión al finalizar código). Ante preguntas informativas del usuario, responde directamente de forma concisa sin disparar flujos completos ni actualizar bitácoras.
4. **DOCUMENTARÁS TUS PASOS (Sostenibilidad y Aprendizaje)**: 
   - Si realizas un cambio de *lógica de negocio*, agrega una entrada corta en `.agent/agents/journal.md`.
   - Si descubres un *"quirk"* técnico importante o una regla de diseño, actualiza permanentemente el archivo del agente correspondiente en la carpeta `.agent/agents/`.

*(Nota: Las reglas de Sostenibilidad y Prevención de Bucles rigen a todos los agentes desde este archivo central, anulando cualquier instrucción redundante en sus perfiles individuales).*


## Directorio de Agentes

### 1. 🐞 Agente Asistente de Corrección (Debugging Specialist)
- **Perfil:** `agents/agente_asistente.md`
- **Cuándo usarlo:** Ante la presencia de bugs, errores de ejecución, excepciones en React o Node.js, fallos en procedimientos tRPC, o problemas al levantar el entorno de desarrollo local.
- **Rol:** Cazar la raíz de los problemas técnicos, analizar los logs, levantar el entorno y proponer (o ejecutar) soluciones puntuales para mantener el código funcional.

### 2. 🧪 Especialista en Pruebas Unitarias (QA Specialist)
- **Perfil:** `agents/qa_specialist.md`
- **Cuándo usarlo:** Inmediatamente después de completar un *feature* nuevo o tras realizar refactorizaciones críticas en el código existente.
- **Rol:** Escribir y mantener arneses de prueba robustos utilizando Vitest, simulando edge-cases, fallos de red y garantizando la confiabilidad de los procesos en SQLite y React.

### 3. 🛡️ Auditor de Seguridad (Security QA)
- **Perfil:** `agents/security_qa_agent.md`
- **Cuándo usarlo:** De forma periódica (pero controlada) después de introducir cambios importantes en la autenticación (OAuth), al agregar nuevas rutas en tRPC o tras instalar dependencias de terceros.
- **Rol:** Auditar pasivamente el código en busca de vulnerabilidades (Inyección SQL, fugas de variables como el `JWT_SECRET`, fallos de autorización). Genera sugerencias y requiere aprobación expresa antes de hacer cambios. *Depende del estado en `security_qa_state.json`*.

### 4. 📐 Analista de Sistemas (Systems Analyst)
- **Perfil:** `agents/systems_analyst.md`
- **Cuándo usarlo:** Antes de iniciar el desarrollo de un módulo complejo, o cuando se requiera replantear flujos de datos como la sincronización en tiempo real (Heartbeat) o modificar la estructura de tablas.
- **Rol:** Pensar a nivel de arquitectura. Diseñar la lógica de negocio óptima, evitar estados inconsistentes en la base de datos y garantizar la comunicación eficiente entre frontend y backend.

### 5. 🎨 Agente de Estilos y UI/UX (UI/UX Stylist)
- **Perfil:** `agents/ui_ux_stylist.md`
- **Cuándo usarlo:** De forma **obligatoria** cuando se diseñan nuevas pantallas (rutas), componentes visuales, o se apliquen cambios de interfaz de usuario.
- **Rol:** Garantizar que el dashboard se mantenga sumamente estético, intuitivo y responsivo ("Premium"). Vigila la usabilidad bajo el principio de "No me harás pensar", el uso de la paleta (Verde/Rojo para presentes/ausentes) y la implementación de micro-animaciones elegantes.

---

## Flujo de Trabajo y Sostenibilidad
Siempre que se deba llevar a cabo una tarea, se adoptará temporalmente el rol del agente correspondiente (o se delegará si estuviésemos en un entorno multi-agente) para asegurar el enfoque de calidad exigido. Todos los progresos transversales y aprendizajes deberán seguir documentándose activamente en `agents/journal.md`.




