import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  // Configuración de Base de Datos
  localDbPath: path.join(__dirname, "../data2.db"),
  remoteDbPath: process.env.REMOTE_DB_PATH || "T:/OficinaTecnica/Pablo/X_ COMPUTOS/1. INFRAESTRUCTURA/3. SEGURIDAD - CAMARAS - RELOJES/RELOJES/app2/database/data.db",
  
  // Configuración del Worker de Sincronización (Delta Sync)
  syncWorker: {
    enabled: process.env.SYNC_WORKER_ENABLED !== "false", // Activado por defecto
    intervalSeconds: parseInt(process.env.SYNC_INTERVAL_SECONDS || "15", 10),
  }
};
