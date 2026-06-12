import React from 'react';
import { usePlanificadorSemanal } from '../../hooks/usePlanificadorSemanal';
import { GrillaAsignacion } from './GrillaAsignacion';
import { ListadoPlanesGuardados } from './ListadoPlanesGuardados';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, Save, Filter, History, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function PlanificadorTurnos() {
  const {
    sector, setSector,
    fechaInicio, setFechaInicio,
    fechaFin, setFechaFin,
    nombrePlan, setNombrePlan,
    asignaciones,
    handleSelectTurno,
    handleSelectMasivo,
    handleSave,
    personalPlanificable,
    turnosBase,
    sectores,
    isLoading,
    isSaving,
    toggleCapacitacion,
    handleEditPlan,
    handleResetPlan
  } = usePlanificadorSemanal();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Planificador Ágil de Turnos</h2>
        <p className="text-slate-500">Asigna turnos rotativos a tu personal, excluyendo automáticamente a quienes tengan licencias.</p>
      </div>

      <Card className="border-indigo-100 shadow-sm">
        <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <CardTitle className="text-lg text-indigo-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            Configuración de Planificación
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetPlan}
            className="flex items-center gap-2 bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Nueva Planificación
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Sector a Planificar</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Seleccione Sector...</option>
                {sectores.map(s => (
                  <option key={s.idSector} value={s.idSector.toString()}>{s.descripcion}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Fecha de Inicio</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Fecha de Fin (Inclusive)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="date"
                  value={fechaFin}
                  min={fechaInicio}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nombre del Plan (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Cambio de turno, Refuerzo fin de semana..."
                value={nombrePlan}
                onChange={(e) => setNombrePlan(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grilla solo se muestra si están los 3 filtros */}
      {sector && fechaInicio && fechaFin ? (
        <div className="space-y-4">
          <GrillaAsignacion
            personal={personalPlanificable}
            turnosBase={turnosBase}
            sectores={sectores}
            asignaciones={asignaciones as any}
            onSelectTurno={handleSelectTurno}
            onSelectMasivo={handleSelectMasivo}
            onToggleCapacitacion={toggleCapacitacion}
            isLoading={isLoading}
          />
          
          {personalPlanificable.length > 0 && (
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || Object.keys(asignaciones).length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Guardando...' : 'Guardar Planificación Semanal'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-700">Esperando configuración</h3>
          <p className="text-slate-500 max-w-md mx-auto mt-2">
            Selecciona un sector, una fecha de inicio y una fecha de fin para comenzar a asignar turnos al personal rotativo.
          </p>
        </div>
      )}

      {/* Separador y Listado de Planes Guardados */}
      <div className="pt-10 pb-6 border-t border-slate-200 mt-12">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <History className="w-6 h-6 text-indigo-600" />
          Historial de Planes Generados
        </h3>
        <p className="text-slate-500 mb-6">Listado de todas las planificaciones que han sido guardadas en el sistema ordenadas por fecha más reciente.</p>
        <ListadoPlanesGuardados onEditPlan={handleEditPlan} />
      </div>
    </div>
  );
}
