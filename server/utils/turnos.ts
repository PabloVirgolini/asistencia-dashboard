export interface ReglaHoraria {
  hora_entrada: string;
  hora_salida: string | null;
}

export interface VentanaTurno {
  expectedEntrada: Date;
  expectedSalida: Date | null;
  cruzaMedianoche: boolean;
  windowStartTurno: Date;
  windowEndTurno: Date;
}

export function getVentanaTurno(fechaStr: string, reglaHoraria: ReglaHoraria): VentanaTurno | null {
  const horaEntradaStr = reglaHoraria.hora_entrada;
  const horaSalidaStr = reglaHoraria.hora_salida;

  if (!horaEntradaStr) return null;

  // Fijar el mediodía para evitar problemas de timezone al inicializar
  const jsDate = new Date(`${fechaStr}T12:00:00`);

  const [hE, mE] = horaEntradaStr.split(':').map(Number);
  const expectedEntrada = new Date(jsDate);
  expectedEntrada.setHours(hE, mE, 0, 0);

  let expectedSalida: Date | null = null;
  let cruzaMedianoche = false;

  if (horaSalidaStr) {
    const [hS, mS] = horaSalidaStr.split(':').map(Number);
    expectedSalida = new Date(jsDate);
    expectedSalida.setHours(hS, mS, 0, 0);

    if (expectedSalida < expectedEntrada) {
      expectedSalida.setDate(expectedSalida.getDate() + 1);
      cruzaMedianoche = true;
    }
  }

  // Margen de 4 horas antes de la entrada y 4 horas después de la salida
  const windowStartTurno = new Date(expectedEntrada.getTime() - 4 * 3600000);
  const windowEndTurno = expectedSalida 
    ? new Date(expectedSalida.getTime() + 4 * 3600000) 
    : new Date(expectedEntrada.getTime() + 16 * 3600000);

  return { expectedEntrada, expectedSalida, cruzaMedianoche, windowStartTurno, windowEndTurno };
}

export function parseFichadaStr(fStr: string): Date {
  const [fd, ft] = fStr.split(' ');
  const [y, m, d] = fd.split('-').map(Number);
  const [H, M, S] = ft.split(':').map(Number);
  return new Date(y, m - 1, d, H, M, S);
}
