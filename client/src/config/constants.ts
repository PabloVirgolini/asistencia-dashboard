/**
 * CONSTANTES GLOBALES DEL FRONTEND
 * Este archivo centraliza los comportamientos y tiempos en la interfaz de React.
 */
export const UI_CONSTANTS = {
  /**
   * Intervalo (en milisegundos) que define cada cuánto tiempo la aplicación
   * refrescará silenciosamente los datos consultando al backend (Heartbeat).
   * 
   * Actualmente configurado a: 1 hora (3600000 ms).
   * Riesgo: ALTO. Si lo ponés en valores muy bajos (ej: 1000 ms = 1 segundo), 
   * el navegador del usuario hará peticiones incesantes al backend, saturando
   * el servidor de Base de Datos y la red.
   */
  DASHBOARD_REFRESH_INTERVAL_MS: 3600000, 
};
