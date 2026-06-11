export interface ReglaBase {
  id_sector: string | number;
  id_cargo: number;
  hora_entrada: string;
  hora_salida: string;
  legajo: string | null;
}

export interface FichadaData {
  legajo: string;
  sectorPertenencia: string | number;
  cargo_id: number;
  primeraFichada: string; // Formato "YYYY-MM-DD HH:MM:SS"
}

/**
 * Función pura que calcula si un empleado llegó tarde.
 * Extrae la regla con mayor prioridad (Excepción por legajo > Regla General).
 */
export function calcularLlegadaTarde(
  fichada: FichadaData,
  reglasDelDia: ReglaBase[],
  jsDate: Date,
  toleranciaMinutos: number = 10
): boolean {
  if (reglasDelDia.length === 0) return false;

  let horaEsperada: string | null = null;

  // 1. Prioridad: Excepción por Legajo
  const exceptionRule = reglasDelDia.find(h => h.legajo === fichada.legajo);
  if (exceptionRule) {
    horaEsperada = exceptionRule.hora_entrada;
  } else {
    // 2. Prioridad: Regla General Sector+Cargo
    // Aseguramos que la comparación sea estricta usando toString() para ambos
    const generalRule = reglasDelDia.find(
      h => h.id_sector?.toString() === fichada.sectorPertenencia?.toString() && h.id_cargo === fichada.cargo_id
    );
    if (generalRule) {
      horaEsperada = generalRule.hora_entrada;
    }
  }

  if (horaEsperada) {
    const timePart = fichada.primeraFichada.split(' ')[1]; // "HH:MM:SS"
    
    const [expectedH, expectedM] = horaEsperada.split(':').map(Number);
    const expectedDate = new Date(jsDate);
    expectedDate.setHours(expectedH, expectedM + toleranciaMinutos, 0, 0);

    const actualDate = new Date(jsDate);
    const [ah, am, as] = timePart.split(':').map(Number);
    actualDate.setHours(ah, am, as || 0, 0);

    // TODO: Falta lógica para manejar turnos que cruzan la medianoche
    // Si esperaba 22:00 y fichó a las 00:15... actualDate será < expectedDate? 
    // Por ahora mantenemos la lógica heredada idéntica.
    return actualDate > expectedDate;
  }

  return false;
}
