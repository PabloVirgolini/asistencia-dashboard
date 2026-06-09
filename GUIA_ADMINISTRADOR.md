# Guía de Administrador - Dashboard de Asistencia

## Descripción General

Esta guía proporciona información técnica y administrativa para gestionar el Dashboard de Asistencia en Tiempo Real. Incluye instrucciones de instalación, configuración, mantenimiento y solución de problemas.

## Requisitos del Sistema

### Hardware Mínimo
- Procesador: 1 vCPU
- Memoria RAM: 512 MB
- Almacenamiento: 100 MB (sin contar la base de datos)

### Software Requerido
- Node.js 22.13.0 o superior
- npm o pnpm 10.4.1+
- SQLite 3.x
- Navegador web moderno

## Instalación y Configuración

### 1. Clonar o Descargar el Proyecto
```bash
cd /home/ubuntu/asistencia-dashboard
```

### 2. Instalar Dependencias
```bash
pnpm install
```

### 3. Configurar Base de Datos
La base de datos SQLite (data2.db) debe estar ubicada en:
```
/home/ubuntu/asistencia-dashboard/data2.db
```

Si necesitas usar una ruta diferente, edita el archivo `server/attendance.ts`:
```typescript
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data2.db');
```

### 4. Iniciar el Servidor

**Modo Desarrollo:**
```bash
pnpm dev
```

**Modo Producción:**
```bash
pnpm build
pnpm start
```

El servidor estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
asistencia-dashboard/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas principales
│   │   ├── components/    # Componentes reutilizables
│   │   ├── lib/           # Librerías y utilidades
│   │   └── index.css      # Estilos globales
│   └── index.html         # HTML principal
├── server/                 # Backend Node.js/Express
│   ├── attendance.ts      # Queries SQLite
│   ├── routers.ts         # Procedimientos tRPC
│   ├── db.ts              # Helpers de base de datos
│   └── _core/             # Configuración del servidor
├── drizzle/               # Migraciones de base de datos
├── data2.db               # Base de datos SQLite
└── package.json           # Dependencias del proyecto
```

## Configuración de Actualización Automática

### Heartbeat (Actualización cada Hora)

El dashboard está configurado para actualizarse automáticamente cada hora mediante Heartbeat:

**Tarea Creada:**
- Nombre: `attendance-hourly-refresh`
- Cron: `0 * * * * *` (cada hora en punto)
- Endpoint: `/api/scheduled/attendance-refresh`

**Para verificar el estado:**
```bash
manus-heartbeat list
```

**Para pausar la actualización:**
```bash
manus-heartbeat update --task-uid <task_uid> --enable=false
```

**Para reanudar:**
```bash
manus-heartbeat update --task-uid <task_uid> --enable=true
```

## Base de Datos SQLite

### Tablas Principales

#### Tabla: `personal`
```sql
- idPersonal (INTEGER PRIMARY KEY)
- legajo (TEXT)
- nombre (TEXT)
- idSector (INTEGER)
- estado (TEXT)
```

#### Tabla: `fichadas`
```sql
- idFichada (INTEGER PRIMARY KEY)
- idPersonal (INTEGER)
- fecha (DATE)
- hora (TIME)
- tipo (TEXT) - 'entrada' o 'salida'
```

#### Tabla: `sectores`
```sql
- idSector (INTEGER PRIMARY KEY)
- descripcion (TEXT)
```

### Consultas Útiles

**Ver personal activo:**
```sql
SELECT * FROM personal WHERE estado = 'activo';
```

**Ver fichadas de hoy:**
```sql
SELECT * FROM fichadas WHERE fecha = DATE('now');
```

**Ver presentes hoy:**
```sql
SELECT DISTINCT p.* FROM personal p
INNER JOIN fichadas f ON p.idPersonal = f.idPersonal
WHERE f.fecha = DATE('now');
```

**Ver ausentes hoy:**
```sql
SELECT p.* FROM personal p
WHERE p.estado = 'activo'
AND p.idPersonal NOT IN (
  SELECT DISTINCT idPersonal FROM fichadas 
  WHERE fecha = DATE('now')
);
```

## Mantenimiento

### Copias de Seguridad

**Realizar backup de la base de datos:**
```bash
cp /home/ubuntu/asistencia-dashboard/data2.db \
   /home/ubuntu/asistencia-dashboard/backups/data2_$(date +%Y%m%d_%H%M%S).db
```

**Restaurar desde backup:**
```bash
cp /home/ubuntu/asistencia-dashboard/backups/data2_YYYYMMDD_HHMMSS.db \
   /home/ubuntu/asistencia-dashboard/data2.db
```

### Limpieza de Logs

Los logs se almacenan en `.manus-logs/`:
```bash
cd /home/ubuntu/asistencia-dashboard
rm -f .manus-logs/*.log
```

### Actualizar Dependencias

```bash
pnpm update
```

## Monitoreo

### Verificar Estado del Servidor

```bash
curl http://localhost:3000/
```

### Ver Logs del Servidor

```bash
tail -f .manus-logs/devserver.log
```

### Ver Logs de Navegador

```bash
tail -f .manus-logs/browserConsole.log
```

### Ver Solicitudes de Red

```bash
tail -f .manus-logs/networkRequests.log
```

## Troubleshooting

### Error: "Cannot find module 'better-sqlite3'"

**Solución:**
```bash
pnpm add better-sqlite3
npm rebuild better-sqlite3
```

### Error: "Port 3000 already in use"

**Solución:**
```bash
# Encontrar el proceso usando el puerto
lsof -i :3000

# Matar el proceso
kill -9 <PID>

# O usar un puerto diferente
PORT=3001 pnpm dev
```

### Error: "Database file not found"

**Solución:**
1. Verifica que `data2.db` existe en la ruta correcta
2. Comprueba los permisos del archivo:
   ```bash
   ls -la /home/ubuntu/asistencia-dashboard/data2.db
   ```
3. Si es necesario, ajusta los permisos:
   ```bash
   chmod 644 /home/ubuntu/asistencia-dashboard/data2.db
   ```

### El dashboard no muestra datos

**Checklist:**
1. Verifica que el servidor esté ejecutándose: `pnpm dev`
2. Verifica que la base de datos contiene datos:
   ```bash
   sqlite3 data2.db "SELECT COUNT(*) FROM personal;"
   ```
3. Revisa los logs del servidor: `tail -f .manus-logs/devserver.log`
4. Verifica la consola del navegador (F12) para errores

## Seguridad

### Recomendaciones

1. **Acceso a la Base de Datos**
   - Restringe el acceso al archivo `data2.db`
   - Usa permisos de archivo apropiados (644 o 600)

2. **Autenticación**
   - El dashboard usa OAuth de Manus para autenticación
   - Configura credenciales en variables de entorno

3. **HTTPS**
   - En producción, siempre usa HTTPS
   - Configura certificados SSL/TLS

4. **Firewall**
   - Restringe el acceso al puerto 3000 solo a usuarios autorizados
   - Usa un proxy inverso (nginx, Apache) en producción

## Despliegue en Producción

### Pasos Recomendados

1. **Crear checkpoint:**
   ```bash
   # El dashboard ya tiene checkpoint guardado
   ```

2. **Publicar en Manus:**
   - Usa el botón "Publish" en la interfaz de Manus
   - Sigue las instrucciones de despliegue

3. **Verificar despliegue:**
   - Accede a la URL de producción
   - Verifica que todos los datos se cargan correctamente
   - Prueba la actualización automática

4. **Monitoreo continuo:**
   - Revisa los logs regularmente
   - Verifica el rendimiento
   - Realiza backups periódicos

## Rendimiento y Optimización

### Optimizaciones Implementadas

1. **Caché de Datos**
   - tRPC maneja caché automáticamente
   - Los datos se refrescan cada hora

2. **Índices de Base de Datos**
   - Las consultas usan índices en campos clave
   - Mejora significativa en velocidad de consultas

3. **Compresión de Assets**
   - Vite comprime automáticamente los assets
   - Reduce tamaño de descarga

### Monitoreo de Rendimiento

```bash
# Ver tamaño de bundle
pnpm build
ls -lh dist/

# Ver tiempo de compilación
time pnpm build
```

## Contacto y Soporte

Para problemas técnicos o consultas, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Junio 2026  
**Desarrollado con**: React 19, Node.js 22, Express 4, tRPC 11, SQLite 3
