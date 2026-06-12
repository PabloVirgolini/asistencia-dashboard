import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NovedadesAcordeonProps {
  novedades: any[];
}

export function NovedadesAcordeon({ novedades }: NovedadesAcordeonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!novedades || novedades.length === 0) return null;

  return (
    <div className="mt-8">
      <Card className={cn(
        "overflow-hidden border-slate-200 transition-all duration-200 shadow-sm",
        isExpanded ? "ring-1 ring-indigo-100" : "hover:border-indigo-200"
      )}>
        <div 
          className="px-6 py-4 flex items-center justify-between cursor-pointer select-none transition-colors bg-white hover:bg-slate-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-800">
              Novedades del Personal
            </h3>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {novedades.length} activas
            </span>
          </div>
          <div className="flex items-center">
            {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
          </div>
        </div>

        {isExpanded && (
          <CardContent className="p-0 border-t border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Empleado</th>
                    <th className="px-6 py-3">Tipo de Novedad</th>
                    <th className="px-6 py-3 text-right">Hasta (Inclusive)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {novedades.map((nov: any, idx: number) => {
                    const [y, m, d] = nov.fecha_fin.split('-').map(Number);
                    const fechaParseada = new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                    return (
                      <tr key={`${nov.legajo}-${idx}`} className="hover:bg-slate-50 transition-colors bg-white">
                        <td className="px-6 py-3 font-medium text-slate-800">
                          {nov.nombre} <span className="text-slate-400 font-normal text-xs ml-1">({nov.legajo})</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            nov.tipo === 'Vacaciones' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            nov.tipo === 'Enfermedad' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {nov.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 font-medium">
                          {fechaParseada}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
