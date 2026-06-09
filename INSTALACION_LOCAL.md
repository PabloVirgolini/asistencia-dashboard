# Guía de Instalación Local - Dashboard de Asistencia

Esta guía te ayudará a compilar y ejecutar el Dashboard de Asistencia en tu computadora local.

## 📋 Requisitos Previos

### Windows, macOS o Linux

Necesitas instalar los siguientes programas:

1. **Node.js 22.13.0 o superior**
   - Descarga desde: https://nodejs.org/
   - Verifica la instalación:
     ```bash
     node --version
     npm --version
     ```

2. **Git** (para clonar el repositorio)
   - Descarga desde: https://git-scm.com/
   - Verifica la instalación:
     ```bash
     git --version
     ```

3. **pnpm** (gestor de paquetes)
   - Se instala automáticamente con Node.js 22+
   - O instálalo manualmente:
     ```bash
     npm install -g pnpm
     ```
   - Verifica la instalación:
     ```bash
     pnpm --version
     ```

## 🚀 Instalación Paso a Paso

### Paso 1: Descargar el Proyecto

Tienes dos opciones:

#### Opción A: Clonar desde Git (si tienes acceso al repositorio)
```bash
git clone <URL_DEL_REPOSITORIO>
cd asistencia-dashboard
```

#### Opción B: Descargar como ZIP
1. Descarga el proyecto como ZIP desde Manus
2. Extrae el archivo en tu computadora
3. Abre una terminal/cmd y navega a la carpeta:
   ```bash
   cd ruta/a/asistencia-dashboard
   ```

### Paso 2: Instalar Dependencias

En la carpeta del proyecto, ejecuta:

```bash
pnpm install
```

Esto descargará e instalará todas las dependencias necesarias (React, Express, tRPC, SQLite, etc.).

**Tiempo estimado**: 3-5 minutos (depende de tu conexión a Internet)

### Paso 3: Verificar la Base de Datos

Asegúrate de que el archivo `data2.db` esté en la raíz del proyecto:

```
asistencia-dashboard/
├── data2.db          ← Debe estar aquí
├── client/
├── server/
├── package.json
└── ...
```

Si no tienes el archivo `data2.db`, cópialo desde tu servidor original.

### Paso 4: Ejecutar en Modo Desarrollo

```bash
pnpm dev
```

Verás un mensaje como:
```
[Attendance Dashboard] Server running on http://localhost:3000/
```

### Paso 5: Abrir en el Navegador

Abre tu navegador web y ve a:
```
http://localhost:3000
```

¡El dashboard debería estar funcionando! 🎉

## 🛠️ Comandos Útiles

### Desarrollo
```bash
# Iniciar servidor de desarrollo (con hot reload)
pnpm dev

# Verificar errores de TypeScript
pnpm check

# Ejecutar tests
pnpm test

# Formatear código
pnpm format
```

### Producción
```bash
# Compilar para producción
pnpm build

# Iniciar servidor de producción
pnpm start
```

### Base de Datos
```bash
# Ejecutar migraciones
pnpm db:push
```

## 🔧 Configuración (Opcional)

### Cambiar Puerto

Si el puerto 3000 está ocupado, puedes usar otro:

**Windows (PowerShell):**
```powershell
$env:PORT=3001
pnpm dev
```

**macOS/Linux (Bash):**
```bash
PORT=3001 pnpm dev
```

Luego accede a: `http://localhost:3001`

### Usar una Base de Datos Diferente

Si tu base de datos SQLite está en otra ubicación, edita el archivo `server/attendance.ts`:

```typescript
// Línea 8-9
const dbPath = process.env.DATABASE_PATH || 
  path.join(__dirname, '../data2.db');
```

Cambia a:
```typescript
const dbPath = 'C:/ruta/a/tu/base/datos.db';  // Windows
// o
const dbPath = '/ruta/a/tu/base/datos.db';    // macOS/Linux
```

Luego reinicia el servidor.

## 📁 Estructura de Carpetas

```
asistencia-dashboard/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas
│   │   ├── components/       # Componentes React
│   │   ├── lib/              # Librerías
│   │   ├── index.css         # Estilos globales
│   │   └── main.tsx          # Entrada de React
│   ├── index.html            # HTML principal
│   └── public/               # Archivos estáticos
├── server/                    # Backend Node.js
│   ├── attendance.ts         # Queries SQLite
│   ├── routers.ts            # Procedimientos tRPC
│   ├── db.ts                 # Helpers de BD
│   └── _core/                # Configuración
├── drizzle/                   # Migraciones
├── data2.db                   # Base de datos SQLite
├── package.json              # Dependencias
├── tsconfig.json             # Configuración TypeScript
├── vite.config.ts            # Configuración Vite
└── README.md                 # Documentación
```

## 🐛 Solución de Problemas

### Error: "Port 3000 already in use"

**Problema**: El puerto 3000 ya está siendo usado por otro programa.

**Solución**:
```bash
# Usa un puerto diferente
PORT=3001 pnpm dev
```

### Error: "Cannot find module 'better-sqlite3'"

**Problema**: No se instaló correctamente la dependencia SQLite.

**Solución**:
```bash
# Reinstala la dependencia
pnpm add better-sqlite3
pnpm install
pnpm dev
```

### Error: "Database file not found"

**Problema**: El archivo `data2.db` no está en la ubicación correcta.

**Solución**:
1. Verifica que `data2.db` esté en la raíz del proyecto
2. Si está en otra ubicación, actualiza la ruta en `server/attendance.ts`
3. Reinicia el servidor

### El dashboard no muestra datos

**Checklist**:
1. ¿Está ejecutándose el servidor? (deberías ver "Server running on http://localhost:3000/")
2. ¿Tiene datos la base de datos? Ejecuta en otra terminal:
   ```bash
   sqlite3 data2.db "SELECT COUNT(*) FROM personal;"
   ```
3. ¿Hay errores en la consola del navegador? (F12 → Console)
4. ¿Hay errores en la terminal del servidor?

### Error de compilación TypeScript

**Solución**:
```bash
# Verifica los errores
pnpm check

# Intenta limpiar y reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

## 📊 Verificar que Todo Funciona

### 1. Servidor Backend
```bash
# Debería responder con HTML
curl http://localhost:3000/
```

### 2. Base de Datos
```bash
# Verifica que hay datos
sqlite3 data2.db ".tables"
```

### 3. Tests
```bash
# Ejecuta los tests
pnpm test
```

Deberías ver:
```
✓ server/attendance.test.ts (10 tests) 10ms
✓ server/auth.logout.test.ts (1 test) 4ms
Test Files  2 passed (2)
     Tests  11 passed (11)
```

## 🌐 Acceso Remoto (Opcional)

Si quieres acceder al dashboard desde otra computadora en la red:

1. Obtén tu dirección IP local:
   - **Windows**: `ipconfig` → busca "IPv4 Address"
   - **macOS/Linux**: `ifconfig` → busca "inet"

2. Accede desde otra computadora:
   ```
   http://TU_IP_LOCAL:3000
   ```

   Ejemplo: `http://192.168.1.100:3000`

## 📚 Documentación Adicional

- **[README.md](./README.md)**: Descripción general del proyecto
- **[GUIA_USO.md](./GUIA_USO.md)**: Cómo usar el dashboard
- **[GUIA_ADMINISTRADOR.md](./GUIA_ADMINISTRADOR.md)**: Información técnica avanzada
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Arquitectura del proyecto

## 🆘 Necesitas Ayuda?

Si encuentras problemas:

1. Revisa esta guía nuevamente
2. Verifica los logs en la terminal
3. Consulta la sección "Solución de Problemas"
4. Contacta al equipo de desarrollo

## ✅ Checklist Final

Antes de comenzar a usar el dashboard, verifica:

- [ ] Node.js 22+ instalado
- [ ] pnpm instalado
- [ ] Proyecto descargado/clonado
- [ ] `pnpm install` completado sin errores
- [ ] `data2.db` presente en la raíz
- [ ] `pnpm dev` ejecutándose sin errores
- [ ] Dashboard accesible en `http://localhost:3000`
- [ ] Datos visibles en el dashboard

---

**Versión**: 1.0.0  
**Última actualización**: Junio 2026  
**Soporte**: Para problemas, contacta al equipo de desarrollo
