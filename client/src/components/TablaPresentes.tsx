import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface Presente {
  legajo: string;
  nombre: string;
  sector: string;
  primeraFichada: string;
}

interface TablaPresentesProps {
  presentes: Presente[];
}

export default function TablaPresentes({ presentes }: TablaPresentesProps) {
  const formatTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateTimeStr;
    }
  };

  const getSectorColor = (sector: string) => {
    const colors: Record<string, string> = {
      "Termoformado": "bg-purple-100 text-purple-800",
      "Limpieza": "bg-blue-100 text-blue-800",
      "Deposito": "bg-amber-100 text-amber-800",
      "IMPRESORAS": "bg-pink-100 text-pink-800",
      "Produccion": "bg-green-100 text-green-800",
    };
    return colors[sector] || "bg-slate-100 text-slate-800";
  };

  return (
    <Card className="border-emerald-200 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-transparent">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-emerald-900">
            Personas Presentes ({presentes.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {presentes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No hay personas presentes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-slate-50">
                  <TableHead className="text-slate-700 font-semibold">
                    Nombre
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold">
                    Legajo
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold">
                    Sector
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold">
                    Hora de Entrada
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presentes.map((presente) => (
                  <TableRow
                    key={presente.legajo}
                    className="border-slate-100 hover:bg-emerald-50 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">
                      {presente.nombre}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {presente.legajo}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${getSectorColor(presente.sector)} border-0`}
                      >
                        {presente.sector}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-emerald-600 font-medium">
                      {formatTime(presente.primeraFichada)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
