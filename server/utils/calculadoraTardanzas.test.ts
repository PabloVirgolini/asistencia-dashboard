import { describe, it, expect } from 'vitest';
import { calcularLlegadaTarde, ReglaBase, FichadaData } from './calculadoraTardanzas';

describe('calcularLlegadaTarde', () => {
  const baseDate = new Date('2026-06-10T00:00:00'); // Base para tests

  it('debería retornar false si no hay reglas de horario', () => {
    const fichada: FichadaData = { legajo: '123', sectorPertenencia: '1', cargo_id: 1, primeraFichada: '2026-06-10 08:00:00' };
    expect(calcularLlegadaTarde(fichada, [], baseDate)).toBe(false);
  });

  it('debería retornar false si el empleado llega a tiempo o antes', () => {
    const fichada: FichadaData = { legajo: '123', sectorPertenencia: '1', cargo_id: 1, primeraFichada: '2026-06-10 07:55:00' };
    const reglas: ReglaBase[] = [
      { id_sector: '1', id_cargo: 1, hora_entrada: '08:00', hora_salida: '16:00', legajo: null }
    ];
    
    expect(calcularLlegadaTarde(fichada, reglas, baseDate, 10)).toBe(false);
  });

  it('debería retornar false si llega tarde pero dentro del periodo de tolerancia', () => {
    const fichada: FichadaData = { legajo: '123', sectorPertenencia: '1', cargo_id: 1, primeraFichada: '2026-06-10 08:08:00' };
    const reglas: ReglaBase[] = [
      { id_sector: '1', id_cargo: 1, hora_entrada: '08:00', hora_salida: '16:00', legajo: null }
    ];
    
    expect(calcularLlegadaTarde(fichada, reglas, baseDate, 10)).toBe(false);
  });

  it('debería retornar true si llega después de la tolerancia (Regla General)', () => {
    const fichada: FichadaData = { legajo: '123', sectorPertenencia: '1', cargo_id: 1, primeraFichada: '2026-06-10 08:15:00' };
    const reglas: ReglaBase[] = [
      { id_sector: '1', id_cargo: 1, hora_entrada: '08:00', hora_salida: '16:00', legajo: null }
    ];
    
    expect(calcularLlegadaTarde(fichada, reglas, baseDate, 10)).toBe(true);
  });

  it('debería dar prioridad a la excepción por legajo sobre la regla general', () => {
    const fichada: FichadaData = { legajo: '123', sectorPertenencia: '1', cargo_id: 1, primeraFichada: '2026-06-10 09:15:00' };
    const reglas: ReglaBase[] = [
      { id_sector: '1', id_cargo: 1, hora_entrada: '08:00', hora_salida: '16:00', legajo: null }, // Regla General (llegaría tarde)
      { id_sector: '1', id_cargo: 1, hora_entrada: '10:00', hora_salida: '18:00', legajo: '123' } // Excepción (llega a tiempo)
    ];
    
    expect(calcularLlegadaTarde(fichada, reglas, baseDate, 10)).toBe(false); // Porque su hora es 10:00
  });

  it('debería castigar la llegada tarde sobre la excepción si se retrasa', () => {
    const fichada: FichadaData = { legajo: '123', sectorPertenencia: '1', cargo_id: 1, primeraFichada: '2026-06-10 10:15:00' };
    const reglas: ReglaBase[] = [
      { id_sector: '1', id_cargo: 1, hora_entrada: '10:00', hora_salida: '18:00', legajo: '123' }
    ];
    
    expect(calcularLlegadaTarde(fichada, reglas, baseDate, 10)).toBe(true);
  });
});
