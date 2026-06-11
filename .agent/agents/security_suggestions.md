# Bitácora de Sugerencias de Seguridad

### SEC-20260610-001 - Validación de control de acceso en Capa de Servicios
- Estado: Pendiente de decisión
- Severidad: Informativa
- Archivo(s): `server/services/admin.service.ts`, `horarios.service.ts`, `personal.service.ts`
- Evidencia: La nueva arquitectura delegó la lógica a los servicios. Las funciones de mutación como `insertPersonal` o `duplicateSectorRules` no realizan aserciones de autorización ni verifican el rol del llamador, y los parámetros de auditoría (`adminName`) tienen valor por defecto `'Sistema'`.
- Riesgo: Si en la capa de Routers (`trpc`) no se asegura estrictamente el uso de `adminProcedure`, cualquier usuario podría ejecutar mutaciones críticas llamando inadvertidamente a las funciones expuestas del servicio.
- Sugerencia: Asegurar que todos los procedimientos en `server/routers.ts` (capa de controladores) que llaman a estos servicios hagan uso correcto de `adminProcedure`. Considerar requerir siempre el `adminName` de un token JWT válido y quitar los defaults de `'Sistema'` para forzar la auditoría.
- Requiere aprobación del usuario: Sí

### SEC-20260610-002 - Evaluación de Inyección SQL en nuevos Servicios
- Estado: Pendiente de decisión
- Severidad: Informativa
- Archivo(s): `server/services/*.ts`
- Evidencia: Las consultas a la base de datos están correctamente parametrizadas empleando prepared statements con bindings de SQLite (`?`) y `db.prepare()`. La concatenación de strings solo ocurre para ensamblar fragmentos de consulta de forma segura.
- Riesgo: Ningún riesgo inmediato de SQL Injection.
- Sugerencia: Mantener esta práctica y usar validadores Zod rigurosos para validar los tipos de entrada en la capa de routers (como el formato de las fechas y números).
- Requiere aprobación del usuario: No
