import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Clock, Building, Briefcase } from 'lucide-react';

interface ReglaHorario {
  id_horario: number;
  dia_semana: number;
  hora_entrada: string;
  hora_salida: string;
  turno?: string;
  sector?: string;
  cargo?: string;
}

interface WeeklyCalendarProps {
  reglas: ReglaHorario[];
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

const COLORS = [
  'bg-blue-500/80 hover:bg-blue-500 border-blue-600',
  'bg-emerald-500/80 hover:bg-emerald-500 border-emerald-600',
  'bg-violet-500/80 hover:bg-violet-500 border-violet-600',
  'bg-amber-500/80 hover:bg-amber-500 border-amber-600',
  'bg-pink-500/80 hover:bg-pink-500 border-pink-600',
  'bg-cyan-500/80 hover:bg-cyan-500 border-cyan-600',
  'bg-rose-500/80 hover:bg-rose-500 border-rose-600'
];

export default function WeeklyCalendar({ reglas }: WeeklyCalendarProps) {
  // Convert "HH:MM" to a percentage of 24h
  const timeToPercent = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return ((h * 60 + m) / (24 * 60)) * 100;
  };

  // Assign a consistent color to each sector
  const getSectorColor = (sectorName?: string) => {
    if (!sectorName) return COLORS[0];
    let hash = 0;
    for (let i = 0; i < sectorName.length; i++) {
      hash = sectorName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
  };

  // Normalize shifts (handle cross-midnight)
  const normalizedBlocks = React.useMemo(() => {
    const blocks: any[] = [];
    
    reglas.forEach(r => {
      if (!r.hora_entrada || !r.hora_salida) return;
      
      const startPct = timeToPercent(r.hora_entrada);
      const endPct = timeToPercent(r.hora_salida);
      
      if (endPct > startPct) {
        // Normal shift within the same day
        blocks.push({
          ...r,
          top: startPct,
          height: endPct - startPct,
          color: getSectorColor(r.sector)
        });
      } else {
        // Shift crosses midnight, split in two blocks
        // 1. From start to midnight
        blocks.push({
          ...r,
          top: startPct,
          height: 100 - startPct,
          color: getSectorColor(r.sector)
        });
        
        // 2. From midnight to end on the NEXT day
        const nextDay = (r.dia_semana + 1) % 7;
        blocks.push({
          ...r,
          dia_semana: nextDay,
          top: 0,
          height: endPct,
          color: getSectorColor(r.sector),
          isContinued: true
        });
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
        <div className="w-12 shrink-0 border-r bg-white flex flex-col justify-between text-[10px] text-slate-400 font-medium z-10">
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
