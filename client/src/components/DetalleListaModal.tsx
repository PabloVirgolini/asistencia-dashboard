import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export interface PersonDetail {
  legajo: string;
  nombre: string;
  sector: string;
  cargo: string;
  turno?: string;
  extra?: string; // used to show "Llegada Tarde" or "Vacaciones"
}

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  people: PersonDetail[];
}

export default function DetalleListaModal({ isOpen, onOpenChange, title, people }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title} ({people.length})</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {people.length === 0 ? (
            <p className="text-slate-500 italic text-center py-4">No hay registros</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {people.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div>
                    <p className="font-medium text-slate-800">{p.nombre} <span className="text-slate-400 text-xs font-normal">({p.legajo})</span></p>
                    <p className="text-xs text-slate-500">{p.sector} - {p.cargo}</p>
                    {p.turno && <p className="text-xs text-indigo-600 font-medium mt-0.5">Turno: {p.turno}</p>}
                  </div>
                  {p.extra && (
                    <Badge variant="secondary" className="bg-white">
                      {p.extra}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
