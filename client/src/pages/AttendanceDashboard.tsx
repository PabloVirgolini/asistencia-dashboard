import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle2, Users, UserCheck, UserX } from "lucide-react";
import TablaPresentes from "@/components/TablaPresentes";
import TablaAusentes from "@/components/TablaAusentes";
import SelectorFecha from "@/components/SelectorFecha";
import ResumenDia from "@/components/ResumenDia";

export default function AttendanceDashboard() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("todos");
  const [showEncargados, setShowEncargados] = useState<boolean>(true);
  const [toleranciaMinutos, setToleranciaMinutos] = useState<number>(0);
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Obtener fecha de hoy
  const todayQuery = trpc.attendance.getTodayDate.useQuery();

  // Obtener sectores disponibles
  const sectorsQuery = trpc.attendance.getSectors.useQuery();

  // Obtener datos de asistencia
  const attendanceQuery = trpc.attendance.getByDate.useQuery(
    {
      date: selectedDate || todayQuery.data?.date || "",
      sector: selectedSector === "todos" ? undefined : selectedSector,
      toleranciaMinutos: toleranciaMinutos,
    },
    {
      enabled: !!selectedDate || !!todayQuery.data?.date,
    }
  );

  // Inicializar fecha de hoy (solo una vez)
  useEffect(() => {
    if (todayQuery.data?.date && !selectedDate) {
      setSelectedDate(todayQuery.data.date);
    }
  }, [todayQuery.data?.date]);

  // Configurar actualización automática cada hora
  useEffect(() => {
    const calculateNextUpdateTime = () => {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1);
      nextHour.setMinutes(0);
      nextHour.setSeconds(0);
      nextHour.setMilliseconds(0);
      return nextHour;
    };

    const scheduleNextUpdate = () => {
      const nextUpdate = calculateNextUpdateTime();
      setNextUpdateTime(nextUpdate);

      const timeUntilNextHour = nextUpdate.getTime() - Date.now();

      // Limpiar timeout anterior si existe
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Configurar nuevo timeout
      updateTimeoutRef.current = setTimeout(() => {
        attendanceQuery.refetch();
        scheduleNextUpdate();
      }, timeUntilNextHour);
    };

    scheduleNextUpdate();

    // Cleanup
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Calcular tiempo hasta próxima actualización
  const calculateTimeRemaining = () => {
    if (!nextUpdateTime) return { minutes: 0, seconds: 0 };
    const now = new Date();
    const diff = nextUpdateTime.getTime() - now.getTime();
    if (diff <= 0) return { minutes: 0, seconds: 0 };
    return {
      minutes: Math.floor(diff / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };

  const timeRemaining = calculateTimeRemaining();

  const isLoading = todayQuery.isLoading || attendanceQuery.isLoading;
  const isError = todayQuery.isError || attendanceQuery.isError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Dashboard de Asistencia
              </h1>
              <p className="text-slate-600">
                Monitoreo en tiempo real del personal
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">
                Próxima actualización en {timeRemaining.minutes}:{String(timeRemaining.seconds).padStart(2, "0")}
              </p>
              <Button
                onClick={() => attendanceQuery.refetch()}
                disabled={attendanceQuery.isFetching}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                {attendanceQuery.isFetching ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Ahora"
                )}
              </Button>
            </div>
          </div>

          {/* Controles */}
          <div className="flex gap-4 flex-wrap items-end mb-6">
            <div>
              <Label className="mb-2 block text-sm font-medium text-slate-700">Fecha</Label>
              <SelectorFecha
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium text-slate-700">Sector</Label>
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Seleccionar sector..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los sectores</SelectItem>
                  {sectorsQuery.data?.map((sector) => (
                    <SelectItem
                      key={sector.idSector}
                      value={sector.idSector.toString()}
                    >
                      {sector.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium text-slate-700">Tolerancia Tarde: {toleranciaMinutos} mins</Label>
              <div className="flex items-center gap-2 h-10 px-3 bg-white border border-slate-200 rounded-md shadow-sm w-48">
                <input 
                  type="range" 
                  min="0" 
                  max="60" 
                  step="5"
                  value={toleranciaMinutos} 
                  onChange={(e) => setToleranciaMinutos(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes de estado */}
        {isError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">
                Error al cargar los datos. Por favor, intenta nuevamente.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Spinner className="h-12 w-12 mx-auto mb-4" />
              <p className="text-slate-600">Cargando datos de asistencia...</p>
            </div>
          </div>
        ) : attendanceQuery.data ? (
          <>
            {/* Resumen del día */}
            <ResumenDia
              summary={attendanceQuery.data.summary}
              date={attendanceQuery.data.date}
              sector={attendanceQuery.data.sector}
            />

            {/* Tablas de asistencia */}
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md border border-slate-200 shadow-sm">
                <Switch id="show-encargados" checked={showEncargados} onCheckedChange={setShowEncargados} />
                <Label htmlFor="show-encargados" className="text-slate-600 font-medium cursor-pointer">Resaltar Encargados</Label>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TablaPresentes presentes={attendanceQuery.data.presentes} showEncargados={showEncargados} />
              <TablaAusentes ausentes={attendanceQuery.data.ausentes} showEncargados={showEncargados} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
