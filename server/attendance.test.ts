import { describe, it, expect } from "vitest";
import { getSectors } from "./services/personal.service";
import {
  getAttendanceGroupedByTurno
} from "./services/asistencia.service";
import {
  isValidDate,
  getTodayDate,
} from "./services/admin.service";

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

  describe("getAttendanceGroupedByTurno", () => {
    it("debe retornar grupos de turnos y summary para una fecha válida", () => {
      const result = getAttendanceGroupedByTurno("2026-06-11");
      
      expect(result).toHaveProperty("grupos");
      expect(result).toHaveProperty("summary");
      expect(Array.isArray(result.grupos)).toBe(true);
      
      const { summary } = result;
      expect(summary).toHaveProperty("totalActivos");
      expect(summary).toHaveProperty("presentes");
      expect(summary).toHaveProperty("ausentes");
      expect(summary).toHaveProperty("licencias");
      expect(summary.totalActivos).toBeGreaterThanOrEqual(0);
    });

    it("debe retornar resultados filtrados por sector", () => {
      const sectors = getSectors();
      if (sectors.length > 0) {
        const sectorId = sectors[0].idSector;
        const result = getAttendanceGroupedByTurno("2026-06-11", sectorId.toString());
        expect(Array.isArray(result.grupos)).toBe(true);
      }
    });
  });
});
