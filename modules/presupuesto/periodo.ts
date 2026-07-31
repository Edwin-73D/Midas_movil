export type FrecuenciaPresupuesto = 'mensual' | 'quincenal';

/**
 * Rango [inicio, fin] inclusivo, en formato 'YYYY-MM-DD', para el período
 * vigente según la frecuencia configurada. Mensual: día 1 al último día del
 * mes. Quincenal: 1-15, o 16-último día del mes, según en qué mitad caiga
 * `fecha`. No hay "reset" real: el rango simplemente cambia con la fecha.
 */
export function getRangoPeriodoActual(
  frecuencia: FrecuenciaPresupuesto,
  fecha: Date = new Date()
): { inicio: string; fin: string } {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth(); // 0-indexado
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const fmt = (dia: number) =>
    `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

  if (frecuencia === 'mensual') {
    return { inicio: fmt(1), fin: fmt(ultimoDia) };
  }

  const dia = fecha.getDate();
  return dia <= 15 ? { inicio: fmt(1), fin: fmt(15) } : { inicio: fmt(16), fin: fmt(ultimoDia) };
}
