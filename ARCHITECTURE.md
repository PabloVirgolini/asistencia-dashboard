# Dashboard de Asistencia - Arquitectura y Plan de Desarrollo

## Descripción General

El **Dashboard de Asistencia** es una aplicación web elegante y sofisticada que permite monitorear en tiempo real la asistencia del personal de una organización. La aplicación consulta datos de una base de datos SQLite que se actualiza cada hora, proporcionando una interfaz intuitiva para visualizar quién está presente o ausente.

## Estructura de la Base de Datos

### Tablas Principales

| Tabla | Propósito | Campos Clave |
|-------|-----------|-------------|
| `personal` | Registro de empleados activos | `id`, `legajo`, `nombre`, `activo`, `sectorPertenencia` |
| `fichadas` | Registro de marcaciones de entrada/salida | `nroFichada`, `legajo`, `hora`, `reloj` |
| `sectores` | Catálogo de sectores/departamentos | `idSector`, `descripcion` |
| `turnos` | Asignación de turnos por fecha | `fecha`, `turnoMTD`, `sector` |
| `horarios` | Definición de horarios de trabajo | `id`, `descripcion`, `comentarios` |

### Lógica de Asistencia

- **Presente**: Personal que tiene al menos una fichada registrada en el día consultado
- **Ausente**: Personal activo que NO tiene fichadas en el día consultado
- **Filtrado por Sector**: Se utiliza `personal.sectorPertenencia` para segmentar la vista

## Arquitectura Técnica

### Stack Tecnológico

- **Backend**: Node.js + Express + tRPC (compatible con futuras integraciones Java/AS400)
- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Base de Datos**: SQLite (integración mediante `better-sqlite3`)
- **Autenticación**: Manus OAuth
- **Actualización Automática**: Heartbeat (cron cada 60 minutos)

### Flujo de Datos

```
SQLite (data2.db)
    ↓
Backend Node.js (tRPC procedures)
    ├── getAttendanceByDate(date, sector?)
    ├── getSectors()
    └── getAttendanceSummary(date, sector?)
    ↓
Frontend React
    ├── Dashboard (resumen del día)
    ├── TablaPresentes (personas presentes)
    ├── TablaAusentes (personas ausentes)
    ├── FiltroSector (segmentación)
    └── SelectorFecha (consulta histórica)
    ↓
Actualización Automática (cada 60 minutos)
```

## Funcionalidades Implementadas

### 1. Dashboard Principal
- Resumen visual con métricas clave:
  - Total de personal activo
  - Cantidad de presentes (con porcentaje)
  - Cantidad de ausentes (con porcentaje)
- Indicadores visuales con colores diferenciados
- Fecha seleccionada visible en el encabezado

### 2. Tabla de Presentes
- Columnas: Nombre, Legajo, Sector, Hora de Primera Fichada
- Ordenamiento por hora de entrada
- Indicador visual de estado (verde/presente)
- Búsqueda y filtrado integrado

### 3. Tabla de Ausentes
- Columnas: Nombre, Legajo, Sector
- Indicador visual de estado (rojo/ausente)
- Ordenamiento alfabético

### 4. Filtro por Sector
- Dropdown con lista de sectores disponibles
- Opción "Todos los sectores"
- Actualización dinámica de ambas tablas
- Persistencia de selección en sesión

### 5. Selector de Fecha
- Calendario interactivo
- Consulta de datos históricos
- Validación de fechas disponibles
- Formato: DD/MM/YYYY

### 6. Actualización Automática
- Refresco cada 60 minutos sin intervención del usuario
- Indicador visual de próxima actualización
- Notificación silenciosa al actualizar
- Sincronización con servidor

### 7. Indicadores Visuales
- **Presente**: Fondo verde claro, icono de check
- **Ausente**: Fondo rojo claro, icono de X
- **Sector**: Badge con color de acento
- **Hora**: Formato HH:MM

## Diseño Visual

### Paleta de Colores
- **Fondo Principal**: Blanco/Gris muy claro (#F9FAFB)
- **Presente**: Verde sofisticado (#10B981)
- **Ausente**: Rojo sofisticado (#EF4444)
- **Texto Principal**: Gris oscuro (#1F2937)
- **Bordes**: Gris muy claro (#E5E7EB)
- **Acentos**: Azul profesional (#3B82F6)

### Tipografía
- **Familia**: Inter (sans-serif)
- **Títulos**: 24px, peso 700
- **Subtítulos**: 16px, peso 600
- **Cuerpo**: 14px, peso 400
- **Etiquetas**: 12px, peso 500

### Espaciado
- Margen superior: 32px
- Margen lateral: 24px
- Espaciado entre secciones: 24px
- Espaciado interno de componentes: 16px
- Padding de tablas: 12px

## Fases de Implementación

### Fase 1: Integración de Base de Datos
- Copiar `data2.db` al directorio del proyecto
- Instalar `better-sqlite3`
- Crear helpers de consulta en `server/db.ts`
- Implementar queries para obtener presentes/ausentes

### Fase 2: Backend (tRPC)
- Crear procedimientos tRPC:
  - `attendance.getByDate(date, sector?)`
  - `attendance.getSectors()`
  - `attendance.getSummary(date, sector?)`
- Validación de fechas y sectores
- Manejo de errores

### Fase 3: Frontend - Estructura Base
- Crear layout principal con DashboardLayout
- Componentes base: Dashboard, TablaPresentes, TablaAusentes
- Integración con tRPC hooks
- Estados de carga y error

### Fase 4: Componentes Visuales
- Diseño sofisticado de tarjetas de resumen
- Tablas con estilos refinados
- Filtro por sector (dropdown)
- Selector de fecha (calendario)
- Indicadores visuales

### Fase 5: Actualización Automática
- Configurar Heartbeat para ejecutar cada 60 minutos
- Implementar polling en frontend (opcional)
- Indicador de próxima actualización
- Sincronización de estado

### Fase 6: Pruebas y Optimización
- Tests unitarios con Vitest
- Pruebas de rendimiento
- Validación de diseño responsivo
- Optimización de consultas SQL

## Consideraciones Técnicas

### Rendimiento
- Las consultas a SQLite se cachean por 5 minutos
- Índices en `fichadas.legajo` y `fichadas.hora` para optimizar búsquedas
- Paginación opcional para listas grandes

### Seguridad
- Validación de fechas de entrada
- Sanitización de parámetros de sector
- Autenticación requerida para acceso al dashboard
- No se exponen datos sensibles en logs

### Escalabilidad
- Arquitectura preparada para migración a MySQL/PostgreSQL
- Procedimientos tRPC reutilizables
- Componentes React modulares y reutilizables

## Próximas Fases (Futuro)

- Integración con sistemas ERP (AS400)
- Exportación de reportes (PDF, Excel)
- Gráficos de asistencia histórica
- Alertas por ausencias recurrentes
- Integración con sistema de permisos
- API REST para terceros

---

**Versión**: 1.0  
**Última actualización**: 2026-06-08  
**Estado**: En desarrollo
