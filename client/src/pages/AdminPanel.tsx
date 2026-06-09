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
import { Loader2, Plus, Trash2, Edit2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

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

  const logoutMutation = trpc.auth.logout.useMutation();
  const addSectorMutation = trpc.admin.addSector.useMutation();
  const removeSectorMutation = trpc.admin.removeSector.useMutation();
  const addPersonMutation = trpc.admin.addPerson.useMutation();
  const editPersonMutation = trpc.admin.editPerson.useMutation();
  const removePersonMutation = trpc.admin.removePerson.useMutation();

  // Estados para modales
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);

  // Formulario Sector
  const [sectorId, setSectorId] = useState('');
  const [sectorDesc, setSectorDesc] = useState('');

  // Formulario Persona
  const [legajo, setLegajo] = useState('');
  const [nombre, setNombre] = useState('');
  const [personaSector, setPersonaSector] = useState('');
  const [editingPerson, setEditingPerson] = useState<string | null>(null);

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

  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPerson) {
        await editPersonMutation.mutateAsync({
          legajo,
          nombre,
          sector: personaSector,
          activo: 1
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
    setPersonaSector(p.sectorPertenencia);
    setIsPersonModalOpen(true);
  };

  const openAddPerson = () => {
    setEditingPerson(null);
    setLegajo('');
    setNombre('');
    setPersonaSector('');
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
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="sectores">Sectores</TabsTrigger>
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
                        <Select value={personaSector} onValueChange={setPersonaSector} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un sector" />
                          </SelectTrigger>
                          <SelectContent>
                            {sectores?.map((s: any) => (
                              <SelectItem key={s.idSector} value={s.descripcion}>{s.descripcion}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                        Guardar
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isPersonalLoading ? <Loader2 className="animate-spin mx-auto my-8 text-indigo-600" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Legajo</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {personal?.map((p: any) => (
                        <TableRow key={p.legajo}>
                          <TableCell className="font-medium">{p.legajo}</TableCell>
                          <TableCell>{p.nombre}</TableCell>
                          <TableCell>{p.sectorPertenencia}</TableCell>
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
                    </TableBody>
                  </Table>
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
                {isSectoresLoading ? <Loader2 className="animate-spin mx-auto my-8 text-indigo-600" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sectores?.map((s: any) => (
                        <TableRow key={s.idSector}>
                          <TableCell className="font-medium">{s.idSector}</TableCell>
                          <TableCell>{s.descripcion}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveSector(s.idSector)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
