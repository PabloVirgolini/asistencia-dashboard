import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX } from "lucide-react";

interface ResumenDiaProps {
  summary: {
    totalActivos: number;
    presentes: number;
    ausentes: number;
    porcentajePresentes: number;
    porcentajeAusentes: number;
  };
  date: string;
  sector: string;
}

export default function ResumenDia({ summary, date, sector }: ResumenDiaProps) {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total de Personal */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  Total de Personal
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
        <Card className="border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
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
        <Card className="border-red-200 shadow-sm hover:shadow-md transition-shadow">
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
    </div>
  );
}
