/**
 * @module useMatrizHorarios
 * @description Hook customizado que abstrae la lógica de estado para la matriz visual de horarios.
 * Maneja el modo de edición en lote (Batch), el filtrado y el estado de los modales de replicación.
 */
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { filtrarReglas, agruparReglas } from '@/utils/horariosFormatter';
import { ReglaHorario } from '@server/db/schema';

export function useMatrizHorarios(reglas: any[], mutations: any) {
  const { removeRegla, updateHorario, duplicateSector, duplicateCargo, batchUpdate } = mutations;

  // Batch Edit State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedRules, setSelectedRules] = useState<number[]>([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchHoraEntrada, setBatchHoraEntrada] = useState('');
  const [batchHoraSalida, setBatchHoraSalida] = useState('');

  // Filter and Group Reglas
  const [reglaFilter, setReglaFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [collapseToken, setCollapseToken] = useState(0);

  // Suggested Filters for Calendar
  const [activeTurno, setActiveTurno] = useState<string>('todos');
  const [activeSector, setActiveSector] = useState<string>('todos');
  const [activeCargo, setActiveCargo] = useState<string>('todos');
  const [hiddenTurnos, setHiddenTurnos] = useState<string[]>([]);

  const uniqueTurnos = useMemo(() => Array.from(new Set(reglas?.map(r => r.turno).filter(Boolean))), [reglas]);
  const uniqueSectores = useMemo(() => Array.from(new Set(reglas?.map(r => r.sector).filter(Boolean))), [reglas]);
  const uniqueCargos = useMemo(() => Array.from(new Set(reglas?.map(r => r.cargo).filter(Boolean))), [reglas]);

  const filteredReglas = useMemo(() => {
    let baseReglas = (reglas || []) as ReglaHorario[];
    if (hiddenTurnos.length > 0) {
      baseReglas = baseReglas.filter(r => r.turno && !hiddenTurnos.includes(r.turno));
    }
    
    return filtrarReglas(baseReglas, {
      texto: reglaFilter,
      turno: activeTurno,
      sector: activeSector,
      cargo: activeCargo
    });
  }, [reglas, reglaFilter, activeTurno, activeSector, activeCargo, hiddenTurnos]);

  const { groupedGeneral, groupedExceptions } = useMemo(() => {
    return agruparReglas(filteredReglas as ReglaHorario[]);
  }, [filteredReglas]);

  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<{ id_turno: number, id_sector: number, nombreSector: string } | null>(null);
  const [duplicateTargetSector, setDuplicateTargetSector] = useState<string>('');

  const [duplicateCargoModalOpen, setDuplicateCargoModalOpen] = useState(false);
  const [duplicateCargoSource, setDuplicateCargoSource] = useState<{ id_turno: number, id_sector: number, id_cargo: number, nombreCargo: string } | null>(null);
  const [duplicateCargoTarget, setDuplicateCargoTarget] = useState<string>('');

  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editHoraEntrada, setEditHoraEntrada] = useState("");
  const [editHoraSalida, setEditHoraSalida] = useState("");

  const handleRemoveRegla = async (id: number) => {
    if (!confirm('¿Eliminar esta regla de horario?')) return;
    try {
      await removeRegla.mutateAsync({ id_horario: id });
    } catch (err: any) {}
  };

  const handleRemoveBatch = async (ids: number[], levelName: string) => {
    if (!confirm(`¿Eliminar las ${ids.length} reglas de ${levelName}?`)) return;
    
    const toastId = toast.loading(`Eliminando ${ids.length} reglas...`);
    let successCount = 0;
    
    for (const id of ids) {
      try {
        await removeRegla.mutateAsync({ id_horario: id });
        successCount++;
      } catch (err: any) {
        toast.error(`Error regla ID ${id}: ${err.message}`);
      }
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} reglas eliminadas de ${levelName}`, { id: toastId });
    } else {
      toast.dismiss(toastId);
    }
  };

  const handleDuplicateSector = async () => {
    if (!duplicateSource || !duplicateTargetSector) return;
    try {
      await duplicateSector.mutateAsync({
        id_turno: duplicateSource.id_turno,
        source_sector: duplicateSource.id_sector,
        target_sector: parseInt(duplicateTargetSector)
      });
      setDuplicateModalOpen(false);
    } catch (err: any) {}
  };

  const handleDuplicateCargo = async () => {
    if (!duplicateCargoSource || !duplicateCargoTarget) return;
    try {
      await duplicateCargo.mutateAsync({
        id_turno: duplicateCargoSource.id_turno,
        id_sector: duplicateCargoSource.id_sector,
        source_cargo: duplicateCargoSource.id_cargo,
        target_cargo: parseInt(duplicateCargoTarget)
      });
      setDuplicateCargoModalOpen(false);
    } catch (err: any) {}
  };

  const handleBatchUpdateSubmit = async () => {
    if(!batchHoraEntrada || !batchHoraSalida) return toast.error('Ingresa hora de entrada y salida');
    try {
      await batchUpdate.mutateAsync({
        ids: selectedRules,
        hora_entrada: batchHoraEntrada,
        hora_salida: batchHoraSalida
      });
      setBatchModalOpen(false);
      setIsBatchMode(false);
      setSelectedRules([]);
    } catch(e) {}
  };

  return {
    isBatchMode, setIsBatchMode,
    selectedRules, setSelectedRules,
    batchModalOpen, setBatchModalOpen,
    batchHoraEntrada, setBatchHoraEntrada,
    batchHoraSalida, setBatchHoraSalida,
    reglaFilter, setReglaFilter,
    viewMode, setViewMode,
    collapseToken, setCollapseToken,
    activeTurno, setActiveTurno,
    activeSector, setActiveSector,
    activeCargo, setActiveCargo,
    hiddenTurnos, setHiddenTurnos,
    uniqueTurnos, uniqueSectores, uniqueCargos,
    filteredReglas, groupedGeneral, groupedExceptions,
    duplicateModalOpen, setDuplicateModalOpen,
    duplicateSource, setDuplicateSource,
    duplicateTargetSector, setDuplicateTargetSector,
    duplicateCargoModalOpen, setDuplicateCargoModalOpen,
    duplicateCargoSource, setDuplicateCargoSource,
    duplicateCargoTarget, setDuplicateCargoTarget,
    editingRuleId, setEditingRuleId,
    editHoraEntrada, setEditHoraEntrada,
    editHoraSalida, setEditHoraSalida,
    handleRemoveRegla,
    handleRemoveBatch,
    handleDuplicateSector,
    handleDuplicateCargo,
    handleBatchUpdateSubmit
  };
}
