import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Clock, Building, Briefcase, Pencil } from 'lucide-react';

interface ReglaHorario {
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
}

interface WeeklyCalendarProps {
  reglas: ReglaHorario[];
  onEditRule?: (r: ReglaHorario) => void;
  onHideTurno?: (turno: string) => void;
}

const DAYS = [
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

export default function WeeklyCalendar({ reglas, onEditRule, onHideTurno }: WeeklyCalendarProps) {
  // Convert "HH:MM" to a percentage of 24h
  const timeToPercent = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return ((h * 60 + m) / (24 * 60)) * 100;
  };

  // Assign a consistent color to each sector, with shades based on cargo
  const getSectorColor = (sectorName?: string, cargoName?: string) => {
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

  // Normalize shifts (handle cross-midnight)
  const normalizedBlocks = React.useMemo(() => {
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
  const blocksByDay = React.useMemo(() => {
    const grouped = DAYS.reduce((acc, d) => ({ ...acc, [d.value]: [] }), {} as Record<number, any[]>);
    normalizedBlocks.forEach(b => {
      if (grouped[b.dia_semana]) {
        grouped[b.dia_semana].push(b);
      }
    });
    return grouped;
  }, [normalizedBlocks]);

  return (
    <div className="flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm h-[380px] text-xs">
      {/* Header */}
      <div className="flex border-b bg-slate-50/80 backdrop-blur z-10 sticky top-0">
        <div className="w-12 shrink-0 border-r" /> {/* Spacer for time column */}
        {DAYS.map(day => (
          <div key={day.value} className="flex-1 py-2 text-center font-semibold text-slate-700 border-r last:border-r-0">
            {day.label}
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="flex flex-1 relative overflow-hidden bg-slate-50/30">
        
        {/* Time Column (Y Axis) */}
        <div className="relative w-12 shrink-0 border-r bg-white flex flex-col justify-between text-[10px] text-slate-400 font-medium z-10">
          {[0, 4, 8, 12, 16, 20, 24].map((hour, i) => (
            <div key={hour} className="px-1 text-right" style={{ position: 'absolute', top: `${(hour / 24) * 100}%`, width: '100%', marginTop: hour === 24 ? '-14px' : (hour === 0 ? '2px' : '-7px') }}>
              {hour === 24 ? '00:00' : `${hour.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* 24h Horizontal Grid Lines (Background) */}
        <div className="absolute inset-0 left-12 pointer-events-none">
          {[0, 4, 8, 12, 16, 20].map((hour) => (
            <div key={hour} className="absolute w-full border-t border-slate-200/60" style={{ top: `${(hour / 24) * 100}%` }} />
          ))}
        </div>

        {/* Days Columns */}
        {DAYS.map(day => (
          <div key={day.value} className="flex-1 relative border-r last:border-r-0 h-full group hover:bg-slate-50/50 transition-colors">
            {blocksByDay[day.value].map((block, idx) => {
              // Si hay solapamiento, hacemos el div más angosto o usamos flex?
              // Al usar absolute, podemos superponer. La transparencia del color hará notar el solapamiento.
              // Para evitar bloqueo total, alternamos un margen mínimo si hay colisiones visuales directas.
              const colisionesPrevias = blocksByDay[day.value].filter((b, i) => i < idx && b.top < block.top + block.height && b.top + b.height > block.top).length;
              const insetLeft = (colisionesPrevias * 5) + 2; // Desfasaje ligero para solapamientos
              const width = 100 - insetLeft - 2;

              return (
                <HoverCard key={`${block.id_horario}-${idx}`} openDelay={100} closeDelay={0}>
                  <HoverCardTrigger asChild>
                    <div 
                      className={`absolute rounded-sm border cursor-pointer transition-all ${block.color}`}
                      style={{ 
                        top: `${block.top}%`, 
                        height: `${block.height}%`,
                        left: `${insetLeft}%`,
                        width: `${width}%`,
                        minHeight: '4px' // Para horarios muy cortos
                      }}
                    />
                  </HoverCardTrigger>
                  <HoverCardContent side="right" align="start" className="w-64 p-3 shadow-lg z-50">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-slate-900">{block.turno || 'Sin Turno'}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono bg-slate-50">
                          {block.hora_entrada} - {block.hora_salida}
                        </Badge>
                      </div>
                      
                      <div className="grid gap-1.5 pt-2 border-t">
                        <div className="flex items-center text-sm text-slate-600 gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{block.sector || 'Todos los sectores'}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600 gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{block.cargo || 'Todos los cargos'}</span>
                        </div>
                      </div>
                      {block.isContinued && (
                         <div className="text-[10px] text-slate-400 italic mt-1 pt-1 border-t border-dashed">
                           Continuación del día anterior
                         </div>
                      )}
                      {(block.updated_at || block.updated_by) && (
                        <div className="text-[10px] text-slate-400 font-normal mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5" title={`Modificado: ${block.updated_at} por ${block.updated_by}`}>
                          <Pencil className="w-3 h-3 opacity-70" />
                          <span className="truncate">
                            {block.updated_at ? `Modif. ${block.updated_at?.split(' ')[0]} por ${block.updated_by}` : 'Creado por Sistema'}
                          </span>
                        </div>
                      )}
                      {onHideTurno && block.turno && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onHideTurno(block.turno!); }}
                          className="w-full mt-2 pt-2 border-t border-slate-100 text-xs font-medium text-slate-500 hover:text-indigo-600 text-center transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                          Ocultar Turno
                        </button>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>
        ))}

      </div>
    </div>
  );
}
