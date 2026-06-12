import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Clock, MapPin } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';

interface HistorialFichadasModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  legajo: string;
  nombre: string;
  date: string;
}

export default function HistorialFichadasModal({ isOpen, onOpenChange, legajo, nombre, date }: HistorialFichadasModalProps) {
  const { data: fichadas, isLoading } = trpc.attendance.getFichadasByLegajo.useQuery(
    { legajo, date },
    { enabled: isOpen && !!legajo && !!date }
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Historial de Fichadas
          </DialogTitle>
          <DialogDescription>
            Mostrando registros de <strong>{nombre}</strong> (Legajo: {legajo}) para la fecha {date.split('-').reverse().join('/')}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : !fichadas || fichadas.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-md border border-dashed border-slate-200">
              <p className="text-slate-500 italic">No hay registros de entradas o salidas para este día.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>ID Reloj</TableHead>
                    <TableHead>Nro Fichada</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fichadas.map((fichada, idx) => (
                    <TableRow key={fichada.nroFichada} className="hover:bg-slate-50">
                      <TableCell className="font-semibold text-slate-700">
                        {fichada.hora.split(' ')[1]}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-500 text-sm">
                          <MapPin className="w-3 h-3" /> Reloj {fichada.reloj}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 font-mono text-sm">
                        #{fichada.nroFichada}
                      </TableCell>
                      <TableCell className="text-right">
                        {idx === 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">Primera Entrada</Badge>
                        ) : idx === fichadas.length - 1 && fichadas.length % 2 === 0 ? (
                          <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none">Salida</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">Intermedia</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
