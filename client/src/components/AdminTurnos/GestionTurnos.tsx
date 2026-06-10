import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Clock, Loader2 } from 'lucide-react';

interface Turno {
  id_turno: number;
  descripcion: string;
}

interface GestionTurnosProps {
  turnos?: Turno[];
  isLoading: boolean;
  onAddTurno: (descripcion: string) => Promise<void>;
  onRemoveTurno: (id: number) => Promise<void>;
}

export default function GestionTurnos({ turnos, isLoading, onAddTurno, onRemoveTurno }: GestionTurnosProps) {
  const [nuevoTurnoDesc, setNuevoTurnoDesc] = useState('');
  const [selectedTurnoParaEliminar, setSelectedTurnoParaEliminar] = useState<string>('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTurnoDesc.trim()) return;
    await onAddTurno(nuevoTurnoDesc);
    setNuevoTurnoDesc('');
  };

  return (
    <Card className="border-indigo-100 shadow-md">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 py-4 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-indigo-950 font-bold tracking-tight m-0 leading-none pt-1">
            TURNOS MAESTROS
          </CardTitle>
          <div className="text-xs font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full uppercase tracking-wider">
            {isLoading ? <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> : turnos?.length || 0} Registrados
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> Crear Nuevo Turno
            </h3>
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input 
                value={nuevoTurnoDesc}
                onChange={e => setNuevoTurnoDesc(e.target.value)}
                placeholder="Ej. Mañana, Tarde, Noche..."
                className="bg-white shadow-sm border-slate-200 focus-visible:ring-emerald-500"
              />
              <Button type="submit" disabled={!nuevoTurnoDesc.trim()} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all text-white">
                Guardar
              </Button>
            </form>
          </div>

          <div className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" /> Eliminar Turno
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Select value={selectedTurnoParaEliminar} onValueChange={setSelectedTurnoParaEliminar}>
                  <SelectTrigger className="bg-white shadow-sm border-slate-200">
                    <SelectValue placeholder="Seleccionar turno a eliminar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {turnos?.map((t) => (
                      <SelectItem key={t.id_turno} value={t.id_turno.toString()}>{t.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="button"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto transition-colors"
                disabled={!selectedTurnoParaEliminar}
                onClick={async () => {
                  if (selectedTurnoParaEliminar) {
                    await onRemoveTurno(parseInt(selectedTurnoParaEliminar));
                    setSelectedTurnoParaEliminar('');
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
