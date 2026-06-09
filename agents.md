# Registro de Agentes - AsistenciaPersonal

Este documento sirve como el directorio central (Knowledge Base) de todos los agentes especialistas disponibles para el proyecto "AsistenciaPersonal", definiendo sus capacidades y en qué etapa del flujo de trabajo deben invocarse.
Para mantener la calidad y el enfoque, el conocimiento del sistema se ha fragmentado en instrucciones para agentes especializados en la carpeta `agents/`. Cualquier IA que colabore en este proyecto debe leer estas guías antes de realizar cambios profundos:

**Regla de Continuidad Breve**: Cada vez que se realice un cambio relevante de lógica de negocio, agregar una entrada corta en `agents/journal.md`. Las modificaciones en tests, diario, sugerencias o estados no requieren una nueva entrada ni se consideran cambios de negocio.

**Regla de Aprendizaje Continuo**: Cada vez que una IA resuelva un problema técnico particular, descubra un "quirk" arquitectónico o aprenda una nueva regla estricta sobre una tecnología, debe actualizar el archivo del agente correspondiente para que el conocimiento quede documentado de manera permanente. Esto solo aplica al finalizar cambios mayores de código de negocio, no tras simples consultas.

**Regla de Sostenibilidad y Colaboración**: Mantener actualizados los documentos agents.md y project_journal.md con las decisiones de diseño, cambios arquitectónicos y lecciones aprendidas. Esto es crucial para la sostenibilidad del proyecto y la colaboración efectiva.

**Regla de Planificación y Cierre de Tareas**: Cada vez que se complete la resolución de un problema o se realice un push de código, el agente **debe revisar obligatoriamente el archivo `agents/master_implementation_plan.md`** junto con el usuario. Este archivo contiene la hoja de ruta oficial y el backlog de features y deudas técnicas. Revisarlo asegura saber exactamente por dónde seguir avanzando.

**Regla Anti-Bucles e Interacciones Puntuales (CRÍTICA)**:
1. **Consultas Puntuales e Investigativas**: Si el usuario realiza una pregunta informativa (ej. cómo funciona algo, consultar el estado de una tarea, o preguntas directas puntuales), la IA **debe responder directamente** de forma concisa. **No** debe iniciar revisiones de seguridad, ni ejecutar análisis de QA, ni actualizar el diario de proyectos o estados.
2. **Prevención de Bucles de Auto-Revisión**:  Los agentes **no deben autoejecutarse de forma repetitiva ni en bucles demasiado extendidos** (entiéndase 3 bucles) sin retroalimentación por parte del usuario. La actualización de archivos de bitácora (`security_suggestions.md`, `journal.md`, `security_qa_state.json`) **nunca** debe considerarse un cambio que dispare una nueva revisión automática. Las revisiones de QA y de seguridad solo se corren ante cambios reales, un máximo de una vez al finalizar el trabajo y antes de devolver el control al usuario, o bien cuando el usuario lo solicite expresamente.


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
- **Cuándo usarlo:** Al diseñar nuevos componentes React, o cuando se detecte que la interfaz está perdiendo el estándar de calidad visual requerido por el proyecto.
- **Rol:** Garantizar que el dashboard se mantenga sumamente estético, intuitivo y responsivo ("Premium"). Vigila el uso de la paleta (Verde/Rojo para presentes/ausentes) y la implementación de micro-animaciones elegantes.

---

## Flujo de Trabajo y Sostenibilidad
Siempre que se deba llevar a cabo una tarea, se adoptará temporalmente el rol del agente correspondiente (o se delegará si estuviésemos en un entorno multi-agente) para asegurar el enfoque de calidad exigido. Todos los progresos transversales y aprendizajes deberán seguir documentándose activamente en `agents/journal.md`.




