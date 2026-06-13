# Architecture Decision Record (ADR) - AsistenciaPersonal

## 1. Visión General
Este documento sirve como registro formal de las decisiones arquitectónicas (Architecture Decision Record) tomadas durante el ciclo de vida del proyecto "AsistenciaPersonal". El objetivo es documentar el *por qué* detrás de cada elección técnica, proporcionando contexto para el presente y certidumbre para el futuro desarrollo.

## 2. Estructura del Directorio y Componentes del Sistema
El proyecto está estructurado con una arquitectura desacoplada y fuertemente tipada a través de **tRPC**, utilizando **React 19** en el frontend y **Node.js** con **SQLite** en el backend:

```
asistencia-dashboard/
├── client/                     # Frontend (React 19 + Vite + Vanilla CSS)
│   ├── src/
│   │   ├── _core/              # Hooks del núcleo (useAuth)
│   │   ├── components/         # Componentes visuales organizados por dominio
│   │   ├── contexts/           # Proveedores de estado global (Tema, etc.)
│   │   ├── hooks/              # Custom Hooks para lógica de datos (Obligatorios)
│   │   ├── pages/              # Vistas principales y Tabs de Administración
│   │   └── index.css           # Estilos del sistema de diseño
├── server/                     # Backend (Node.js + Express + tRPC + better-sqlite3)
│   ├── _core/                  # Servicios transversales (AI LLM, Heartbeat, Env)
│   ├── db/                     # Conexión, schemas y migraciones SQLite (data2.db)
│   ├── routers/                # Endpoints tRPC organizados (attendance, auth, admin)
│   └── services/               # Lógica de negocio (asistencia, horarios, planificador)
└── shared/                     # Tipos y utilidades compartidos entre front y back
```

### Detalle de las Capas

*   **Capa de Backend (`server/`):**
    *   **Servicio de Asistencia (`asistencia.service.ts`):** Mapea y calcula en tiempo real si el empleado está "Presente", "Ausente", "Tarde" o con "Licencia". Implementa la lógica de *cruce de medianoche* (ventanas flotantes en lugar de días calendario rígidos para turnos nocturnos).
    *   **Worker de Sincronización (`sync.service.ts`):** Realiza un copiado incremental (*Delta Sync*) de las fichadas del reloj biométrico (alojado en un disco de red) hacia la base local `data2.db` utilizando `ATTACH DATABASE` para evitar bloqueos del sistema.
    *   **Motor de Inconsistencias (`inconsistencias.service.ts`):** Procesa de forma asíncrona anomalías operativas (cantidades impares de marcaciones, fichadas inesperadas) y las deposita en un *Read Model* precalculado (`inconsistencias_calculadas`) para garantizar respuestas ultrarrápidas en la interfaz web.
    *   **Rutas tRPC (`server/routers/`):** Endpoints fuertemente tipados que gestionan las entidades maestras (`personal`, `sectores`, `horarios`, `novedades/licencias` y el `planificador`).

*   **Capa de Frontend (`client/`):**
    *   **Componentes de la Interfaz (`client/src/components/`):** `DashboardLayout` (sidebar, sidebar footer y heartbeat), `planificador/` (grilla de turnos rotativos), `novedades/` (licencias) y `AIChatBox` (Floating Copilot).
    *   **Aislamiento de Lógica (Custom Hooks):** Para cumplir con las reglas del proyecto, la UI no consume tRPC directamente. Toda la comunicación está encapsulada en hooks como `useAttendanceDashboard.ts`, `usePlanificadorSemanal.ts` y hooks dedicados para cada pestaña de administración (`useTabPersonal.ts`, etc.).

## 3. Componentes y Responsabilidades
El sistema sigue una arquitectura cliente-servidor estrictamente separada:

- **Frontend (React SPA):**
  - **Responsabilidad:** Renderizado visual, interacciones de usuario y manejo del estado local de la sesión.
  - **Patrón:** "Dumb Components" y "Smart Hooks". La lógica de negocio densa, el data-fetching y la manipulación de estados asíncronos se delegan completamente a Custom Hooks aislados. Esto mantiene a las vistas (UI) puramente enfocadas en la presentación.
- **Backend (Node.js API):**
  - **Responsabilidad:** Ejecución de reglas de negocio (Cálculo de llegadas tarde, cruces de turnos, validación de licencias), seguridad, orquestación de tareas en segundo plano y persistencia de datos.
  - **Patrón:** Arquitectura en capas (Routers -> Services -> Base de Datos).

## 4. Decisiones Técnicas Clave

### 4.1. Arquitectura Desacoplada (Decoupled Architecture)
- **Decisión:** Mantener una barrera sanitaria estricta entre la lógica de UI y la lógica de acceso a datos en React.
- **Motivación:** Garantizar la absoluta "testabilidad" del frontend. Al extraer la lógica `tRPC` a Custom Hooks, el agente de **QA Specialist** puede realizar Unit Tests de los componentes aislando y mockeando la red en milisegundos, sin depender de que el backend o la base de datos SQLite real estén levantados.

### 4.2. Sincronización de Datos Inmutable (Delta Sync)
- **Decisión:** La tabla de `fichadas` que consume el sistema es una réplica de solo lectura. El proceso de sincronización extrae únicamente registros nuevos usando `MAX(id_local)`.
- **Motivación:** Eludir bloqueos destructivos (`SQLITE_BUSY`) y evitar colisiones de concurrencia entre la escritura masiva del hardware biométrico y las consultas simultáneas del panel web.

### 4.3. Motores Asíncronos (Read Models)
- **Decisión:** Los cálculos históricos pesados (ej. Inconsistencias, faltas, llegadas tarde retrospectivas) NO se realizan dinámicamente cuando el usuario carga la web. Un motor asíncrono cruza los datos fuera de línea y deposita el resultado final en la tabla `inconsistencias_calculadas`.
- **Motivación:** Mantener las respuestas de la API en el orden de unos pocos milisegundos. El frontend actúa como un mero espectador de un "Read Model" ya digerido (Patrón derivado de CQRS).

### 4.4. Manejo del Tiempo: "Ventanas de Turno" vs "Días Calendario"
- **Decisión:** Implementación lógica del concepto de `Ventana de Turno` (Boundary Crossing) que amplía el alcance temporal de un turno desde su inicio teórico restando y sumando horas de tolerancia.
- **Motivación:** Solucionar algorítmicamente el problema clásico de los turnos nocturnos, permitiendo que una salida a las 06:00 AM del viernes sea "absorbida" por el turno iniciado el jueves a la noche, en lugar de ser catalogada como una "fichada inesperada" del viernes.

### 4.5. Soporte Nativo para Enroques (Solapamiento y Prioridad)
- **Decisión:** Soportar "Enroques" o excepciones de 1 día permitiendo intencionalmente el solapamiento de registros en la tabla `historial_turnos`. La resolución de qué turno aplica para un día determinado se delega puramente al motor de base de datos usando el criterio del "rango más corto gana" mediante `ORDER BY (julianday(COALESCE(fecha_fin, '2099-12-31')) - julianday(fecha_inicio)) DESC`.
- **Motivación:** Evita tener que dividir o fragmentar un plan de "Toda la semana" en múltiples registros (Ej. Lunes-Martes, Jueves-Viernes) solo porque el Miércoles hay una excepción. Facilita enormemente la UI y mantiene la base de datos atómica.
- **Consecuencia de Diseño (Stale Data Cache):** Debido a que la vista (UI) y las insignias de inconsistencia provienen de motores separados, una reasignación de enroque debe estar obligatoriamente acoplada a una **invalidación de caché (Recálculo)** inmediata en segundo plano para evitar desincronizaciones visuales.

## 5. Tecnologías Elegidas
- **Frontend:** React, Vite (Bundler hiper-rápido que mejora la experiencia de desarrollo), TailwindCSS (Estilado utilitario para mantener consistencia UI), tRPC-React.
- **Backend:** Node.js, tRPC (Elegido para lograr *Type Safety* de extremo a extremo sin lidiar con generación manual de clientes REST o Swagger), `better-sqlite3` (Librería síncrona elegida expresamente por ser el driver de mayor rendimiento para SQLite en Node).
- **Testing:** Vitest (Por su extraordinaria rapidez y API compatible casi al 100% con Jest).

## 6. Integraciones
- **Relojes Biométricos y Control de Acceso:** Integración directa a nivel de archivo SQLite (`data2.db`). El sistema lee tablas externas como única fuente de verdad inmutable para el presentismo, evitando middlewares frágiles.

## 7. Ecosistema de Agentes y Roles
Para el mantenimiento y la evolución limpia de la arquitectura, el equipo cuenta con una estructura multi-agente centralizada (documentada en `.agent/agents/`). Cada agente vigila una responsabilidad específica y colabora en el ecosistema:

1. **Analista de Sistemas (Systems Analyst):** Piensa a nivel arquitectónico. Previene cuellos de botella en la base de datos, diseña estructuras lógicas (como los Read Models y el "Cruce de Medianoche") y custodia el flujo de información para que no haya inconsistencias transaccionales.
2. **Especialista de QA (QA Specialist):** Responsable de la confiabilidad. Su misión es garantizar que el código fuertemente desacoplado se mantenga funcional tras cualquier cambio, mediante la creación de arneses de pruebas en Vitest simulando fallos de red y manipulando hooks.
3. **Agente Asistente (Debugging Specialist):** El cazador de bugs. Interviene analizando logs y corrigiendo excepciones en React/Node.js si el entorno de desarrollo local colapsa o un endpoint falla.
4. **Agente de Estilos (UI/UX Stylist):** El guardián de la interfaz. Garantiza que la plataforma no decaiga hacia un aspecto de "prototipo", forzando el uso de paletas semánticas consistentes, micro-animaciones y asegurando la usabilidad (Principio *"No me harás pensar"*).
5. **Auditor de Seguridad (Security QA):** Revisa pasivamente el código tras cambios sustanciales buscando vulnerabilidades como inyección SQL o fugas de tokens, proponiendo blindajes en la arquitectura.

---
*Este documento (ADR) es un registro vivo y colaborativo. Todo miembro (o agente) debe actualizar este registro frente a cualquier pivote arquitectónico o la incorporación de una tecnología sustancial al stack.*
