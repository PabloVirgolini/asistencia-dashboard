import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2, Edit2, ArrowUpDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

const getSectorColor = (sector: string) => {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-emerald-100 text-emerald-800',
    'bg-amber-100 text-amber-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-cyan-100 text-cyan-800',
    'bg-orange-100 text-orange-800',
    'bg-rose-100 text-rose-800',
    'bg-teal-100 text-teal-800',
    'bg-indigo-100 text-indigo-800',
  ];
  if (!sector) return 'bg-slate-100 text-slate-800';
  let hash = 0;
  for (let i = 0; i < sector.length; i++) {
    hash = sector.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export function TabPersonal() {
  const trpcContext = trpc.useContext();
  
  const { data: sectores } = trpc.attendance.getSectors.useQuery();
  const { data: personal, isLoading: isPersonalLoading } = trpc.admin.getPersonal.useQuery();
  const { data: cargos } = trpc.admin.getCargos.useQuery();
  const { data: sectoresCargos } = trpc.admin.getSectoresCargos.useQuery();

  const addPersonMutation = trpc.admin.addPerson.useMutation();
  const editPersonMutation = trpc.admin.editPerson.useMutation();
  const removePersonMutation = trpc.admin.removePerson.useMutation();

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [legajo, setLegajo] = useState('');
  const [nombre, setNombre] = useState('');
  const [personaSector, setPersonaSector] = useState('');
  const [personaCargo, setPersonaCargo] = useState('1');
  const [personaEsRotativo, setPersonaEsRotativo] = useState<number>(0);
  const [editingPerson, setEditingPerson] = useState<string | null>(null);

  const cargosFiltradosPorSector = useMemo(() => {
    if (!personaSector || !sectoresCargos || !cargos) return [];
    const sectorId = parseInt(personaSector);
    const validCargoIds = sectoresCargos.filter((sc: any) => sc.id_sector === sectorId).map((sc: any) => sc.id_cargo);
    return cargos.filter((c: any) => validCargoIds.includes(c.id_cargo));
  }, [personaSector, sectoresCargos, cargos]);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filterText, setFilterText] = useState('');

  const sortedAndFilteredPersonal = useMemo(() => {
    let result = personal ? [...personal] : [];
    
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      result = result.filter((p: any) => 
        p.legajo.toLowerCase().includes(lowerFilter) ||
        p.nombre.toLowerCase().includes(lowerFilter) ||
        (p.sectorPertenencia && p.sectorPertenencia.toString().toLowerCase().includes(lowerFilter)) ||
        (p.cargo && p.cargo.toString().toLowerCase().includes(lowerFilter))
      );
    }
    
    if (sortConfig) {
      result.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [personal, sortConfig, filterText]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPerson) {
        await editPersonMutation.mutateAsync({
          legajo,
          nombre,
          sector: personaSector,
          activo: 1,
          cargo_id: parseInt(personaCargo),
          es_rotativo: personaEsRotativo
        });
        toast.success('Empleado actualizado');
      } else {
        await addPersonMutation.mutateAsync({
          legajo,
          nombre,
          sector: personaSector,
          cargo_id: parseInt(personaCargo),
          es_rotativo: personaEsRotativo
        });
        toast.success('Empleado añadido');
      }
      setIsPersonModalOpen(false);
      setEditingPerson(null);
      trpcContext.admin.getPersonal.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar empleado');
    }
  };

  const openEditPerson = (p: any) => {
    setEditingPerson(p.legajo);
    setLegajo(p.legajo);
    setNombre(p.nombre);
    
    if (sectores) {
      const s = sectores.find((s: any) => s.descripcion === p.sectorPertenencia);
      setPersonaSector(s ? s.idSector.toString() : '');
    } else {
      setPersonaSector('');
    }
    
    setPersonaCargo(p.cargo_id?.toString() || '1');
    setPersonaEsRotativo(p.es_rotativo || 0);
    setIsPersonModalOpen(true);
  };

  const openAddPerson = () => {
    setEditingPerson(null);
    setLegajo('');
    setNombre('');
    setPersonaSector('');
    setPersonaCargo('');
    setPersonaEsRotativo(0);
    setIsPersonModalOpen(true);
  };

  const handleRemovePerson = async (legajo: string) => {
    if (!confirm('¿Seguro que deseas dar de baja a este empleado?')) return;
    try {
      await removePersonMutation.mutateAsync({ legajo });
      toast.success('Empleado eliminado');
      trpcContext.admin.getPersonal.invalidate();
    } catch (err: any) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Directorio de Empleados</CardTitle>
        <Dialog open={isPersonModalOpen} onOpenChange={setIsPersonModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddPerson} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Añadir Empleado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPerson ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSavePerson} className="space-y-4">
              <div>
                <Label>Legajo (Único)</Label>
                <Input value={legajo} onChange={e => setLegajo(e.target.value)} disabled={!!editingPerson} required />
              </div>
              <div>
                <Label>Nombre Completo</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} required />
              </div>
              <div>
                <Label>Sector</Label>
                <Select value={personaSector} onValueChange={(val) => {
                  setPersonaSector(val);
                  setPersonaCargo('');
                }} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectores?.map((s: any) => (
                      <SelectItem key={s.idSector} value={s.idSector.toString()}>{s.idSector} - {s.descripcion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cargo / Función</Label>
                <Select value={personaCargo} onValueChange={setPersonaCargo} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargosFiltradosPorSector.length > 0 ? (
                      cargosFiltradosPorSector.map((c: any) => (
                        <SelectItem key={c.id_cargo} value={c.id_cargo.toString()}>{c.descripcion}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="0" disabled>No hay cargos habilitados en este sector</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-2 pb-2">
                <input 
                  type="checkbox" 
                  id="es_rotativo" 
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={personaEsRotativo === 1}
                  onChange={(e) => setPersonaEsRotativo(e.target.checked ? 1 : 0)}
                />
                <Label htmlFor="es_rotativo" className="font-medium cursor-pointer">
                  Es Personal Rotativo
                </Label>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                Guardar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Buscar por nombre, legajo o sector..." 
            className="pl-9"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        {isPersonalLoading ? <Loader2 className="animate-spin mx-auto my-8 text-indigo-600" /> : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('legajo')}>
                    <div className="flex items-center gap-1 font-semibold text-slate-700">Legajo <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('nombre')}>
                    <div className="flex items-center gap-1 font-semibold text-slate-700">Nombre <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('sectorPertenencia')}>
                    <div className="flex items-center gap-1 font-semibold text-slate-700">Sector <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('cargo')}>
                    <div className="flex items-center gap-1 font-semibold text-slate-700">Cargo / Función <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredPersonal.map((p: any) => (
                <TableRow key={p.legajo}>
                  <TableCell className="font-medium">{p.legajo}</TableCell>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSectorColor(p.sectorPertenencia)}`}>
                      {p.sectorPertenencia}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.cargo_id && p.cargo_id > 1 ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                      {p.cargo || 'Operario'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditPerson(p)}>
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRemovePerson(p.legajo)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sortedAndFilteredPersonal.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-6">
                    No se encontraron empleados
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
