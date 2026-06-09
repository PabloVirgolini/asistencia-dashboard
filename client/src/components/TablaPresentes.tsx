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
import { Input } from "@/components/ui/input";
import { CheckCircle2, ArrowUpDown, Search } from "lucide-react";
import React, { useState } from "react";

interface Presente {
  legajo: string;
  nombre: string;
  sector: string;
  cargo: string;
  nivel_criticidad: number;
  primeraFichada: string;
  llegadaTarde?: boolean;
}

interface TablaPresentesProps {
  presentes: Presente[];
  showEncargados?: boolean;
}

export default function TablaPresentes({ presentes, showEncargados = true }: TablaPresentesProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Presente, direction: 'asc' | 'desc' } | null>(null);
  const [filterText, setFilterText] = useState('');

  const sortedAndFilteredPresentes = React.useMemo(() => {
    let result = [...presentes];
    
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      result = result.filter(p => 
        p.nombre.toLowerCase().includes(lowerFilter) ||
        p.legajo.toLowerCase().includes(lowerFilter) ||
        p.sector.toLowerCase().includes(lowerFilter)
      );
    }
    
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [presentes, sortConfig, filterText]);

  const handleSort = (key: keyof Presente) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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
        <div className="mb-4 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Buscar por nombre, legajo o sector..." 
            className="pl-9"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        {presentes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No hay personas presentes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-slate-50">
                  <TableHead className="text-slate-700 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('nombre')}>
                    <div className="flex items-center gap-1">Nombre <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('legajo')}>
                    <div className="flex items-center gap-1">Legajo <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('sector')}>
                    <div className="flex items-center gap-1">Sector <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('primeraFichada')}>
                    <div className="flex items-center gap-1">Hora de Entrada <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredPresentes.map((presente) => (
                  <TableRow
                    key={presente.legajo}
                    className="border-slate-100 hover:bg-emerald-50 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">
                      {showEncargados && presente.cargo?.toLowerCase().includes("encargado") ? `(E) ${presente.nombre}` : presente.nombre}
                      {presente.llegadaTarde && (
                        <Badge variant="outline" className="ml-2 bg-orange-50 text-orange-700 border-orange-200">
                          Llegó Tarde
                        </Badge>
                      )}
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
                {sortedAndFilteredPresentes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-6">
                      No se encontraron coincidencias
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
