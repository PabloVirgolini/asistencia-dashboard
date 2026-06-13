# Dashboard de Asistencia en Tiempo Real

Un dashboard elegante y sofisticado para monitorear la asistencia del personal en tiempo real. Construido con React 19, Node.js, Express 4, tRPC 11 y SQLite, con actualización automática cada hora.

## ✨ Características Principales

- **Dashboard Elegante**: Interfaz refinada con diseño sofisticado y tipografía limpia
- **Monitoreo en Tiempo Real**: Visualización instantánea de presentes y ausentes
- **Actualización Automática**: Refresco de datos cada hora mediante Heartbeat
- **Filtro por Sector**: Segmenta la vista por departamento
- **Selector de Fecha**: Consulta asistencia de días anteriores
- **Indicadores Visuales**: Códigos de color por sector y estado
- **Responsive Design**: Funciona en desktop, tablet y móvil
- **Base de Datos SQLite**: Consulta directa a datos persistentes

## 🚀 Quick Start

### Requisitos
- Node.js 22.13.0+
- pnpm 10.4.1+
- SQLite 3.x

### Instalación

```bash
# Instalar dependencias
pnpm install

# Inicializar base de datos de prueba (opcional, si no tienes data2.db previa)
node seed_db.cjs

# Iniciar servidor de desarrollo
pnpm dev
```

El dashboard estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
asistencia-dashboard/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   └── AttendanceDashboard.tsx    # Página principal
│   │   ├── components/
│   │   │   ├── ResumenDia.tsx             # Tarjetas de resumen
│   │   │   ├── TablaPresentes.tsx         # Tabla de presentes
│   │   │   ├── TablaAusentes.tsx          # Tabla de ausentes
│   │   │   └── SelectorFecha.tsx          # Selector de fecha
│   │   └── index.css                      # Estilos globales
│   └── index.html
├── server/
│   ├── attendance.ts          # Queries SQLite
│   ├── routers.ts             # Procedimientos tRPC
│   ├── db.ts                  # Helpers de BD
│   └── _core/                 # Configuración del servidor
├── data2.db                   # Base de datos SQLite
├── GUIA_USO.md               # Documentación para usuarios
├── GUIA_ADMINISTRADOR.md     # Documentación técnica
└── package.json
```

## 🛠️ Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Inicia servidor de desarrollo

# Producción
pnpm build            # Compila para producción
pnpm start            # Inicia servidor de producción

# Calidad de código
pnpm check            # Verifica TypeScript
pnpm test             # Ejecuta tests con Vitest
pnpm format           # Formatea código con Prettier

# Base de datos
pnpm db:push          # Ejecuta migraciones
```

## 📊 Funcionalidades

### 1. Resumen del Día
Tarjetas que muestran:
- Total de personal activo
- Cantidad de presentes (con porcentaje)
- Cantidad de ausentes (con porcentaje)

### 2. Tablas de Asistencia
- **Presentes**: Nombre, Legajo, Sector, Hora de Entrada
- **Ausentes**: Nombre, Legajo, Sector

### 3. Controles
- Selector de fecha con calendario
- Filtro por sector
- Botón de actualización manual
- Indicador de próxima actualización

### 4. Actualización Automática
- Se ejecuta cada hora en punto
- Usa Heartbeat para sincronización
- Refetch automático sin recargar página

## 🎨 Diseño Visual

### Paleta de Colores
- **Fondo**: Gradiente de gris claro a gris (elegante)
- **Texto Principal**: Gris oscuro (slate-900)
- **Texto Secundario**: Gris medio (slate-600)
- **Presentes**: Verde (emerald)
- **Ausentes**: Rojo (red)

### Tipografía
- **Fuente**: Inter (Google Fonts)
- **Pesos**: 400, 500, 600, 700
- **Tamaños**: Escalados para jerarquía visual

### Componentes
- Tarjetas con sombras suaves
- Tablas con hover effects
- Badges de color por sector
- Iconos de Lucide React

## 🔧 Configuración

### Variables de Entorno
```bash
DATABASE_URL=...              # Conexión a BD (si aplica)
JWT_SECRET=...                # Secreto para sesiones
VITE_APP_ID=...              # ID de aplicación OAuth
OAUTH_SERVER_URL=...         # URL del servidor OAuth
```

### Base de Datos SQLite
La base de datos `data2.db` debe estar en la raíz del proyecto.

**Tablas principales:**
- `personal`: Información de empleados
- `fichadas`: Registros de entrada/salida
- `sectores`: Departamentos

## 📈 Actualización Automática (Heartbeat)

El dashboard está configurado con Heartbeat para actualizarse cada hora:

```bash
# Ver estado del Heartbeat
manus-heartbeat list

# Pausar actualizaciones
manus-heartbeat update --task-uid <uid> --enable=false

# Reanudar actualizaciones
manus-heartbeat update --task-uid <uid> --enable=true
```

## 🧪 Testing

```bash
# Ejecutar tests
pnpm test

# Tests incluidos:
# - server/attendance.test.ts: Tests de queries SQLite
# - server/auth.logout.test.ts: Tests de autenticación
```

## 📚 Documentación

- **[GUIA_USO.md](./GUIA_USO.md)**: Guía para usuarios finales
- **[GUIA_ADMINISTRADOR.md](./GUIA_ADMINISTRADOR.md)**: Guía técnica y de administración
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Documentación de arquitectura

## 🚢 Despliegue

### En Manus
1. Crear checkpoint: Ya completado
2. Hacer clic en "Publish" en la interfaz de Manus
3. Seguir las instrucciones de despliegue

### En Producción
```bash
pnpm build
pnpm start
```

## 🔒 Seguridad

- Autenticación OAuth integrada
- Validación de entrada con Zod
- Prepared statements en SQLite
- HTTPS en producción
- Restricción de acceso a base de datos

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.

## 📄 Licencia

MIT

---

**Versión**: 1.0.0  
**Última actualización**: Junio 2026  
**Desarrollado con**: React 19, Node.js 22, Express 4, tRPC 11, SQLite 3, Tailwind CSS 4
