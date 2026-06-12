import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CONFIGURACIÓN CENTRAL DE LA APLICACIÓN
 * Este archivo consolida todas las variables de entorno y constantes de comportamiento.
 * Se puede modificar inyectando variables (.env) o cambiando los defaults aquí mismo.
 */
export const config = {
  // ==========================================
  // ENTORNO Y SERVIDOR
  // ==========================================
  
  /**
   * Entorno de ejecución (development, production).
   * Define si se usan logs detallados o si Vite compila en caliente.
   * Riesgo: ALTO. Cambiar a algo distinto de "production" en el servidor final afectará el rendimiento severamente.
   */
  env: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  
  /**
   * Puerto HTTP donde escucha el backend Node.js.
   * Riesgo: MEDIO. Si cambias el puerto, asegúrate de que el frontend sepa dónde conectarse y el Firewall esté abierto.
   */
  port: parseInt(process.env.PORT || "3000", 10),

  // ==========================================
  // BASE DE DATOS
  // ==========================================
  
  /**
   * Ruta absoluta o relativa de la Base de Datos Local de la aplicación (SQLite).
   * Riesgo: CRÍTICO. Si la aplicación no encuentra este archivo, creará uno vacío o fallará. 
   * Asegurar que tenga permisos de lectura/escritura (chmod 644).
   */
  localDbPath: process.env.DATABASE_PATH || path.join(__dirname, "../data2.db"),
  
  /**
   * Ruta absoluta hacia la Base de Datos del Reloj Biométrico en el disco de red (Ej: Disco T).
   * Riesgo: MEDIO. Si está mal, el sistema simplemente dejará de importar nuevas fichadas, pero no se caerá.
   */
  remoteDbPath: process.env.REMOTE_DB_PATH || "T:/OficinaTecnica/Pablo/X_ COMPUTOS/1. INFRAESTRUCTURA/3. SEGURIDAD - CAMARAS - RELOJES/RELOJES/app2/database/data.db",
  
  // ==========================================
  // REGLAS DE NEGOCIO
  // ==========================================
  
  /**
   * Tiempo de gracia (en minutos) que se le da a un empleado antes de marcarlo como "Tarde".
   * Este es un valor de fallback. En el dashboard, el usuario puede mover un slider para sobrescribirlo temporalmente.
   * Riesgo: BAJO. Solo afecta la representación visual de "Rojo/Verde" si el front no envía el parámetro.
   */
  toleranciaLlegadaTardeDefault: parseInt(process.env.TOLERANCIA_MINUTOS_DEFAULT || "10", 10),

  // ==========================================
  // AUTENTICACIÓN Y SEGURIDAD
  // ==========================================
  
  /**
   * Firma secreta para cifrar y firmar los JWT (Cookies de sesión de Administradores).
   * Riesgo: CRÍTICO. Si se cambia, TODOS los administradores perderán su sesión actual y deberán volver a loguearse. 
   * NUNCA subir la clave real a Git.
   */
  cookieSecret: process.env.JWT_SECRET || "default_unsafe_secret",
  
  // APIs Externas
  appId: process.env.VITE_APP_ID || "",
  forgeApiUrl: process.env.FORGE_API_URL || "",
  forgeApiKey: process.env.FORGE_API_KEY || "",
  ownerOpenId: process.env.OWNER_OPEN_ID || "",

  // ==========================================
  // WORKER DE SINCRONIZACIÓN (DELTA SYNC)
  // ==========================================
  
  syncWorker: {
    /**
     * Interruptor maestro para apagar la importación automática de fichadas.
     * Riesgo: BAJO. Útil apagarlo ("false") en entornos de desarrollo locales si no tenés acceso al disco T:.
     */
    enabled: process.env.SYNC_WORKER_ENABLED !== "false", // Activado por defecto
    
    /**
     * Cada cuántos segundos el servidor le pregunta al disco de red si hay nuevas fichadas.
     * Riesgo: MEDIO. Si es muy bajo (ej: 1 segundo), saturarás el disco de red SMB. 
     * Se recomienda entre 10 y 30 segundos.
     */
    intervalSeconds: parseInt(process.env.SYNC_INTERVAL_SECONDS || "15", 10),
  }
};
