import React from 'react';
import { useAdminTurnos } from './hooks/useAdminTurnos';
import GestionTurnos from './AdminTurnos/GestionTurnos';
import CreadorReglasForm from './AdminTurnos/CreadorReglasForm';
import MatrizHorarios from './AdminTurnos/MatrizHorarios';

export default function AdminTurnos() {
  const { queries, mutations } = useAdminTurnos();
  const { turnos, isTurnosLoading, reglas, isReglasLoading, sectores, sectoresCargos, cargosData, personal } = queries;
  const { addTurno, removeTurno, updateTurnoHorario, addRegla, removeRegla, updateHorario, batchUpdate, duplicateSector, duplicateCargo } = mutations;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      <GestionTurnos
        turnos={turnos}
        isLoading={isTurnosLoading}
        onAddTurno={async (desc) => { await addTurno.mutateAsync({ descripcion: desc }); }}
        onUpdateTurno={async (id, desc) => { await updateTurnoHorario.mutateAsync({ id_turno: id, descripcion: desc }); }}
        onRemoveTurno={async (id) => { 
          if(confirm('¿Seguro que deseas eliminar este turno? Podría afectar a las reglas asociadas.')) {
            await removeTurno.mutateAsync({ id_turno: id }); 
          }
        }}
      />

      <CreadorReglasForm
        turnos={turnos}
        sectores={sectores}
        cargosData={cargosData}
        sectoresCargos={sectoresCargos}
        personal={personal}
        isPending={addRegla.isPending}
        onAddRegla={async (params) => {
          if (params.tipoRegla === 'general') {
            for (const cargo of params.selectedCargos) {
              await addRegla.mutateAsync({
                id_sector: params.id_sector,
                id_cargo: parseInt(cargo),
                legajo: null,
                id_turno: params.id_turno,
                dias: params.dias,
                hora_entrada: params.hora_entrada,
                hora_salida: params.hora_salida,
                es_cortado: params.es_cortado,
                hora_entrada_2: params.hora_entrada_2,
                hora_salida_2: params.hora_salida_2
              });
            }
          } else {
            await addRegla.mutateAsync({
              id_sector: null,
              id_cargo: null,
              legajo: params.legajo,
              id_turno: params.id_turno,
              dias: params.dias,
              hora_entrada: params.hora_entrada,
              hora_salida: params.hora_salida,
              es_cortado: params.es_cortado,
              hora_entrada_2: params.hora_entrada_2,
              hora_salida_2: params.hora_salida_2
            });
          }
        }}
      />

      <MatrizHorarios
        reglas={reglas}
        isReglasLoading={isReglasLoading}
        cargosData={cargosData}
        sectoresCargos={sectoresCargos}
        personal={personal}
        mutations={{
          removeRegla,
          updateHorario,
          duplicateSector,
          duplicateCargo,
          batchUpdate
        }}
      />

    </div>
  );
}
