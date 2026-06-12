import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { serveStatic, setupVite } from "./vite.js";
import type { Request, Response } from "express";
import { startAutoSync } from "../services/sync.service.js";
import { config } from "../config.js";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);

  // Endpoint para actualización automática de asistencia (Heartbeat)
  app.post("/api/scheduled/attendance-refresh", async (req: Request, res: Response) => {
    try {
      // Este endpoint se ejecuta cada hora para invalidar el caché de datos
      // El cliente se encargará de refetch automáticamente
      res.json({
        ok: true,
        message: "Attendance data refresh triggered",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in attendance refresh:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Fallback para rutas no encontradas (debe estar al final)
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  const preferredPort = config.port;
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Arrancar el Worker de Sincronización Incremental
  startAutoSync();

  server.listen(port, () => {
    console.log(`[Attendance Dashboard] Server running on http://localhost:${port}/`);
    console.log(`[Attendance Dashboard] Hourly attendance refresh scheduled via Heartbeat`);
  });
}

startServer().catch(console.error);
