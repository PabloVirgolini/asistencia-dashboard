/**
 * @module useCreadorReglas
 * @description Hook customizado que abstrae la lógica de estado para el formulario de Creador de Reglas de Turnos.
 * Maneja la distinción entre Regla General y Excepciones, los horarios cortados y la validación antes de enviar.
 */
import { useState } from 'react';
import { toast } from 'sonner';

export function useCreadorReglas(onAddRegla: any) {
  const [tipoRegla, setTipoRegla] = useState<'general' | 'excepcion'>('general');
  const [selectedTurno, setSelectedTurno] = useState<string>('');
  
  // Regla General
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedCargos, setSelectedCargos] = useState<string[]>([]);
  
  // Excepción
  const [selectedLegajo, setSelectedLegajo] = useState<string>('');
  const [personalSearch, setPersonalSearch] = useState('');
  
  // Horarios y Días
  const [selectedDias, setSelectedDias] = useState<number[]>([]);
  const [horaEntrada, setHoraEntrada] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [esCortado, setEsCortado] = useState(false);
  const [horaEntrada2, setHoraEntrada2] = useState('');
  const [horaSalida2, setHoraSalida2] = useState('');

  const handleToggleDia = (dia: number) => {
    setSelectedDias(prev => 
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    );
  };

  const resetForm = () => {
    setSelectedDias([]);
    setHoraEntrada('');
    setHoraSalida('');
    setEsCortado(false);
    setHoraEntrada2('');
    setHoraSalida2('');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurno) return toast.error('Debes seleccionar un turno');
    if (selectedDias.length === 0) return toast.error('Debes seleccionar al menos un día');
    if (!horaEntrada || !horaSalida) return toast.error('Debes ingresar hora de entrada y salida');
    if (esCortado && (!horaEntrada2 || !horaSalida2)) return toast.error('Debes ingresar el segundo horario');
    
    if (tipoRegla === 'general') {
      if (!selectedSector || selectedCargos.length === 0) return toast.error('Debes seleccionar sector y al menos un cargo');
    } else {
      if (!selectedLegajo) return toast.error('Debes seleccionar un empleado');
    }

    try {
      await onAddRegla({
        tipoRegla,
        id_sector: selectedSector ? parseInt(selectedSector) : null,
        id_cargo: null,
        legajo: selectedLegajo || null,
        id_turno: parseInt(selectedTurno),
        dias: selectedDias,
        hora_entrada: horaEntrada,
        hora_salida: horaSalida,
        selectedCargos,
        es_cortado: esCortado ? 1 : 0,
        hora_entrada_2: esCortado ? horaEntrada2 : null,
        hora_salida_2: esCortado ? horaSalida2 : null
      });
      resetForm();
    } catch (err: any) {
      // El error se maneja visualmente en el componente padre
    }
  };

  return {
    tipoRegla, setTipoRegla,
    selectedTurno, setSelectedTurno,
    selectedSector, setSelectedSector,
    selectedCargos, setSelectedCargos,
    selectedLegajo, setSelectedLegajo,
    personalSearch, setPersonalSearch,
    selectedDias, setSelectedDias,
    horaEntrada, setHoraEntrada,
    horaSalida, setHoraSalida,
    esCortado, setEsCortado,
    horaEntrada2, setHoraEntrada2,
    horaSalida2, setHoraSalida2,
    handleToggleDia,
    handleAdd
  };
}
