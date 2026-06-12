function getVentanaTurno(fechaStr, reglaHoraria) {
  const horaEntradaStr = reglaHoraria.hora_entrada;
  const horaSalidaStr = reglaHoraria.hora_salida;

  if (!horaEntradaStr) return null;

  const jsDate = new Date(`${fechaStr}T12:00:00`);

  const [hE, mE] = horaEntradaStr.split(':').map(Number);
  const expectedEntrada = new Date(jsDate);
  expectedEntrada.setHours(hE, mE, 0, 0);

  let expectedSalida = null;
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

  const windowStartTurno = new Date(expectedEntrada.getTime() - 4 * 3600000);
  const windowEndTurno = expectedSalida 
    ? new Date(expectedSalida.getTime() + 4 * 3600000) 
    : new Date(expectedEntrada.getTime() + 16 * 3600000);

  return { expectedEntrada, expectedSalida, cruzaMedianoche, windowStartTurno, windowEndTurno };
}

function parseFichadaStr(fStr) {
  const [fecha, timeStr] = fStr.split(' ');
  const [h, m, s] = timeStr.split('.')[0].split(':').map(Number);
  const jsDate = new Date(`${fecha}T12:00:00`);
  jsDate.setHours(h, m, s, 0);
  return jsDate;
}

const reglaAyer = { hora_entrada: '22:00', hora_salida: '06:00' };
const reglaHoy = { hora_entrada: '14:00', hora_salida: '22:00' };

const ventanaAyer = getVentanaTurno('2026-06-11', reglaAyer);
const ventanaHoy = getVentanaTurno('2026-06-12', reglaHoy);

console.log('Ventana Ayer:', {
  start: ventanaAyer.windowStartTurno.toLocaleString(),
  end: ventanaAyer.windowEndTurno.toLocaleString()
});
console.log('Ventana Hoy:', {
  start: ventanaHoy.windowStartTurno.toLocaleString(),
  end: ventanaHoy.windowEndTurno.toLocaleString()
});

const f1 = parseFichadaStr('2026-06-12 06:31:48.000000');
const f2 = parseFichadaStr('2026-06-12 13:28:42.000000');

console.log('f1:', f1.toLocaleString());
console.log('f1 in Ayer?', f1 >= ventanaAyer.windowStartTurno && f1 <= ventanaAyer.windowEndTurno);
console.log('f1 in Hoy?', f1 >= ventanaHoy.windowStartTurno && f1 <= ventanaHoy.windowEndTurno);

console.log('f2:', f2.toLocaleString());
console.log('f2 in Ayer?', f2 >= ventanaAyer.windowStartTurno && f2 <= ventanaAyer.windowEndTurno);
console.log('f2 in Hoy?', f2 >= ventanaHoy.windowStartTurno && f2 <= ventanaHoy.windowEndTurno);

