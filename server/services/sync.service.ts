import Database from 'better-sqlite3';
import { config } from '../config.js';
import fs from 'fs';

export function startAutoSync() {
  if (!config.syncWorker.enabled) {
    console.log('[Delta Sync] Sync worker is disabled in config.');
    return;
  }

  const intervalMs = config.syncWorker.intervalSeconds * 1000;
  console.log(`[Delta Sync] Starting auto-sync worker. Interval: ${config.syncWorker.intervalSeconds}s`);

  setInterval(() => {
    let syncDb: Database.Database | null = null;
    try {
      // Validar si la unidad de red está accesible antes de intentar conectarse
      if (!fs.existsSync(config.remoteDbPath)) {
        // Lo dejamos en silencio o con un warning para no spamear la consola si la red se cae
        // console.warn(`[Delta Sync] Remote DB no accesible. Reintentando en la próxima ventana.`);
        return;
      }

      // Usar una conexión independiente para no bloquear el Event Loop del frontend
      syncDb = new Database(config.localDbPath, { fileMustExist: true });
      syncDb.pragma('journal_mode = WAL');

      // 1. Encontrar el registro más reciente en la base de datos local
      const row = syncDb.prepare('SELECT MAX(nroFichada) as maxId FROM fichadas').get() as { maxId: number | null };
      const maxLocalId = row?.maxId || 0;

      // 2. Conectar la base maestra de forma segura (Solo Lectura sugerido, pero ATTACH funciona por defecto)
      syncDb.exec(`ATTACH DATABASE '${config.remoteDbPath}' AS remoteDB`);

      // 3. Importar solo los registros posteriores al maxLocalId
      const info = syncDb.prepare(`
        INSERT INTO fichadas (nroFichada, reloj, hora, legajo, fichadaRepetida)
        SELECT nroFichada, reloj, hora, legajo, fichadaRepetida 
        FROM remoteDB.fichadas
        WHERE nroFichada > ?
      `).run(maxLocalId);

      // 4. Desconectar la unidad remota para liberar posibles bloqueos
      syncDb.exec(`DETACH DATABASE remoteDB`);

      if (info.changes > 0) {
        console.log(`[Delta Sync] Sincronización exitosa. Se importaron ${info.changes} nuevas fichadas.`);
      }
    } catch (error: any) {
      console.error('[Delta Sync] Error durante sincronización:', error.message);
    } finally {
      if (syncDb) {
        try {
          syncDb.close();
        } catch (e) {
          // Ignorar errores al cerrar
        }
      }
    }
  }, intervalMs);
}
