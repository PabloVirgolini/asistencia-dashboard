import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX } from "lucide-react";
import DetalleListaModal, { PersonDetail } from "./DetalleListaModal";

interface ResumenDiaProps {
  summary: {
    totalActivos: number;
    presentes: number;
    ausentes: number;
    licencias: number;
    porcentajePresentes: number;
    porcentajeAusentes: number;
  };
  date: string;
  sector: string;
  grupos?: any[];
}

export default function ResumenDia({ summary, date, sector, grupos }: ResumenDiaProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalPeople, setModalPeople] = useState<PersonDetail[]>([]);

  const handleOpenModal = (type: 'esperados' | 'presentes' | 'ausentes' | 'licencias') => {
    if (!grupos) return;
    const people: PersonDetail[] = [];
    grupos.forEach(g => {
      if (type === 'esperados') {
        const list = [...g.presentes, ...g.ausentes, ...g.licencias, ...g.tarde];
        list.forEach(p => people.push({ legajo: p.legajo, nombre: p.nombre, sector: p.sector, cargo: p.cargo, turno: g.nombre_turno }));
      } else if (type === 'presentes') {
        [...g.presentes, ...g.fichadas_inesperadas].forEach(p => people.push({ legajo: p.legajo, nombre: p.nombre, sector: p.sector, cargo: p.cargo, turno: g.nombre_turno, extra: 'A tiempo' }));
        g.tarde.forEach((p: any) => people.push({ legajo: p.legajo, nombre: p.nombre, sector: p.sector, cargo: p.cargo, turno: g.nombre_turno, extra: 'Llegada Tarde' }));
      } else if (type === 'ausentes') {
        g.ausentes.forEach((p: any) => people.push({ legajo: p.legajo, nombre: p.nombre, sector: p.sector, cargo: p.cargo, turno: g.nombre_turno }));
      } else if (type === 'licencias') {
        g.licencias.forEach((p: any) => people.push({ legajo: p.legajo, nombre: p.nombre, sector: p.sector, cargo: p.cargo, turno: g.nombre_turno, extra: p.novedad_activa?.tipo, fecha_fin: p.novedad_activa?.fecha_fin }));
      }
    });
    
    // Ordenar alfabéticamente
    people.sort((a, b) => a.nombre.localeCompare(b.nombre));

    setModalPeople(people);
    setModalTitle(
      type === 'esperados' ? 'Esperados en Turno' : 
      type === 'presentes' ? 'Personal Presente' : 
      type === 'ausentes' ? 'Personal Ausente' : 'Licencias'
    );
    setModalOpen(true);
  };
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {formatDate(date)}
          {sector !== "todos" && ` - ${sector}`}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total de Personal */}
        <Card 
          className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-slate-300 hover:bg-slate-50"
          onClick={() => handleOpenModal('esperados')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  Esperados en Turno
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {summary.totalActivos}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Presentes */}
        <Card 
          className="border-emerald-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-emerald-300 hover:bg-emerald-50"
          onClick={() => handleOpenModal('presentes')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  Presentes
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  {summary.presentes}
                </p>
                <p className="text-xs text-emerald-600 mt-2">
                  {summary.porcentajePresentes}% de asistencia
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ausentes */}
        <Card 
          className="border-red-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-red-300 hover:bg-red-50"
          onClick={() => handleOpenModal('ausentes')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  Ausentes
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {summary.ausentes}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  {summary.porcentajeAusentes}% de inasistencia
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Licencias */}
        <Card 
          className="border-amber-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-amber-300 hover:bg-amber-50"
          onClick={() => handleOpenModal('licencias')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  Licencias
                </p>
                <p className="text-3xl font-bold text-amber-600">
                  {summary.licencias}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progreso visual */}
      <div className="mt-6 bg-white rounded-lg p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">Distribución</p>
          <p className="text-xs text-slate-500">
            {summary.presentes} / {summary.totalActivos}
          </p>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full transition-all duration-300"
            style={{
              width: `${summary.totalActivos > 0 ? (summary.presentes / summary.totalActivos) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <DetalleListaModal 
        isOpen={modalOpen} 
        onOpenChange={setModalOpen} 
        title={modalTitle} 
        people={modalPeople} 
      />
    </div>
  );
}
