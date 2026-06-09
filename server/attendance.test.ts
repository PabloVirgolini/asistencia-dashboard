import { describe, it, expect } from "vitest";
import {
  getSectors,
  getPresentesByDate,
  getAusentesByDate,
  getAttendanceSummary,
  isValidDate,
  getTodayDate,
} from "./attendance";

describe("Attendance Database Functions", () => {
  describe("isValidDate", () => {
    it("debe aceptar fechas válidas en formato YYYY-MM-DD", () => {
      expect(isValidDate("2025-08-21")).toBe(true);
      expect(isValidDate("2025-01-01")).toBe(true);
      expect(isValidDate("2025-12-31")).toBe(true);
    });

    it("debe rechazar fechas inválidas", () => {
      expect(isValidDate("21-08-2025")).toBe(false);
      expect(isValidDate("2025/08/21")).toBe(false);
      expect(isValidDate("invalid")).toBe(false);
      expect(isValidDate("2025-13-01")).toBe(false);
    });
  });

  describe("getTodayDate", () => {
    it("debe retornar la fecha de hoy en formato YYYY-MM-DD", () => {
      const today = getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isValidDate(today)).toBe(true);
    });
  });

  describe("getSectors", () => {
    it("debe retornar una lista de sectores", () => {
      const sectors = getSectors();
      expect(Array.isArray(sectors)).toBe(true);
      expect(sectors.length).toBeGreaterThan(0);
      expect(sectors[0]).toHaveProperty("idSector");
      expect(sectors[0]).toHaveProperty("descripcion");
    });
  });

  describe("getPresentesByDate", () => {
    it("debe retornar personas presentes para una fecha válida", () => {
      const presentes = getPresentesByDate("2025-08-21");
      expect(Array.isArray(presentes)).toBe(true);
      
      if (presentes.length > 0) {
        expect(presentes[0]).toHaveProperty("legajo");
        expect(presentes[0]).toHaveProperty("nombre");
        expect(presentes[0]).toHaveProperty("sector");
        expect(presentes[0]).toHaveProperty("primeraFichada");
      }
    });

    it("debe retornar presentes filtrados por sector", () => {
      const sectors = getSectors();
      if (sectors.length > 0) {
        const sectorDescripcion = sectors[0].descripcion;
        const presentes = getPresentesByDate("2025-08-21", sectorDescripcion);
        expect(Array.isArray(presentes)).toBe(true);
      }
    });
  });

  describe("getAusentesByDate", () => {
    it("debe retornar personas ausentes para una fecha válida", () => {
      const ausentes = getAusentesByDate("2025-08-21");
      expect(Array.isArray(ausentes)).toBe(true);
      
      if (ausentes.length > 0) {
        expect(ausentes[0]).toHaveProperty("legajo");
        expect(ausentes[0]).toHaveProperty("nombre");
        expect(ausentes[0]).toHaveProperty("sector");
      }
    });

    it("debe retornar ausentes filtrados por sector", () => {
      const sectors = getSectors();
      if (sectors.length > 0) {
        const sectorDescripcion = sectors[0].descripcion;
        const ausentes = getAusentesByDate("2025-08-21", sectorDescripcion);
        expect(Array.isArray(ausentes)).toBe(true);
      }
    });
  });

  describe("getAttendanceSummary", () => {
    it("debe retornar un resumen válido de asistencia", () => {
      const summary = getAttendanceSummary("2025-08-21");
      expect(summary).toHaveProperty("totalActivos");
      expect(summary).toHaveProperty("presentes");
      expect(summary).toHaveProperty("ausentes");
      expect(summary).toHaveProperty("porcentajePresentes");
      expect(summary).toHaveProperty("porcentajeAusentes");

      expect(summary.totalActivos).toBeGreaterThan(0);
      expect(summary.presentes).toBeGreaterThanOrEqual(0);
      expect(summary.ausentes).toBeGreaterThanOrEqual(0);
      expect(summary.presentes + summary.ausentes).toBe(summary.totalActivos);
      expect(summary.porcentajePresentes + summary.porcentajeAusentes).toBeLessThanOrEqual(100);
    });

    it("debe retornar resumen filtrado por sector", () => {
      const sectors = getSectors();
      if (sectors.length > 0) {
        const sectorDescripcion = sectors[0].descripcion;
        const summary = getAttendanceSummary("2025-08-21", sectorDescripcion);
        expect(summary.totalActivos).toBeGreaterThanOrEqual(0);
        expect(summary.presentes + summary.ausentes).toBe(summary.totalActivos);
      }
    });
  });
});
