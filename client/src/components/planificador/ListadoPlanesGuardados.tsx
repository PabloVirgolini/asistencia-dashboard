import React from 'react';
import { Loader2, Calendar, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { VisorPlanSemanal } from './VisorPlanSemanal';
import { useListadoPlanesGuardados } from '../../hooks/useListadoPlanesGuardados';

export function ListadoPlanesGuardados({ onEditPlan }: { onEditPlan?: (sector: string, fechaInicio: string, fechaFin: string) => void }) {
  const {
    planes,
    isLoading,
    expandedPlanIndex,
    toggleExpand,
    handleDeletePlan
  } = useListadoPlanesGuardados();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!planes || planes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No hay planes generados en el historial.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {planes.map((plan: any, index: number) => {
        const isExpanded = expandedPlanIndex === index;
        const fechaInicioFormatted = new Date(plan.fecha_inicio).toLocaleDateString('es-AR', { timeZone: 'UTC' });
        const fechaFinFormatted = plan.fecha_fin ? new Date(plan.fecha_fin).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : 'Indefinido';

        return (
          <div key={index} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200">
            <button 
              onClick={() => toggleExpand(index)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left focus:outline-none group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-lg">Sector {plan.sector_descripcion}</h4>
                  <p className="text-sm text-slate-500">
                    Planificación del <span className="font-medium text-slate-700">{fechaInicioFormatted}</span> al <span className="font-medium text-slate-700">{fechaFinFormatted}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {onEditPlan && (
                  <div 
                    role="button"
                    tabIndex={0}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditPlan(plan.sector, plan.fecha_inicio, plan.fecha_fin || plan.fecha_inicio);
                    }}
                    title="Editar Planificación"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </div>
                )}
                <div 
                  role="button"
                  tabIndex={0}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  onClick={(e) => handleDeletePlan(e, plan.sector, plan.fecha_inicio, plan.fecha_fin)}
                  title="Eliminar Planificación"
                >
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="text-slate-400 p-2">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </button>
            
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                <VisorPlanSemanal 
                  sector={plan.sector} 
                  fechaInicio={plan.fecha_inicio} 
                  fechaFin={plan.fecha_fin || plan.fecha_inicio} 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
