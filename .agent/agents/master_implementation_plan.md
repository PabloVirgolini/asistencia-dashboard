# Plan de Implementación Maestro v2.0 - AsistenciaPersonal

Este plan refleja el estado estabilizado del proyecto (Junio 2026) tras la recuperación de la estructura base y la resolución de conflictos en el entorno local (Windows).

## 🚀 Estado Actual (Base Estable)
- **Infraestructura:** El proyecto compila y corre satisfactoriamente. React 19, Vite, tRPC y TailwindCSS configurados.
- **Base de Datos:** SQLite (`data2.db`) conectada y queries operativas vía `better-sqlite3`.
- **Compatibilidad:** Entorno cross-platform configurado con soporte nativo para ejecución local en Windows (`pnpm v10` + `cross-env`).
- **TODO inicial:** 100% completado.

## 🗺️ Hoja de Ruta (Nuevas Fases)

### Fase 0: Refactorización Arquitectónica Urgente (Prioridad Alta)
- **Frontend (`AdminTurnos.tsx`):** Desacoplar el componente de 1200 líneas en sub-componentes UI (`GestionTurnos`, `CreadorReglasForm`, `MatrizHorarios`) e inyectar la carga de datos vía Custom Hooks.
- **Backend (`server/attendance.ts`):** Migrar el archivo monolítico a un Patrón de Servicios por Dominio (`personal.service`, `horarios.service`, `asistencia.service`).
- **Pruebas Unitarias (TDD):** Desarrollar Unit Tests obligatorios (`Vitest`) para cada función pura extraída de la lógica de negocio (ej. `horariosFormatter.test.ts`, `llegadasTarde.test.ts`) como garantía del Principio de Responsabilidad Única.

### Fase 1: Estabilización de Autenticación
- Configurar y sanear la variable `OAUTH_SERVER_URL` detectada como faltante en los logs del servidor.
- Validar el flujo completo de autenticación y sesiones de administrador.

### Fase 2: Expansión de Features Core
En base a los tips acordados, se procederá con la implementación de:
- **Lógica de Turnos y Llegadas Tarde (PENDIENTE):** Revisar y programar la lógica que cruza los horarios de entrada dependiendo del cargo y los días, para determinar con exactitud si un empleado ingresó tarde o no.
- **Historial de Fichadas Individual en Dashboard (PENDIENTE):** Permitir hacer clic sobre una persona en el Dashboard para abrir un modal o vista detallada con su historial completo de entradas y salidas, facilitando la auditoría rápida de cumplimiento de horarios.
- **Motor de Resolución de Inconsistencias (PENDIENTE):** Interfaz para resolver conflictos de fichadas (doble fichadas, errores de marcación en reloj equivocado).
- **Exportación de Datos:** Capacidad de exportar reportes de asistencia en formatos como PDF y Excel.
- **Notificaciones Web Push:** Sistema de alertas en tiempo real cuando algún empleado fiche tarde.
- **Mejoras del Dashboard:** (Cualquier ajuste menor visual derivado de los nuevos features).

### Fase 3: Preparación para Producción
- Configuración estricta del entorno de producción (`NODE_ENV=production`).
- Auditoría final de seguridad por el Security QA Agent.
- Pruebas de carga estáticas y despliegue final.
