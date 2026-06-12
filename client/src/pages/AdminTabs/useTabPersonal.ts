import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * @module useTabPersonal
 * @description Encapsula la lógica de estado y llamadas de red (tRPC) para el ABM de Personal,
 * cumpliendo con el principio de Bajo Acoplamiento.
 */
export function useTabPersonal() {
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
  const [personaEnCapacitacion, setPersonaEnCapacitacion] = useState(false);
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
          originalLegajo: editingPerson,
          legajo,
          nombre,
          sector: personaSector,
          activo: 1,
          cargo_id: parseInt(personaCargo),
          es_rotativo: personaEsRotativo,
          en_capacitacion: personaEnCapacitacion
        });
        toast.success('Empleado actualizado');
      } else {
        await addPersonMutation.mutateAsync({
          legajo,
          nombre,
          sector: personaSector,
          cargo_id: parseInt(personaCargo),
          es_rotativo: personaEsRotativo,
          en_capacitacion: personaEnCapacitacion
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
    setPersonaEnCapacitacion(p.enCapacitacion === '1' || p.enCapacitacion === 1 || p.enCapacitacion === true);
    setIsPersonModalOpen(true);
  };

  const openAddPerson = () => {
    setEditingPerson(null);
    setLegajo('');
    setNombre('');
    setPersonaSector('');
    setPersonaCargo('');
    setPersonaEsRotativo(0);
    setPersonaEnCapacitacion(false);
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

  return {
    sectores,
    personal,
    isPersonalLoading,
    cargosFiltradosPorSector,
    isPersonModalOpen,
    setIsPersonModalOpen,
    legajo, setLegajo,
    nombre, setNombre,
    personaSector, setPersonaSector,
    personaCargo, setPersonaCargo,
    personaEsRotativo, setPersonaEsRotativo,
    personaEnCapacitacion, setPersonaEnCapacitacion,
    editingPerson,
    filterText, setFilterText,
    sortedAndFilteredPersonal,
    handleSort,
    handleSavePerson,
    openEditPerson,
    openAddPerson,
    handleRemovePerson
  };
}
