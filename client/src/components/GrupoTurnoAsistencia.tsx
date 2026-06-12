import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, User, Filter } from 'lucide-react';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface AttendancePerson {
  legajo: string;
  nombre: string;
  sector: string;
  cargo: string;
  nivel_criticidad: number;
  es_rotativo: boolean;
  id_turno: number | null;
  fichadas: string[];
  llegadaTarde: boolean;
  novedad_activa: { tipo: string; observaciones: string; fecha_fin?: string } | null;
}

interface TurnoGroup {
  id_turno: number | null;
  nombre_turno: string;
  esperados: number;
  presentes: AttendancePerson[];
  ausentes: AttendancePerson[];
  licencias: AttendancePerson[];
  tarde: AttendancePerson[];
  fichadas_inesperadas: AttendancePerson[];
}

interface Props {
  grupo: TurnoGroup;
  showEncargados: boolean;
  date: string;
  inconsistencias?: any[];
}

import HistorialFichadasModal from './HistorialFichadasModal';

export default function GrupoTurnoAsistencia({ grupo, showEncargados, date, inconsistencias = [] }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalPerson, setModalPerson] = useState<{ legajo: string, nombre: string } | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  const isFueraDeTurno = grupo.id_turno === null;

  const allExpected = [...grupo.presentes, ...grupo.tarde, ...grupo.ausentes, ...grupo.licencias];
  const allPeople = [...allExpected, ...grupo.fichadas_inesperadas];
  
  const expectedBySector = allExpected.reduce((acc, p) => {
    acc[p.sector] = (acc[p.sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const breakdownText = Object.entries(expectedBySector)
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .map(([sector, count]) => `${count} ${sector}`)
    .join(', ');

  const uniqueSectors = Array.from(new Set(allPeople.map(p => p.sector))).sort();
  const activeSectors = selectedSectors.length > 0 ? selectedSectors : uniqueSectors;

  const toggleSector = (sector: string) => {
    setSelectedSectors(prev => 
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  const filterPerson = (p: AttendancePerson) => activeSectors.includes(p.sector);

  const filteredInesperadas = grupo.fichadas_inesperadas.filter(filterPerson);
  const filteredPresentes = grupo.presentes.filter(filterPerson);
  const filteredTarde = grupo.tarde.filter(filterPerson);
  const filteredAusentes = grupo.ausentes.filter(filterPerson);
  const filteredLicencias = grupo.licencias.filter(filterPerson);

  const renderFila = (p: AttendancePerson, tipo: 'presente' | 'ausente' | 'licencia' | 'tarde' | 'inesperada') => {
    const isEncargado = p.cargo.toLowerCase().includes('encargado') || p.nivel_criticidad >= 4;
    const highlight = showEncargados && isEncargado;
    const incs = inconsistencias.filter(i => i.legajo === p.legajo);

    return (
      <tr key={`${p.legajo}-${tipo}`} 
          className={cn(
            "border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer",
            highlight ? "bg-amber-50/30" : ""
          )}
          onClick={() => setModalPerson({ legajo: p.legajo, nombre: p.nombre })}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">
              {highlight && <span className="text-amber-600 font-bold mr-1">(E)</span>}
              {p.nombre}
            </span>
            <span className="text-slate-400 text-xs">({p.legajo})</span>
            {!p.es_rotativo && (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] uppercase font-bold" title="Personal Fijo">
                Fijo
              </span>
            )}
            {incs.map((inc, i) => (
              <Badge key={i} variant="outline" className={`text-[10px] py-0 px-1 border-none ${
                inc.tipo === 'Múltiples Fichadas' || inc.tipo === 'Fichada Inesperada' ? 'bg-purple-100 text-purple-700' :
                inc.tipo === 'Salida Anticipada' ? 'bg-orange-100 text-orange-700' :
                inc.tipo === 'Llegada Tarde' ? 'bg-rose-100 text-rose-700' :
                'bg-red-100 text-red-700'
              }`} title={inc.detalles}>
                {inc.tipo}
              </Badge>
            ))}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {p.sector} - {p.cargo}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          {tipo === 'presente' || tipo === 'inesperada' ? (
            <div className="flex items-center justify-end gap-2">
              {p.fichadas.map((hora, idx) => (
                <Badge key={idx} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {hora.split(' ')[1].substring(0, 5)}
                </Badge>
              ))}
            </div>
          ) : tipo === 'tarde' ? (
            <div className="flex items-center justify-end gap-2">
              {p.fichadas.map((hora, idx) => (
                <Badge key={idx} variant="outline" className={idx === 0 ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-slate-50 text-slate-600 border-slate-200"}>
                  {hora.split(' ')[1].substring(0, 5)}
                </Badge>
              ))}
            </div>
          ) : tipo === 'licencia' ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {p.novedad_activa?.tipo}
            </Badge>
          ) : (
            <span className="text-rose-500 text-sm font-medium">Sin registro</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <Card className="mb-6 overflow-hidden border-slate-200 shadow-sm">
      <div 
        className={cn(
          "px-6 py-4 flex items-center justify-between cursor-pointer select-none transition-colors",
          isFueraDeTurno ? "bg-slate-100 hover:bg-slate-200" : "bg-indigo-50/50 hover:bg-indigo-50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isFueraDeTurno ? (
            <AlertTriangle className="text-slate-500" size={20} />
          ) : (
            <Clock className="text-indigo-600" size={20} />
          )}
          <h3 className={cn("text-lg font-bold", isFueraDeTurno ? "text-slate-700" : "text-indigo-900")}>
            {grupo.nombre_turno}
          </h3>
          {!isFueraDeTurno && (
            <Badge variant="secondary" className="ml-2 bg-white text-indigo-700 border-indigo-100 font-medium">
              {grupo.esperados} Esperados {breakdownText ? `(${breakdownText})` : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {grupo.presentes.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-emerald-600 font-medium" title="Presentes a tiempo">
                <CheckCircle2 size={16} /> {grupo.presentes.length}
              </div>
            )}
            {grupo.tarde.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-orange-500 font-medium" title="Llegadas tarde">
                <Clock size={16} /> {grupo.tarde.length}
              </div>
            )}
            {grupo.ausentes.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-rose-500 font-medium" title="Ausentes">
                <XCircle size={16} /> {grupo.ausentes.length}
              </div>
            )}
            {grupo.fichadas_inesperadas.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-slate-500 font-medium" title="Inesperados">
                <User size={16} /> {grupo.fichadas_inesperadas.length}
              </div>
            )}
          </div>
          {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <CardContent className="p-0">
          <div className="bg-slate-100/50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed flex items-center gap-2">
                  <Filter size={14} className="text-slate-500" />
                  <span className="text-slate-600 font-medium">Filtrar por Sector</span>
                  {selectedSectors.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                      {selectedSectors.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white z-50">
                <DropdownMenuLabel>Sectores</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {uniqueSectors.map(sector => (
                  <DropdownMenuCheckboxItem
                    key={sector}
                    checked={selectedSectors.includes(sector)}
                    onCheckedChange={() => toggleSector(sector)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {sector}
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedSectors.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={false}
                      onCheckedChange={() => setSelectedSectors([])}
                      className="justify-center font-medium text-slate-500 cursor-pointer"
                    >
                      Limpiar Filtros
                    </DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedSectors.length > 0 && (
              <span className="text-xs text-slate-500">
                Mostrando {activeSectors.length} de {uniqueSectors.length} sectores
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Columna Izquierda: Presentes / Inesperados */}
            <div className="p-0">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Registros de Entrada</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <tbody>
                    {/* Fichadas Inesperadas */}
                    {filteredInesperadas.map(p => renderFila(p, 'inesperada'))}
                    {filteredInesperadas.length > 0 && (
                      <tr><td colSpan={2} className="px-4 py-1 bg-slate-50 text-center text-xs text-slate-400 font-medium uppercase tracking-wider">--- Fichadas Inesperadas ---</td></tr>
                    )}
                    
                    {/* Presentes a tiempo */}
                    {filteredPresentes.map(p => renderFila(p, 'presente'))}
                    
                    {/* Llegadas Tarde */}
                    {filteredTarde.map(p => renderFila(p, 'tarde'))}

                    {filteredPresentes.length === 0 && filteredTarde.length === 0 && filteredInesperadas.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">
                          No hay fichadas registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Columna Derecha: Ausentes / Licencias */}
            {!isFueraDeTurno && (
              <div className="p-0">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Faltas y Licencias</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <tbody>
                      {/* Ausentes sin justificar */}
                      {filteredAusentes.map(p => renderFila(p, 'ausente'))}
                      
                      {/* Licencias / Novedades */}
                      {filteredLicencias.map(p => renderFila(p, 'licencia'))}

                      {filteredAusentes.length === 0 && filteredLicencias.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">
                            No hay inasistencias
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}

      {modalPerson && (
        <HistorialFichadasModal
          isOpen={!!modalPerson}
          onOpenChange={(open) => !open && setModalPerson(null)}
          legajo={modalPerson.legajo}
          nombre={modalPerson.nombre}
          date={date}
        />
      )}
    </Card>
  );
}
