import React from 'react';
import { DAYS } from './useWeeklyCalendar';

interface WeeklyCalendarGridProps {
  children: (dayValue: number) => React.ReactNode;
}

export function WeeklyCalendarGrid({ children }: WeeklyCalendarGridProps) {
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
          {[0, 4, 8, 12, 16, 20, 24].map((hour) => (
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
            {children(day.value)}
          </div>
        ))}

      </div>
    </div>
  );
}
