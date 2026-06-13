# Guía de Instalación y Primera Corrida (Red Local)

Esta guía detalla los pasos para instalar, configurar e iniciar el **Dashboard de Asistencia** por primera vez en una computadora y permitir que otras PCs de la red local (o pantallas Smart TV) accedan al panel.

---

## 📋 1. Requisitos Previos

Si la PC host (la que servirá como servidor de la aplicación) no cuenta con el entorno de ejecución, realiza los siguientes pasos:

1. **Instalar Node.js**:
   * Descarga e instala **Node.js 18 o superior** desde el sitio web oficial: [nodejs.org](https://nodejs.org/).
2. **Instalar pnpm** (gestor de paquetes optimizado):
   * Abre una terminal (**PowerShell** o **CMD**) como Administrador y ejecuta:
     ```bash
     npm install -g pnpm
     ```
3. **Instalar Git** (opcional):
   * Instala Git si deseas clonar el repositorio directamente en lugar de transferir los archivos comprimidos manualmente: [git-scm.com](https://git-scm.com/).

---

## 📥 2. Descargar el Proyecto

Abre la terminal en la carpeta donde deseas guardar la aplicación y ejecuta:

```bash
git clone <URL_DE_TU_REPOSITORIO>
cd asistencia-dashboard
```

*(Nota: Si descargaste el proyecto como archivo `.zip`, descomprímelo y navega a la carpeta correspondiente desde tu terminal).*

---

## 📦 3. Instalar Dependencias

Para descargar todas las librerías necesarias del frontend y backend sin redundancias, ejecuta en la raíz del proyecto:

```bash
pnpm install
```

---

## ⚙️ 4. Configurar el Entorno (Opcional)

El sistema está diseñado para funcionar de manera automática utilizando los valores predeterminados de la configuración central. Por lo tanto, **este paso es completamente opcional**.

*   **Comportamiento por defecto (sin `.env`)**: El servidor se ejecutará en el puerto **`3000`** y utilizará el archivo **`data2.db`** en la raíz del proyecto de manera automática.

Si deseas anular estos valores predeterminados (por ejemplo, para usar un puerto diferente como el `5000` o especificar otra ruta de base de datos), crea un archivo llamado `.env` en la raíz del proyecto y define los parámetros que gustes:

```env
# Ruta personalizada de la base de datos SQLite (opcional)
DATABASE_PATH=data2.db

# Puerto personalizado en el que escuchará el servidor web (opcional)
PORT=5000
```

> [!NOTE]
> **Seguridad simplificada**: No es necesario que configures un secreto `JWT_SECRET` en el `.env`. De no existir, la aplicación generará una firma criptográfica aleatoria y segura en memoria al iniciarse.

### 💡 ¿Qué pasa si no tienes una base de datos `data2.db` previa?
Si estás realizando una instalación limpia y no cuentas con un archivo `data2.db` de producción, puedes crear una base de datos completamente nueva con **estructura de tablas y datos de prueba ficticios** ejecutando en la terminal:

```bash
node seed_db.cjs
```

Este comando:
1. Creará el archivo `data2.db` automáticamente en la raíz.
2. Estructurará todas las tablas requeridas.
3. Cargará un set de datos de prueba (sectores, cargos, reglas horarias, empleados fijos y rotativos, y registros de fichadas cargados para el día **13 de Junio de 2026**).
4. Creará una cuenta de administrador inicial:
   * **Email**: `admin@frecicar.com`
   * **Contraseña**: `admin123`

---

## 🚀 5. Iniciar la Aplicación

Tienes dos modalidades para levantar la plataforma:

### Opción A: Modo Desarrollo (Con recarga en caliente para cambios de código)
```bash
pnpm run dev
```

### Opción B: Modo Producción (Simulación al 100% de alto rendimiento)
1. Primero, compila el código optimizado:
   ```bash
   pnpm run build
   ```
2. Luego, inicia el servidor de producción:
   ```bash
   pnpm start
   ```

---

## 🌐 ¿Cómo acceden las otras PCs al Dashboard?

Una vez iniciado el servidor, verás en consola un mensaje indicando que el servidor está corriendo:
`[Attendance Dashboard] Server running on http://localhost:3000/` (o port `5000` si lo cambiaste en el `.env`).

Para acceder desde otros dispositivos (teléfonos, tablets, computadoras o Smart TVs en la misma red local):

1. **Obtén la dirección IP local del Host**:
   * En la PC Host, abre otra pestaña de terminal y escribe:
     ```powershell
     ipconfig
     ```
   * Busca tu adaptador de red activo (Ethernet o Wi-Fi) y copia la **Dirección IPv4** (por ejemplo, `192.168.1.50`).
2. **Accede desde cualquier navegador**:
   * En cualquier otro dispositivo de la red local, ingresa a la barra de direcciones del navegador web y escribe:
     👉 `http://192.168.1.50:3000/` (o cambia `3000` por el puerto que hayas configurado en tu `.env`, ej. `5000`).

---

## 🛡️ Solución de Problemas (Red Local)

> [!WARNING]
> **Firewall de Windows**: Si la página no carga en las otras computadoras pero sí funciona en el host local (`localhost:3000`), es probable que el Firewall de Windows del host esté bloqueando la conexión entrante.
> 
> **Cómo solucionarlo**:
> 1. Abre el panel de control del Firewall de Windows.
> 2. Agrega una **Regla de Entrada** para habilitar las conexiones a través del puerto **3000** (o el puerto configurado en el `.env`).
> 3. De forma alternativa, puedes permitir el tráfico entrante para la aplicación de **Node.js** (`node.exe`).
