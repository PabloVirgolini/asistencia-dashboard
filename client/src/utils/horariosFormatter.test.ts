import { describe, it, expect } from 'vitest';
import { filtrarReglas, agruparReglas, ReglaHorario } from './horariosFormatter';

describe('horariosFormatter', () => {
  const mockReglas: ReglaHorario[] = [
    {
      id: 1, id_sector: 1, id_cargo: 1, id_turno: 1, dia_semana: 1, hora_entrada: '08:00', hora_salida: '16:00', legajo: null,
      turno: 'Mañana', sector: 'Produccion', cargo: 'Operario'
    },
    {
      id: 2, id_sector: 1, id_cargo: 1, id_turno: 1, dia_semana: 2, hora_entrada: '08:00', hora_salida: '16:00', legajo: null,
      turno: 'Mañana', sector: 'Produccion', cargo: 'Operario'
    },
    {
      id: 3, id_sector: 2, id_cargo: 2, id_turno: 2, dia_semana: 1, hora_entrada: '16:00', hora_salida: '00:00', legajo: '123',
      turno: 'Tarde', sector: 'Mantenimiento', cargo: 'Tecnico', nombre_empleado: 'Juan Perez'
    }
  ];

  describe('filtrarReglas', () => {
    it('debería retornar todas las reglas si no hay filtros', () => {
      const result = filtrarReglas(mockReglas, { texto: '', turnos: [], sectores: [], cargos: [] });
      expect(result.length).toBe(3);
    });

    it('debería filtrar por texto', () => {
      const result = filtrarReglas(mockReglas, { texto: 'Mantenimiento', turnos: [], sectores: [], cargos: [] });
      expect(result.length).toBe(1);
      expect(result[0].sector).toBe('Mantenimiento');
    });

    it('debería filtrar por turno exacto', () => {
      const result = filtrarReglas(mockReglas, { texto: '', turnos: ['Mañana'], sectores: [], cargos: [] });
      expect(result.length).toBe(2);
      expect(result[0].turno).toBe('Mañana');
    });
  });

  describe('agruparReglas', () => {
    it('debería agrupar correctamente reglas generales y excepciones', () => {
      const { groupedGeneral, groupedExceptions } = agruparReglas(mockReglas);
      
      // General
      expect(groupedGeneral['Mañana']).toBeDefined();
      expect(groupedGeneral['Mañana']['Produccion']).toBeDefined();
      expect(groupedGeneral['Mañana']['Produccion']['Operario']).toHaveLength(2);
      
      // La excepción no debería estar en general
      expect(groupedGeneral['Tarde']).toBeUndefined();

      // Exceptions
      expect(groupedExceptions['Tarde']).toBeDefined();
      expect(groupedExceptions['Tarde']['123']).toHaveLength(1);
    });

    it('debería ordenar los días de la semana poniendo el Domingo (0) al final', () => {
      const reglasDesordenadas: ReglaHorario[] = [
        { ...mockReglas[0], dia_semana: 0, id: 10 }, // Domingo
        { ...mockReglas[0], dia_semana: 2, id: 11 }, // Martes
        { ...mockReglas[0], dia_semana: 1, id: 12 }, // Lunes
      ];
      
      const { groupedGeneral } = agruparReglas(reglasDesordenadas);
      const ordenado = groupedGeneral['Mañana']['Produccion']['Operario'];
      
      expect(ordenado[0].dia_semana).toBe(1); // Lunes
      expect(ordenado[1].dia_semana).toBe(2); // Martes
      expect(ordenado[2].dia_semana).toBe(0); // Domingo
    });
  });
});
