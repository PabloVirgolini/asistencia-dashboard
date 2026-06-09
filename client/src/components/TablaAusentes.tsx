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
import { UserX, ArrowUpDown, Search } from "lucide-react";
import React, { useState } from "react";

interface Ausente {
  legajo: string;
  nombre: string;
  sector: string;
  cargo: string;
  nivel_criticidad: number;
}

interface TablaAusentesProps {
  ausentes: Ausente[];
  showEncargados?: boolean;
}

export default function TablaAusentes({ ausentes, showEncargados = true }: TablaAusentesProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Ausente, direction: 'asc' | 'desc' } | null>(null);
  const [filterText, setFilterText] = useState('');

  const sortedAndFilteredAusentes = React.useMemo(() => {
    let result = [...ausentes];
    
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      result = result.filter(a => 
        a.nombre.toLowerCase().includes(lowerFilter) ||
        a.legajo.toLowerCase().includes(lowerFilter) ||
        a.sector.toLowerCase().includes(lowerFilter)
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
  }, [ausentes, sortConfig, filterText]);

  const handleSort = (key: keyof Ausente) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
    <Card className="border-red-200 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b border-red-100 bg-gradient-to-r from-red-50 to-transparent">
        <div className="flex items-center gap-2">
          <UserX className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-900">
            Personas Ausentes ({ausentes.length})
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
        {ausentes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">¡Excelente! Todo el personal asistió</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredAusentes.map((ausente) => (
                  <TableRow
                    key={ausente.legajo}
                    className={`border-slate-100 transition-colors ${ausente.nivel_criticidad > 1 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-red-50'}`}
                  >
                    <TableCell className="font-medium text-slate-900">
                      {showEncargados && ausente.cargo?.toLowerCase().includes("encargado") ? `(E) ${ausente.nombre}` : ausente.nombre}
                      {ausente.nivel_criticidad > 1 && (
                        <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 border-red-200">
                          Cargo Crítico
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {ausente.legajo}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${getSectorColor(ausente.sector)} border-0`}
                      >
                        {ausente.sector}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedAndFilteredAusentes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 py-6">
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
