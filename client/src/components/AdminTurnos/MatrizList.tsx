import React from 'react';
import { MatrizListGenerales } from './MatrizList/MatrizListGenerales';
import { MatrizListExcepciones } from './MatrizList/MatrizListExcepciones';

interface MatrizListProps {
  groupedGeneral: any;
  groupedExceptions: any;
  personal: any[];
  cargosData: any[];
  isBatchMode: boolean;
  setIsBatchMode: (b: boolean) => void;
  selectedRules: number[];
  setSelectedRules: React.Dispatch<React.SetStateAction<number[]>>;
  collapseToken: number;
  setCollapseToken: React.Dispatch<React.SetStateAction<number>>;
  editingRuleId: number | null;
  setEditingRuleId: (id: number | null) => void;
  editHoraEntrada: string;
  setEditHoraEntrada: (val: string) => void;
  editHoraSalida: string;
  setEditHoraSalida: (val: string) => void;
  editEsCortado: boolean;
  setEditEsCortado: (val: boolean) => void;
  editHoraEntrada2: string;
  setEditHoraEntrada2: (val: string) => void;
  editHoraSalida2: string;
  setEditHoraSalida2: (val: string) => void;
  updateHorario: any;
  handleRemoveRegla: (id: number) => void;
  renderBatchDelete: (nodeData: any, name: string) => React.ReactNode;
  getDiaName: (num: number) => string;
  setDuplicateSource: (src: any) => void;
  setDuplicateModalOpen: (open: boolean) => void;
  setDuplicateCargoSource: (src: any) => void;
  setDuplicateCargoTarget: (target: string) => void;
  setDuplicateCargoModalOpen: (open: boolean) => void;
}

export default function MatrizList(props: MatrizListProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Reglas Generales */}
      <MatrizListGenerales {...props} />

      {/* Excepciones */}
      <MatrizListExcepciones {...props} />
    </div>
  );
}
