import React from 'react';
import { trpc } from '@/lib/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CalendarClock, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface VisorPlanSemanalProps {
  sector: string;
  fechaInicio: string;
  fechaFin: string;
}

export function VisorPlanSemanal({ sector, fechaInicio, fechaFin }: VisorPlanSemanalProps) {
  const { data: planificacion, isLoading, error } = trpc.admin.getPlanificacionGuardada.useQuery(
    { sector, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    { enabled: !!sector && !!fechaInicio && !!fechaFin }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-rose-600 bg-rose-50 rounded-lg">
        <p>Error al cargar la planificación: {error.message}</p>
      </div>
    );
  }

  if (!planificacion || planificacion.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
        <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-700">Sin Planificación</h3>
        <p className="text-slate-500 max-w-md mx-auto mt-2">
          No hay turnos planificados para este sector en el rango de fechas seleccionado.
        </p>
      </div>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Empleado / Legajo</TableHead>
              <TableHead className="font-semibold text-slate-700">Cargo</TableHead>
              <TableHead className="font-semibold text-slate-700 text-center">Estado Formación</TableHead>
              <TableHead className="font-semibold text-slate-700">Turno Asignado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planificacion.map((p: any) => (
              <TableRow key={p.legajo} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="font-medium text-slate-800">{p.nombre}</div>
                  <div className="text-xs text-slate-500">{p.legajo}</div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.cargo_id && p.cargo_id > 1 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'}`}>
                    {p.cargo || 'Operario'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.enCapacitacion === '1' || p.enCapacitacion === 1 || p.enCapacitacion === true ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    {p.enCapacitacion === '1' || p.enCapacitacion === 1 || p.enCapacitacion === true ? 'En Capacitación' : 'Normal'}
                  </span>
                </TableCell>
                <TableCell>
                  {p.es_excepcional === 1 ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-white shadow-sm w-fit">
                          <Zap className="w-3 h-3 text-amber-400" />
                          Excepcional
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {p.hora_entrada_excepcional} a {p.hora_salida_excepcional}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(p.turno_fecha_inicio).toLocaleDateString('es-AR', { timeZone: 'UTC' })} al {new Date(p.turno_fecha_fin).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 w-fit">
                        {p.turno_descripcion || 'No especificado'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(p.turno_fecha_inicio).toLocaleDateString('es-AR', { timeZone: 'UTC' })} al {new Date(p.turno_fecha_fin).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                      </span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
