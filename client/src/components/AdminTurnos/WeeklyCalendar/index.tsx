import React from 'react';
import { useWeeklyCalendar, ReglaHorario } from './useWeeklyCalendar';
import { WeeklyCalendarGrid } from './WeeklyCalendarGrid';
import { WeeklyCalendarBlock } from './WeeklyCalendarBlock';

interface WeeklyCalendarProps {
  reglas: ReglaHorario[];
  onEditRule?: (r: ReglaHorario) => void;
  onHideTurno?: (turno: string | number) => void;
}

export default function WeeklyCalendar({ reglas, onEditRule, onHideTurno }: WeeklyCalendarProps) {
  const { blocksByDay } = useWeeklyCalendar(reglas);

  return (
    <WeeklyCalendarGrid>
      {(dayValue) => (
        <>
          {blocksByDay[dayValue].map((block, idx) => {
            const colisionesPrevias = blocksByDay[dayValue].filter((b, i) => 
              i < idx && b.top < block.top + block.height && b.top + b.height > block.top
            ).length;

            return (
              <WeeklyCalendarBlock
                key={`${block.id_horario}-${idx}`}
                block={block}
                idx={idx}
                colisionesPrevias={colisionesPrevias}
                onEditRule={onEditRule}
                onHideTurno={onHideTurno}
              />
            );
          })}
        </>
      )}
    </WeeklyCalendarGrid>
  );
}
