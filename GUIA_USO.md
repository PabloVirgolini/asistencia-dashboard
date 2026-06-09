# Guía de Uso - Dashboard de Asistencia en Tiempo Real

## Descripción General

El **Dashboard de Asistencia en Tiempo Real** es una aplicación web elegante y sofisticada que permite monitorear la asistencia del personal de forma instantánea. La aplicación consulta datos de una base de datos SQLite y se actualiza automáticamente cada hora para reflejar los cambios en la asistencia.

## Características Principales

### 1. **Resumen del Día**
En la parte superior del dashboard encontrarás tres tarjetas que muestran:
- **Total de Personal**: Cantidad total de empleados activos en el sistema
- **Personas Presentes**: Número de empleados que han fichado (con porcentaje)
- **Personas Ausentes**: Número de empleados sin fichada (con porcentaje)

### 2. **Selector de Fecha**
Permite consultar la asistencia de días anteriores:
- Haz clic en el botón de fecha para abrir un calendario
- Selecciona la fecha deseada
- Usa los botones de navegación (< >) para ir al día anterior o siguiente
- Solo puedes consultar fechas hasta el día actual

### 3. **Filtro por Sector**
Segmenta la vista de asistencia por departamento:
- Haz clic en el dropdown "Todos los sectores"
- Selecciona un sector específico (Termoformado, Limpieza, Depósito, IMPRESORAS, Producción, etc.)
- El dashboard se actualizará automáticamente mostrando solo el personal del sector seleccionado

### 4. **Tabla de Personas Presentes**
Muestra el listado de empleados que han fichado:
- **Nombre**: Nombre completo del empleado
- **Legajo**: Número de legajo o identificación
- **Sector**: Departamento del empleado (con código de color)
- **Hora de Entrada**: Hora exacta de la primera fichada del día

### 5. **Tabla de Personas Ausentes**
Muestra el listado de empleados sin fichada:
- **Nombre**: Nombre completo del empleado
- **Legajo**: Número de legajo o identificación
- **Sector**: Departamento del empleado (con código de color)

### 6. **Actualización Automática**
El dashboard se actualiza automáticamente cada hora:
- En la esquina superior derecha verás el contador "Próxima actualización en X:XX"
- Cuando llega la hora, los datos se refrescan automáticamente sin necesidad de recargar la página
- Puedes actualizar manualmente en cualquier momento haciendo clic en el botón "Actualizar Ahora"

## Indicadores Visuales

### Códigos de Color por Sector
- **Termoformado**: Púrpura
- **Limpieza**: Azul
- **Depósito**: Ámbar
- **IMPRESORAS**: Rosa
- **Producción**: Verde

### Estados
- **Verde**: Personas presentes (fichadas)
- **Rojo**: Personas ausentes (sin fichada)

## Navegación

### Encabezado
- **Título**: "Dashboard de Asistencia"
- **Subtítulo**: "Monitoreo en tiempo real del personal"
- **Próxima actualización**: Contador en tiempo real
- **Actualizar Ahora**: Botón para refrescar datos manualmente

### Controles
- **Selector de Fecha**: Navega entre diferentes días
- **Filtro por Sector**: Segmenta por departamento

## Casos de Uso

### Caso 1: Revisar la asistencia de hoy
1. Abre el dashboard (la fecha de hoy se carga automáticamente)
2. Observa el resumen en las tarjetas principales
3. Revisa las tablas de presentes y ausentes

### Caso 2: Consultar asistencia de un día anterior
1. Haz clic en el selector de fecha
2. Selecciona la fecha deseada del calendario
3. El dashboard se actualizará con los datos de ese día

### Caso 3: Revisar asistencia de un sector específico
1. Abre el dropdown "Todos los sectores"
2. Selecciona el sector que deseas revisar
3. Las tablas mostrarán solo el personal de ese sector

### Caso 4: Actualizar datos manualmente
1. Haz clic en el botón "Actualizar Ahora"
2. El dashboard mostrará un indicador de carga mientras se actualizan los datos
3. Una vez completado, verás los datos más recientes

## Información Técnica

### Fuente de Datos
- **Base de Datos**: SQLite (data2.db)
- **Actualización**: Cada hora automáticamente
- **Sincronización**: En tiempo real con el servidor

### Navegador Compatible
- Chrome/Chromium (recomendado)
- Firefox
- Safari
- Edge

### Requisitos
- Conexión a Internet
- JavaScript habilitado
- Cookies habilitadas para sesión

## Solución de Problemas

### El dashboard no muestra datos
1. Verifica tu conexión a Internet
2. Recarga la página (Ctrl+R o Cmd+R)
3. Limpia el caché del navegador

### La fecha no se actualiza
1. Asegúrate de que la base de datos SQLite esté actualizada
2. Verifica que el servidor esté ejecutándose
3. Intenta actualizar manualmente

### Los datos parecen desactualizados
1. Haz clic en "Actualizar Ahora" para forzar una actualización
2. Espera a que se complete la carga
3. Si el problema persiste, recarga la página

## Contacto y Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Junio 2026  
**Desarrollado con**: React 19, Node.js, Express, tRPC, Tailwind CSS
