import { useMemo } from 'react';

export interface ReglaHorario {
  id_horario: number;
  dia_semana: number;
  hora_entrada: string;
  hora_salida: string;
  turno?: string;
  sector?: string;
  cargo?: string;
  es_cortado?: number;
  hora_entrada_2?: string | null;
  hora_salida_2?: string | null;
  updated_at?: string;
  updated_by?: string;
}

export const DAYS = [
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 },
  { label: 'Vie', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 }
];

const COLOR_PALETTES = [
  { 400: 'bg-blue-400/80 hover:bg-blue-400 border-blue-500', 500: 'bg-blue-500/80 hover:bg-blue-500 border-blue-600', 600: 'bg-blue-600/80 hover:bg-blue-600 border-blue-700', 700: 'bg-blue-700/80 hover:bg-blue-700 border-blue-800' },
  { 400: 'bg-emerald-400/80 hover:bg-emerald-400 border-emerald-500', 500: 'bg-emerald-500/80 hover:bg-emerald-500 border-emerald-600', 600: 'bg-emerald-600/80 hover:bg-emerald-600 border-emerald-700', 700: 'bg-emerald-700/80 hover:bg-emerald-700 border-emerald-800' },
  { 400: 'bg-violet-400/80 hover:bg-violet-400 border-violet-500', 500: 'bg-violet-500/80 hover:bg-violet-500 border-violet-600', 600: 'bg-violet-600/80 hover:bg-violet-600 border-violet-700', 700: 'bg-violet-700/80 hover:bg-violet-700 border-violet-800' },
  { 400: 'bg-amber-400/80 hover:bg-amber-400 border-amber-500', 500: 'bg-amber-500/80 hover:bg-amber-500 border-amber-600', 600: 'bg-amber-600/80 hover:bg-amber-600 border-amber-700', 700: 'bg-amber-700/80 hover:bg-amber-700 border-amber-800' },
  { 400: 'bg-pink-400/80 hover:bg-pink-400 border-pink-500', 500: 'bg-pink-500/80 hover:bg-pink-500 border-pink-600', 600: 'bg-pink-600/80 hover:bg-pink-600 border-pink-700', 700: 'bg-pink-700/80 hover:bg-pink-700 border-pink-800' },
  { 400: 'bg-cyan-400/80 hover:bg-cyan-400 border-cyan-500', 500: 'bg-cyan-500/80 hover:bg-cyan-500 border-cyan-600', 600: 'bg-cyan-600/80 hover:bg-cyan-600 border-cyan-700', 700: 'bg-cyan-700/80 hover:bg-cyan-700 border-cyan-800' },
  { 400: 'bg-rose-400/80 hover:bg-rose-400 border-rose-500', 500: 'bg-rose-500/80 hover:bg-rose-500 border-rose-600', 600: 'bg-rose-600/80 hover:bg-rose-600 border-rose-700', 700: 'bg-rose-700/80 hover:bg-rose-700 border-rose-800' }
];

// Convert "HH:MM" to a percentage of 24h
export const timeToPercent = (time: string) => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return ((h * 60 + m) / (24 * 60)) * 100;
};

// Assign a consistent color to each sector, with shades based on cargo
export const getSectorColor = (sectorName?: string, cargoName?: string) => {
  if (!sectorName) return COLOR_PALETTES[0][500];
  
  let sectorHash = 0;
  for (let i = 0; i < sectorName.length; i++) {
    sectorHash = sectorName.charCodeAt(i) + ((sectorHash << 5) - sectorHash);
  }
  const palette = COLOR_PALETTES[Math.abs(sectorHash) % COLOR_PALETTES.length];
  
  if (!cargoName) return palette[500];
  
  let cargoHash = 0;
  for (let i = 0; i < cargoName.length; i++) {
    cargoHash = cargoName.charCodeAt(i) + ((cargoHash << 5) - cargoHash);
  }
  
  const shades = [400, 500, 600, 700] as const;
  const shade = shades[Math.abs(cargoHash) % shades.length];
  
  return palette[shade];
};

export function useWeeklyCalendar(reglas: ReglaHorario[]) {
  // Normalize shifts (handle cross-midnight and cortados)
  const normalizedBlocks = useMemo(() => {
    const blocks: any[] = [];
    
    reglas.forEach(r => {
      if (!r.hora_entrada || !r.hora_salida) return;
      
      const startPercent = timeToPercent(r.hora_entrada);
      const endPercent = timeToPercent(r.hora_salida);
      
      if (endPercent > startPercent) {
        blocks.push({
          ...r,
          top: startPercent,
          height: endPercent - startPercent,
          color: getSectorColor(r.sector, r.cargo),
          isContinued: false
        });
      } else {
        const firstDayDuration = 100 - startPercent;
        const secondDayDuration = endPercent;
        const nextDay = (r.dia_semana + 1) % 7;
        
        blocks.push({
          ...r,
          top: startPercent,
          height: firstDayDuration,
          color: getSectorColor(r.sector, r.cargo),
          isContinued: false
        });
        
        blocks.push({
          ...r,
          dia_semana: nextDay,
          top: 0,
          height: secondDayDuration,
          color: getSectorColor(r.sector, r.cargo),
          isContinued: true
        });
      }

      // Procesar segundo bloque si es horario cortado
      if (r.es_cortado === 1 && r.hora_entrada_2 && r.hora_salida_2) {
        const startPercent2 = timeToPercent(r.hora_entrada_2);
        const endPercent2 = timeToPercent(r.hora_salida_2);

        if (endPercent2 > startPercent2) {
          blocks.push({
            ...r,
            top: startPercent2,
            height: endPercent2 - startPercent2,
            color: getSectorColor(r.sector, r.cargo),
            isContinued: false,
            isCortadoPart2: true
          });
        } else {
          const firstDayDuration2 = 100 - startPercent2;
          const secondDayDuration2 = endPercent2;
          const nextDay2 = (r.dia_semana + 1) % 7;
          
          blocks.push({
            ...r,
            top: startPercent2,
            height: firstDayDuration2,
            color: getSectorColor(r.sector, r.cargo),
            isContinued: false,
            isCortadoPart2: true
          });
          
          blocks.push({
            ...r,
            dia_semana: nextDay2,
            top: 0,
            height: secondDayDuration2,
            color: getSectorColor(r.sector, r.cargo),
            isContinued: true,
            isCortadoPart2: true
          });
        }
      }
    });
    
    return blocks;
  }, [reglas]);

  // Group blocks by day
  const blocksByDay = useMemo(() => {
    const grouped = DAYS.reduce((acc, d) => ({ ...acc, [d.value]: [] }), {} as Record<number, any[]>);
    normalizedBlocks.forEach(b => {
      if (grouped[b.dia_semana]) {
        grouped[b.dia_semana].push(b);
      }
    });
    return grouped;
  }, [normalizedBlocks]);

  return { blocksByDay };
}
