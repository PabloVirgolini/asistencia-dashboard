import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Plus, Trash2, Edit2, LogOut, ArrowUpDown, Search, Settings, Pencil, Check, X, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import AdminTurnos from '@/components/AdminTurnos';

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const trpcContext = trpc.useContext();
  
  const { data: user, isLoading: isUserLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false
  });
  const { data: sectores, isLoading: isSectoresLoading } = trpc.attendance.getSectors.useQuery();
  const { data: personal, isLoading: isPersonalLoading } = trpc.admin.getPersonal.useQuery(undefined, {
    enabled: !!user
  });
  const { data: cargos } = trpc.admin.getCargos.useQuery(undefined, {
    enabled: !!user
  });
  const { data: sectoresCargos } = trpc.admin.getSectoresCargos.useQuery(undefined, {
    enabled: !!user
  });

  const logoutMutation = trpc.auth.logout.useMutation();
  const addSectorMutation = trpc.admin.addSector.useMutation();
  const removeSectorMutation = trpc.admin.removeSector.useMutation();
  const updateSectorMutation = trpc.admin.updateSector.useMutation();
  const updateSectorCargosMutation = trpc.admin.updateSectorCargos.useMutation();
  
  const addCargoMutation = trpc.admin.addCargo.useMutation();
  const editCargoMutation = trpc.admin.editCargo.useMutation();
  const removeCargoMutation = trpc.admin.removeCargo.useMutation();

  const addPersonMutation = trpc.admin.addPerson.useMutation();
  const editPersonMutation = trpc.admin.editPerson.useMutation();
  const removePersonMutation = trpc.admin.removePerson.useMutation();

  // Estados para modales
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);

  // Formulario Sector
  const [sectorId, setSectorId] = useState('');
  const [sectorDesc, setSectorDesc] = useState('');

  // Edición de Sector y Configuración de Cargos
  const [editingSectorId, setEditingSectorId] = useState<number | null>(null);
  const [editSectorDesc, setEditSectorDesc] = useState('');
  
  const [isCargosModalOpen, setIsCargosModalOpen] = useState(false);
  const [selectedConfigSector, setSelectedConfigSector] = useState<number | null>(null);
  const [cargosParams, setCargosParams] = useState<{id_cargo: number, nivel_criticidad: number}[]>([]);

  // Formulario y Estados Cargos
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [cargoDesc, setCargoDesc] = useState('');
  const [inlineCargoDesc, setInlineCargoDesc] = useState('');
  const [editingCargoId, setEditingCargoId] = useState<number | null>(null);
  const [editCargoDesc, setEditCargoDesc] = useState('');
  const [cargoSortConfig, setCargoSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [cargoFilterText, setCargoFilterText] = useState('');

  const sortedAndFilteredCargos = React.useMemo(() => {
    let result = cargos ? [...cargos] : [];
    if (cargoFilterText) {
      const lowerFilter = cargoFilterText.toLowerCase();
      result = result.filter((c: any) => 
        c.id_cargo.toString().includes(lowerFilter) ||
        c.descripcion.toLowerCase().includes(lowerFilter)
      );
    }
    if (cargoSortConfig) {
      result.sort((a: any, b: any) => {
        const aVal = a[cargoSortConfig.key];
        const bVal = b[cargoSortConfig.key];
        if (aVal < bVal) return cargoSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return cargoSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [cargos, cargoSortConfig, cargoFilterText]);

  const handleCargoSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (cargoSortConfig && cargoSortConfig.key === key && cargoSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setCargoSortConfig({ key, direction });
  };

  // Formulario Persona
  const [legajo, setLegajo] = useState('');
  const [nombre, setNombre] = useState('');
  const [personaSector, setPersonaSector] = useState('');
  const [personaCargo, setPersonaCargo] = useState('1');
  const [editingPerson, setEditingPerson] = useState<string | null>(null);

  const cargosFiltradosPorSector = React.useMemo(() => {
    if (!personaSector || !sectoresCargos || !cargos) return [];
    const sectorId = parseInt(personaSector);
    const validCargoIds = sectoresCargos.filter((sc: any) => sc.id_sector === sectorId).map((sc: any) => sc.id_cargo);
    return cargos.filter((c: any) => validCargoIds.includes(c.id_cargo));
  }, [personaSector, sectoresCargos, cargos]);

  // Estados para ordenar y filtrar la tabla de personal
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filterText, setFilterText] = useState('');

  const sortedAndFilteredPersonal = React.useMemo(() => {
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

  // Estados para ordenar y filtrar Sectores
  const [sectorSortConfig, setSectorSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [sectorFilterText, setSectorFilterText] = useState('');

  const sortedAndFilteredSectores = React.useMemo(() => {
    let result = sectores ? [...sectores] : [];
    
    if (sectorFilterText) {
      const lowerFilter = sectorFilterText.toLowerCase();
      result = result.filter((s: any) => 
        s.idSector.toString().includes(lowerFilter) ||
        s.descripcion.toLowerCase().includes(lowerFilter)
      );
    }
    
    if (sectorSortConfig) {
      result.sort((a: any, b: any) => {
        const aVal = a[sectorSortConfig.key];
        const bVal = b[sectorSortConfig.key];
        
        if (aVal < bVal) return sectorSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sectorSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [sectores, sectorSortConfig, sectorFilterText]);

  const handleSectorSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sectorSortConfig && sectorSortConfig.key === key && sectorSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSectorSortConfig({ key, direction });
  };

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      toast.error('Acceso denegado. Por favor, inicia sesión.');
      navigate('/login');
    }
  }, [user, isUserLoading, navigate]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    await trpcContext.auth.me.invalidate();
    navigate('/login');
  };

  const handleAddSector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSectorMutation.mutateAsync({ 
        idSector: parseInt(sectorId), 
        descripcion: sectorDesc 
      });
      toast.success('Sector añadido');
      setIsSectorModalOpen(false);
      trpcContext.attendance.getSectors.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al añadir sector');
    }
  };

  const handleRemoveSector = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este sector?')) return;
    try {
      await removeSectorMutation.mutateAsync({ idSector: id });
      toast.success('Sector eliminado');
      trpcContext.attendance.getSectors.invalidate();
    } catch (err: any) {
      toast.error('Error al eliminar');
    }
  };

  const handleUpdateSector = async (id: number) => {
    try {
      await updateSectorMutation.mutateAsync({ idSector: id, descripcion: editSectorDesc });
      toast.success('Sector actualizado');
      setEditingSectorId(null);
      trpcContext.attendance.getSectors.invalidate();
    } catch (err: any) {
      toast.error('Error al actualizar sector');
    }
  };

  const handleOpenCargosModal = (idSector: number) => {
    setSelectedConfigSector(idSector);
    // Filtrar los mapeos para este sector
    const sectorMap = (sectoresCargos || []).filter((sc: any) => sc.id_sector === idSector);
    setCargosParams(sectorMap.map((sc: any) => ({ id_cargo: sc.id_cargo, nivel_criticidad: sc.nivel_criticidad })));
    setIsCargosModalOpen(true);
  };

  const handleSaveCargos = async () => {
    if (!selectedConfigSector) return;
    try {
      await updateSectorCargosMutation.mutateAsync({ idSector: selectedConfigSector, cargosParams });
      toast.success('Cargos actualizados');
      setIsCargosModalOpen(false);
      trpcContext.admin.getSectoresCargos.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar cargos');
    }
  };

  const handleRemoveCargoFromSector = async (sectorId: number, cargoId: number) => {
    try {
      const currentConfig = sectoresCargos?.filter((sc: any) => sc.id_sector === sectorId) || [];
      const newConfig = currentConfig
        .filter((sc: any) => sc.id_cargo !== cargoId)
        .map((sc: any) => ({ id_cargo: sc.id_cargo, nivel_criticidad: sc.nivel_criticidad }));
        
      await updateSectorCargosMutation.mutateAsync({ idSector: sectorId, cargosParams: newConfig });
      trpcContext.admin.getSectoresCargos.invalidate();
      toast.success('Cargo retirado del sector');
    } catch (err: any) {
      toast.error(err.message || 'Error al retirar cargo');
    }
  };

  const handleAddCargoToSector = async (sectorId: number, cargoId: number) => {
    try {
      const currentConfig = sectoresCargos?.filter((sc: any) => sc.id_sector === sectorId) || [];
      const newConfig = currentConfig.map((sc: any) => ({ id_cargo: sc.id_cargo, nivel_criticidad: sc.nivel_criticidad }));
      newConfig.push({ id_cargo: cargoId, nivel_criticidad: 0 }); // Añadir con criticidad 0 por defecto
      
      await updateSectorCargosMutation.mutateAsync({ idSector: sectorId, cargosParams: newConfig });
      trpcContext.admin.getSectoresCargos.invalidate();
      toast.success('Cargo asignado al sector');
    } catch (err: any) {
      toast.error(err.message || 'Error al añadir cargo');
    }
  };

  const handleAddCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCargoMutation.mutateAsync({ descripcion: cargoDesc });
      toast.success('Cargo añadido');
      setIsCargoModalOpen(false);
      setCargoDesc('');
      trpcContext.admin.getCargos.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al añadir cargo');
    }
  };

  const handleAddInlineCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineCargoDesc.trim()) return;
    try {
      await addCargoMutation.mutateAsync({ descripcion: inlineCargoDesc });
      toast.success('Cargo añadido globalmente');
      setInlineCargoDesc('');
      trpcContext.admin.getCargos.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al añadir cargo');
    }
  };

  const handleRemoveCargo = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este cargo?')) return;
    try {
      await removeCargoMutation.mutateAsync({ id_cargo: id });
      toast.success('Cargo eliminado');
      trpcContext.admin.getCargos.invalidate();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const handleUpdateCargo = async (id: number) => {
    try {
      await editCargoMutation.mutateAsync({ id_cargo: id, descripcion: editCargoDesc });
      toast.success('Cargo actualizado');
      setEditingCargoId(null);
      trpcContext.admin.getCargos.invalidate();
    } catch (err: any) {
      toast.error('Error al actualizar cargo');
    }
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
          cargo_id: parseInt(personaCargo)
        });
        toast.success('Empleado actualizado');
      } else {
        await addPersonMutation.mutateAsync({
          legajo,
          nombre,
          sector: personaSector
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
    
    // sectorPertenencia es la descripción, necesitamos el ID para el Select
    if (sectores) {
      const s = sectores.find((s: any) => s.descripcion === p.sectorPertenencia);
      setPersonaSector(s ? s.idSector.toString() : '');
    } else {
      setPersonaSector('');
    }
    
    setPersonaCargo(p.cargo_id?.toString() || '1');
    setIsPersonModalOpen(true);
  };

  const openAddPerson = () => {
    setEditingPerson(null);
    setLegajo('');
    setNombre('');
    setPersonaSector('');
    setPersonaCargo('1');
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

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
            <p className="text-sm text-gray-500">Administrador: {user.name}</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              Ver Dashboard
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Salir
            </Button>
          </div>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="sectores">Sectores</TabsTrigger>
            <TabsTrigger value="cargos">Cargos</TabsTrigger>
            <TabsTrigger value="turnos">Reglas de Turnos</TabsTrigger>
          </TabsList>

          {/* TAB: PERSONAL */}
          <TabsContent value="personal" className="mt-6">
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
                          if (editingPerson) {
                            setPersonaCargo('');
                          }
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
                      {editingPerson && (
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
                      )}
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
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
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
                          <TableCell colSpan={4} className="text-center text-slate-500 py-6">
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
          </TabsContent>

          {/* TAB: SECTORES */}
          <TabsContent value="sectores" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestión de Sectores</CardTitle>
                <Dialog open={isSectorModalOpen} onOpenChange={setIsSectorModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="w-4 h-4 mr-2" /> Añadir Sector
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuevo Sector</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddSector} className="space-y-4">
                      <div>
                        <Label>ID de Sector (Numérico)</Label>
                        <Input type="number" value={sectorId} onChange={e => setSectorId(e.target.value)} required />
                      </div>
                      <div>
                        <Label>Descripción</Label>
                        <Input value={sectorDesc} onChange={e => setSectorDesc(e.target.value)} required />
                      </div>
                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Guardar</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="mb-4 relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Buscar por descripción o ID..." 
                    className="pl-9"
                    value={sectorFilterText}
                    onChange={(e) => setSectorFilterText(e.target.value)}
                  />
                </div>
                {isSectoresLoading ? <Loader2 className="animate-spin mx-auto my-8 text-indigo-600" /> : (
                  <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSectorSort('idSector')}>
                          <div className="flex items-center gap-1 font-semibold text-slate-700">ID <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSectorSort('descripcion')}>
                          <div className="flex items-center gap-1 font-semibold text-slate-700">Descripción <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                        </TableHead>
                        <TableHead>
                          <div className="font-semibold text-slate-700">Cargos Asignados</div>
                        </TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredSectores.map((s: any) => (
                        <TableRow key={s.idSector}>
                          <TableCell className="font-medium">{s.idSector}</TableCell>
                          <TableCell>
                            {editingSectorId === s.idSector ? (
                              <Input 
                                value={editSectorDesc}
                                onChange={(e) => setEditSectorDesc(e.target.value)}
                                className="h-8 max-w-[200px]"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateSector(s.idSector);
                                  if (e.key === 'Escape') setEditingSectorId(null);
                                }}
                              />
                            ) : (
                              <span className="font-medium text-slate-800">{s.descripcion}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {sectoresCargos?.filter((sc: any) => sc.id_sector === s.idSector).map((sc: any) => {
                                const c = cargos?.find((c: any) => c.id_cargo === sc.id_cargo);
                                if (!c) return null;
                                return (
                                  <span key={c.id_cargo} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-medium bg-white border shadow-sm text-slate-700">
                                    {c.descripcion} 
                                    <button 
                                      onClick={() => handleRemoveCargoFromSector(s.idSector, c.id_cargo)} 
                                      className="hover:bg-red-100 hover:text-red-600 rounded-full p-0.5 transition-colors"
                                      title="Retirar cargo"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                );
                              })}
                              {editingSectorId !== s.idSector && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200 shadow-sm" title="Añadir cargo rápidamente">
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto min-w-[200px] max-w-[320px] p-2" align="start">
                                    <div className="space-y-2">
                                      <h4 className="font-medium text-xs text-slate-500 uppercase tracking-wider">Añadir a {s.descripcion}</h4>
                                      <div className="grid gap-1">
                                        {cargos?.filter((c:any) => !sectoresCargos?.some((sc:any) => sc.id_sector === s.idSector && sc.id_cargo === c.id_cargo)).map((c:any) => (
                                          <Button 
                                            key={c.id_cargo} 
                                            variant="ghost" 
                                            size="sm" 
                                            className="justify-start h-auto py-1.5 px-2 text-xs font-normal whitespace-normal text-left" 
                                            onClick={() => handleAddCargoToSector(s.idSector, c.id_cargo)}
                                          >
                                            <Plus className="w-3 h-3 mr-2 shrink-0 text-slate-400" />
                                            <span className="leading-tight">{c.descripcion}</span>
                                          </Button>
                                        ))}
                                        {cargos?.filter((c:any) => !sectoresCargos?.some((sc:any) => sc.id_sector === s.idSector && sc.id_cargo === c.id_cargo)).length === 0 && (
                                          <span className="text-xs text-slate-500 p-2 text-center block">Todos los cargos asignados.</span>
                                        )}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {editingSectorId === s.idSector ? (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleUpdateSector(s.idSector)}>
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setEditingSectorId(null)}>
                                  <X className="w-4 h-4 text-slate-400" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button variant="ghost" size="icon" title="Configurar Cargos" onClick={() => handleOpenCargosModal(s.idSector)}>
                                  <Settings className="w-4 h-4 text-slate-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setEditingSectorId(s.idSector); setEditSectorDesc(s.descripcion); }}>
                                  <Pencil className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveSector(s.idSector)}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {sortedAndFilteredSectores.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-slate-500 py-6">
                            No se encontraron sectores
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal de Configuración de Cargos por Sector */}
            <Dialog open={isCargosModalOpen} onOpenChange={setIsCargosModalOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Configurar Cargos: {selectedConfigSector} - {sectores?.find((s: any) => s.idSector === selectedConfigSector)?.descripcion || ''}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-slate-500">
                    Selecciona los cargos que están habilitados para el sector y define su nivel de criticidad específico.
                  </p>
                  
                  {cargos && cargos.map((cargo: any) => {
                    const mapped = cargosParams.find(cp => cp.id_cargo === cargo.id_cargo);
                    const isEnabled = !!mapped;
                    
                    return (
                      <div key={cargo.id_cargo} className="flex items-center gap-4 p-3 border rounded-md hover:bg-slate-50">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                          checked={isEnabled}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCargosParams([...cargosParams, { id_cargo: cargo.id_cargo, nivel_criticidad: 1 }]);
                            } else {
                              setCargosParams(cargosParams.filter(cp => cp.id_cargo !== cargo.id_cargo));
                            }
                          }}
                        />
                        <div className="flex-1 font-medium text-slate-700">{cargo.descripcion}</div>
                        {isEnabled && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-slate-500">Criticidad:</Label>
                            <Input 
                              type="number" 
                              min="1" 
                              max="5"
                              value={mapped.nivel_criticidad}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setCargosParams(cargosParams.map(cp => cp.id_cargo === cargo.id_cargo ? { ...cp, nivel_criticidad: val } : cp));
                              }}
                              className="w-20 h-8"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="mt-6 pt-4 border-t">
                    <Label className="text-sm font-semibold mb-2 block text-slate-700">¿Falta un cargo? Añádelo rápidamente:</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="Nombre del nuevo cargo..." 
                        value={inlineCargoDesc}
                        onChange={e => setInlineCargoDesc(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddInlineCargo(e as any);
                          }
                        }}
                      />
                      <Button type="button" variant="secondary" onClick={handleAddInlineCargo} disabled={!inlineCargoDesc.trim()}>
                        <Plus className="w-4 h-4 mr-1" /> Crear
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCargosModalOpen(false)}>Cancelar</Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveCargos}>Guardar Configuración</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* TAB: CARGOS */}
          <TabsContent value="cargos" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestión de Cargos Generales</CardTitle>
                <Dialog open={isCargoModalOpen} onOpenChange={setIsCargoModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="w-4 h-4 mr-2" /> Añadir Cargo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuevo Cargo</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCargo} className="space-y-4">
                      <div>
                        <Label>Nombre / Descripción</Label>
                        <Input value={cargoDesc} onChange={e => setCargoDesc(e.target.value)} required placeholder="Ej: Operario de Mantenimiento" />
                      </div>
                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Guardar</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="mb-4 relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Buscar cargo..." 
                    className="pl-9"
                    value={cargoFilterText}
                    onChange={(e) => setCargoFilterText(e.target.value)}
                  />
                </div>
                {isSectoresLoading ? <Loader2 className="animate-spin mx-auto my-8 text-indigo-600" /> : (
                  <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors w-24" onClick={() => handleCargoSort('id_cargo')}>
                          <div className="flex items-center gap-1 font-semibold text-slate-700">ID <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleCargoSort('descripcion')}>
                          <div className="flex items-center gap-1 font-semibold text-slate-700">Descripción <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                        </TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 w-32">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredCargos.map((c: any) => (
                        <TableRow key={c.id_cargo}>
                          <TableCell className="font-medium">{c.id_cargo}</TableCell>
                          <TableCell>
                            {editingCargoId === c.id_cargo ? (
                              <Input 
                                value={editCargoDesc}
                                onChange={(e) => setEditCargoDesc(e.target.value)}
                                className="h-8 max-w-[300px]"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateCargo(c.id_cargo);
                                  if (e.key === 'Escape') setEditingCargoId(null);
                                }}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-slate-400" />
                                <span>{c.descripcion}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {editingCargoId === c.id_cargo ? (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleUpdateCargo(c.id_cargo)}>
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setEditingCargoId(null)}>
                                  <X className="w-4 h-4 text-slate-400" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => { setEditingCargoId(c.id_cargo); setEditCargoDesc(c.descripcion); }}>
                                  <Pencil className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveCargo(c.id_cargo)}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {sortedAndFilteredCargos.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-slate-500 py-6">
                            No se encontraron cargos
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: TURNOS Y REGLAS */}
          <TabsContent value="turnos" className="mt-6">
            <AdminTurnos />
          </TabsContent>
        </Tabs>
        
        <div className="pt-8 pb-4 text-center text-xs text-slate-400 font-mono">
          v0.1
        </div>
      </div>
    </div>
  );
}
