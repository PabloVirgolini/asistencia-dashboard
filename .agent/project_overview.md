# Project Overview: AsistenciaPersonal

## 1. Qué problema resuelve el sistema
En entornos industriales y corporativos dinámicos, el seguimiento del presentismo y el cumplimiento de horarios suele ser una tarea manual, propensa a errores y desconectada del reloj biométrico. Cuando hay turnos rotativos, excepciones por empleado y personal que entra a destiempo (ej. turnos nocturnos o fines de semana), la conciliación se vuelve un dolor de cabeza. 

El sistema **AsistenciaPersonal** resuelve este problema al integrarse directamente de forma automática con la base de datos maestra del reloj biométrico. No solo sincroniza las "fichadas", sino que las cruza inteligentemente contra una matriz de reglas de negocio configurables (sectores, cargos, turnos fijos y un planificador semanal para rotativos). De este modo, entrega un Dashboard depurado y en tiempo real que clasifica al personal, alertando de inmediato sobre llegadas tarde, ausencias, y anomalías operativas.

## 2. Quiénes son los usuarios
1. **Recursos Humanos / Administración:** Utilizan el Dashboard como monitor principal para visualizar la planta en tiempo real, identificar qué áreas están desatendidas y gestionar proactivamente las licencias (vacaciones, enfermedad).
2. **Supervisores de Sector / Jefes de Planta:** Consultan el cumplimiento horario de su propia gente, pudiendo auditar el registro de horas, confirmar salidas anticipadas o turnos incompletos.
3. **Administradores del Sistema (IT):** Configuran los parámetros maestros del sistema, manejan roles y supervisan el puente de sincronización con el hardware biométrico.

## 3. Casos de uso principales
- **Monitoreo Dinámico (Dashboard de Presentismo):** Visualizar con actualización automática el estado de toda la planta, agrupando al personal en "Presente", "Ausente", "Llegada Tarde" o con "Licencia".
- **Gestión de Turnos Rotativos (Planificador Semanal):** Asignar masiva y semanalmente a qué turno pertenece cada persona cuyo horario varía periódicamente (ej. Operarios de Producción).
- **Motor de Inconsistencias:** Un sistema asíncrono que detecta eventos anómalos: salidas anticipadas, cantidad impar de fichadas (doble marcación accidental), o marcaciones de personas en su día libre ("Fichada Inesperada").
- **ABM de Novedades y Licencias:** Cargar ausencias justificadas para que el sistema excluya a esa persona de los cálculos de presentismo esperado y evite disparar alertas falsas en el Dashboard.

## 4. Alcance y limitaciones
**Alcance:**
- Sincronización continua, no bloqueante y eficiente (Delta Sync) sobre bases SQLite de relojes externos.
- Interfaz web amigable (React) diseñada con prioridades UX/UI ("Glanceable") para monitores de oficinas de control.
- Resolución de conflictos temporales complejos (Turnos que cruzan la medianoche, márgenes de tolerancia en minutos).
- Paneles integrales para la administración de Reglas Base, Excepciones, Sectores y Cargos.

**Limitaciones:**
- **No es un sistema de control de acceso:** El sistema **no** escribe fichadas, ni abre puertas, ni interactúa bi-direccionalmente con el hardware. La fuente de verdad inmutable es el reloj.
- **No liquida sueldos:** Está diseñado como un "Radar Operativo" y auditor de anomalías, no como un motor de contabilidad para cálculo de horas extras fraccionadas o recibos de sueldo.
- **Roles Centralizados:** Actualmente el enfoque es administrativo/gerencial. No hay un portal de autoservicio para que el operario justifique desde su celular sus propias faltas.

## 5. Arquitectura de alto nivel
El proyecto se compone de un stack de tecnologías modernas y patrones orientados al alto rendimiento:

- **Frontend (React + Vite + TailwindCSS):** Una Single Page Application (SPA) responsiva y rápida. Utiliza hooks custom para aislar la lógica de negocio de los componentes visuales. La comunicación con el backend se realiza mediante `tRPC`, garantizando un tipado fuerte estricto entre cliente y servidor.
- **Backend (Node.js + tRPC + better-sqlite3):** Sirve tanto de API como de Orquestador de Tareas en segundo plano. Contiene las abstracciones complejas de los turnos y procesa las peticiones de forma veloz.
- **Base de Datos (Híbrida y Desacoplada):** 
  - La base `data2.db` concentra tanto los datos operacionales de la web (Sectores, Cargos) como la réplica de fichadas del reloj.
  - El proceso de sincronización extrae únicamente registros nuevos (`MAX(id)`) sin generar bloqueos (`SQLITE_BUSY`).
- **Read Models (Patrón CQRS simplificado):** Para cálculos históricos pesados (como el de Inconsistencias), se delega la carga a scripts asíncronos que cruzan los datos y depositan los resultados finales en tablas dedicadas (ej. `inconsistencias_calculadas`). La interfaz luego simplemente "lee" estos pre-cálculos, garantizando tiempos de respuesta ultrarrápidos para el usuario final.
- **Cruce de Medianoche (Boundary Crossing):** A nivel lógico, el tiempo no se evalúa rígidamente por "Día Calendario" (00:00 a 23:59), sino a través de "Ventanas de Turno". Esto soluciona de raíz la clasificación de los operarios de turno noche, absorbiendo su salida matutina dentro de la ventana lógica del día anterior.
