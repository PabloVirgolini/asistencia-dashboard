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
  const {
    groupedGeneral,
    groupedExceptions,
    personal,
    cargosData,
    isBatchMode,
    setIsBatchMode,
    selectedRules,
    setSelectedRules,
    collapseToken,
    setCollapseToken,
    editingRuleId,
    setEditingRuleId,
    editHoraEntrada,
    setEditHoraEntrada,
    editHoraSalida,
    setEditHoraSalida,
    editEsCortado,
    setEditEsCortado,
    editHoraEntrada2,
    setEditHoraEntrada2,
    editHoraSalida2,
    setEditHoraSalida2,
    updateHorario,
    handleRemoveRegla,
    renderBatchDelete,
    getDiaName,
    setDuplicateSource,
    setDuplicateModalOpen,
    setDuplicateCargoSource,
    setDuplicateCargoTarget,
    setDuplicateCargoModalOpen
  } = props;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Reglas Generales */}
      <div className="w-full xl:w-1/2">
        <MatrizListGenerales 
          groupedGeneral={groupedGeneral}
          personal={personal}
          cargosData={cargosData}
          isBatchMode={isBatchMode}
          setIsBatchMode={setIsBatchMode}
          selectedRules={selectedRules}
          setSelectedRules={setSelectedRules}
          collapseToken={collapseToken}
          setCollapseToken={setCollapseToken}
          editingRuleId={editingRuleId}
          setEditingRuleId={setEditingRuleId}
          editHoraEntrada={editHoraEntrada}
          setEditHoraEntrada={setEditHoraEntrada}
          editHoraSalida={editHoraSalida}
          setEditHoraSalida={setEditHoraSalida}
          editEsCortado={editEsCortado}
          setEditEsCortado={setEditEsCortado}
          editHoraEntrada2={editHoraEntrada2}
          setEditHoraEntrada2={setEditHoraEntrada2}
          editHoraSalida2={editHoraSalida2}
          setEditHoraSalida2={setEditHoraSalida2}
          updateHorario={updateHorario}
          handleRemoveRegla={handleRemoveRegla}
          renderBatchDelete={renderBatchDelete}
          getDiaName={getDiaName}
          setDuplicateSource={setDuplicateSource}
          setDuplicateModalOpen={setDuplicateModalOpen}
          setDuplicateCargoSource={setDuplicateCargoSource}
          setDuplicateCargoTarget={setDuplicateCargoTarget}
          setDuplicateCargoModalOpen={setDuplicateCargoModalOpen}
        />
      </div>

      <div className="w-full xl:w-1/2">
        <MatrizListExcepciones 
          groupedExceptions={groupedExceptions}
          personal={personal}
          isBatchMode={isBatchMode}
          setIsBatchMode={setIsBatchMode}
          selectedRules={selectedRules}
          setSelectedRules={setSelectedRules}
          collapseToken={collapseToken}
          setCollapseToken={setCollapseToken}
          editingRuleId={editingRuleId}
          setEditingRuleId={setEditingRuleId}
          editHoraEntrada={editHoraEntrada}
          setEditHoraEntrada={setEditHoraEntrada}
          editHoraSalida={editHoraSalida}
          setEditHoraSalida={setEditHoraSalida}
          editEsCortado={editEsCortado}
          setEditEsCortado={setEditEsCortado}
          editHoraEntrada2={editHoraEntrada2}
          setEditHoraEntrada2={setEditHoraEntrada2}
          editHoraSalida2={editHoraSalida2}
          setEditHoraSalida2={setEditHoraSalida2}
          updateHorario={updateHorario}
          handleRemoveRegla={handleRemoveRegla}
          renderBatchDelete={renderBatchDelete}
          getDiaName={getDiaName}
          setDuplicateSource={setDuplicateSource}
          setDuplicateModalOpen={setDuplicateModalOpen}
          setDuplicateCargoSource={setDuplicateCargoSource}
          setDuplicateCargoTarget={setDuplicateCargoTarget}
          setDuplicateCargoModalOpen={setDuplicateCargoModalOpen}
        />
      </div>
    </div>
  );
}
