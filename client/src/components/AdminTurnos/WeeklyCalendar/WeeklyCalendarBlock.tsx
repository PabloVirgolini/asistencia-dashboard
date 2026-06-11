import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Building, Briefcase, Pencil, EyeOff } from 'lucide-react';
import { ReglaHorario } from './useWeeklyCalendar';

interface BlockData extends ReglaHorario {
  top: number;
  height: number;
  color: string;
  isContinued: boolean;
  isCortadoPart2?: boolean;
}

interface WeeklyCalendarBlockProps {
  block: BlockData;
  idx: number;
  colisionesPrevias: number;
  onEditRule?: (r: ReglaHorario) => void;
  onHideTurno?: (turno: string | number) => void;
}

export function WeeklyCalendarBlock({ block, idx, colisionesPrevias, onHideTurno }: WeeklyCalendarBlockProps) {
  const insetLeft = (colisionesPrevias * 5) + 2; // Desfasaje ligero para solapamientos
  const width = 100 - insetLeft - 2;

  // Use a fallback for turno just in case it's falsy, so the button always has a chance to work.
  const turnoName = block.turno || 'Sin Turno';

  return (
    <HoverCard openDelay={100} closeDelay={0}>
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
            <span className="font-semibold text-slate-900">{turnoName}</span>
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

          {/* Ocultar Turno button - always render if onHideTurno exists */}
          {onHideTurno && (
            <button 
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation(); 
                const idToHide = block.id_horario || (block as any).id;
                console.log("Ocultando regla ID:", idToHide);
                if (idToHide) {
                  onHideTurno(idToHide); 
                }
              }}
              className="w-full mt-2 pt-2 border-t border-slate-100 text-xs font-medium text-slate-500 hover:text-indigo-600 text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Ocultar {turnoName}
            </button>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
