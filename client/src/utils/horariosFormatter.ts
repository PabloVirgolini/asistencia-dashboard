export interface ReglaHorario {
  id: number;
  id_sector: number | null;
  id_cargo: number | null;
  id_turno: number;
  dia_semana: number;
  hora_entrada: string;
  hora_salida: string;
  legajo: string | null;
  sector?: string;
  cargo?: string;
  turno?: string;
  nombre_empleado?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface FiltrosHorarios {
  texto: string;
  turno: string;
  sector: string;
  cargo: string;
}

export function filtrarReglas(reglas: ReglaHorario[] | undefined, filtros: FiltrosHorarios): ReglaHorario[] {
  if (!reglas) return [];
  
  let result = [...reglas];
  
  if (filtros.texto) {
    const lf = filtros.texto.toLowerCase();
    result = result.filter(r => 
      r.turno?.toLowerCase().includes(lf) ||
      r.sector?.toLowerCase().includes(lf) ||
      r.cargo?.toLowerCase().includes(lf) ||
      r.legajo?.toLowerCase().includes(lf)
    );
  }
  
  if (filtros.turno && filtros.turno !== 'todos') {
    result = result.filter(r => r.turno === filtros.turno);
  }
  if (filtros.sector && filtros.sector !== 'todos') {
    result = result.filter(r => r.sector === filtros.sector);
  }
  if (filtros.cargo && filtros.cargo !== 'todos') {
    result = result.filter(r => r.cargo === filtros.cargo);
  }
  
  return result;
}

const sortByDay = (a: ReglaHorario, b: ReglaHorario) => {
  const dayA = a.dia_semana === 0 ? 7 : a.dia_semana;
  const dayB = b.dia_semana === 0 ? 7 : b.dia_semana;
  return dayA - dayB;
};

export function agruparReglas(reglasFiltradas: ReglaHorario[]) {
  const general: Record<string, Record<string, Record<string, ReglaHorario[]>>> = {};
  const exceptions: Record<string, Record<string, ReglaHorario[]>> = {};
  
  reglasFiltradas.forEach(r => {
    const turnoName = r.turno || 'Sin Turno';
    if (!r.legajo) {
      if (!general[turnoName]) general[turnoName] = {};
      const sectorName = r.sector || 'Sin Sector';
      if (!general[turnoName][sectorName]) general[turnoName][sectorName] = {};
      const cargoName = r.cargo || 'Sin Cargo';
      if (!general[turnoName][sectorName][cargoName]) general[turnoName][sectorName][cargoName] = [];
      general[turnoName][sectorName][cargoName].push(r);
    } else {
      if (!exceptions[turnoName]) exceptions[turnoName] = {};
      if (!exceptions[turnoName][r.legajo]) exceptions[turnoName][r.legajo] = [];
      exceptions[turnoName][r.legajo].push(r);
    }
  });
  
  Object.values(general).forEach(sectores => {
    Object.values(sectores).forEach(cargos => {
      Object.values(cargos).forEach(rules => {
        rules.sort(sortByDay);
      });
    });
  });

  Object.values(exceptions).forEach(legajos => {
    Object.values(legajos).forEach(rules => {
      rules.sort(sortByDay);
    });
  });
  
  return { groupedGeneral: general, groupedExceptions: exceptions };
}
