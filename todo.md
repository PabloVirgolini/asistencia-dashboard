# Dashboard de Asistencia - TODO

## Fase 1: Integración de Base de Datos
- [x] Copiar data2.db al directorio del proyecto
- [x] Instalar dependencia better-sqlite3
- [x] Crear helpers de consulta en server/attendance.ts
- [x] Implementar query para obtener personal activo
- [x] Implementar query para obtener fichadas del día
- [x] Implementar query para obtener sectores
- [x] Implementar query para obtener presentes/ausentes

## Fase 2: Backend (tRPC)
- [x] Crear procedimiento attendance.getByDate(date, sector?)
- [x] Crear procedimiento attendance.getSectors()
- [x] Crear procedimiento attendance.getSummary(date, sector?)
- [x] Validar fechas de entrada
- [x] Sanitizar parámetros de sector
- [x] Implementar manejo de errores

## Fase 3: Frontend - Estructura Base
- [x] Crear componente AttendanceDashboard
- [x] Crear componente TablaPresentes
- [x] Crear componente TablaAusentes
- [x] Crear componente ResumenDia
- [x] Integrar con tRPC hooks
- [x] Implementar estados de carga
- [x] Implementar estados de error

## Fase 4: Componentes Visuales
- [x] Diseñar tarjetas de resumen (total, presentes, ausentes)
- [x] Implementar tabla de presentes con estilos refinados
- [x] Implementar tabla de ausentes con estilos refinados
- [x] Crear filtro por sector (dropdown)
- [x] Crear selector de fecha (calendario)
- [x] Implementar indicadores visuales (colores, iconos)
- [x] Aplicar paleta de colores sofisticada
- [x] Validar tipografía y espaciado

## Fase 5: Actualización Automática
- [x] Configurar Heartbeat para ejecutar cada 60 minutos
- [x] Implementar lógica de invalidación de caché
- [x] Crear indicador de próxima actualización
- [x] Implementar notificación silenciosa al actualizar
- [x] Sincronizar estado entre clientes

## Fase 6: Pruebas y Optimización
- [x] Escribir tests unitarios para queries
- [x] Escribir tests para procedimientos tRPC
- [x] Escribir tests para componentes React
- [x] Pruebas de rendimiento
- [x] Validar diseño responsivo (mobile, tablet, desktop)
- [x] Optimizar consultas SQL
- [x] Revisar y optimizar bundle size

## Fase 7: Entrega y Documentación
- [x] Crear checkpoint inicial
- [x] Documentar instrucciones de uso
- [x] Crear guía de administrador
- [x] Validar todas las funcionalidades
- [x] Preparar para producción

## Fase 8: Lógica Avanzada de Turnos (Pendiente)
- [ ] Analizar estructura de la base de datos para mapear turnos y horarios de entrada.
- [ ] Implementar cruce de cargos, horarios y días para determinar si la fichada representa una llegada tarde.
- [ ] Reflejar visualmente en el Dashboard el estado de tardanza de cada persona.
