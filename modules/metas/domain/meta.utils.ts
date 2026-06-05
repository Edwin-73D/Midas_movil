export function calcPorcentajeActual(monto: number, metaTotal: number): number {
  if (metaTotal <= 0) return 0;
  return Math.min((monto / metaTotal) * 100, 100);
}
