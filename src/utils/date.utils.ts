export function validarFechas(
  fechaInicio: string | Date,
  fechaFin: string | Date
): { inicio: Date; fin: Date } {
  const inicio = fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
  const fin = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    throw new Error("Las fechas enviadas no son válidas.");
  }

  if (fin < inicio) {
    throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.");
  }

  return { inicio, fin };
}
