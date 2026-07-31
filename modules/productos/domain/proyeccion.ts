import type { FrecuenciaCapitalizacion } from '@/modules/productos/domain/producto.model';

const PERIODOS_POR_ANIO: Record<FrecuenciaCapitalizacion, number> = {
  mensual: 12,
  trimestral: 4,
  semestral: 2,
  anual: 1,
};

/**
 * Valor futuro con interés compuesto — función pura, no persiste nada, se
 * recalcula en cada render a partir del saldo actual. Usa la misma
 * conversión de tasa (anual nominal / periodos por año) que el motor real de
 * capitalización en `capitalizacion-interes.service.ts`.
 *
 * Un horizonte que no es múltiplo exacto del periodo de capitalización (p.ej.
 * 3 meses con frecuencia anual) da un exponente fraccionario; se acepta como
 * aproximación de suavizado ya que esto es una estimación, no el cálculo real.
 */
export function proyectarValorFuturo(
  saldoActual: number,
  tasaAnualPct: number,
  frecuencia: FrecuenciaCapitalizacion,
  mesesHorizonte: number
): number {
  const periodosPorAnio = PERIODOS_POR_ANIO[frecuencia];
  const tasaPeriodo = tasaAnualPct / 100 / periodosPorAnio;
  const mesesPorPeriodo = 12 / periodosPorAnio;
  const numPeriodos = mesesHorizonte / mesesPorPeriodo;
  return saldoActual * Math.pow(1 + tasaPeriodo, numPeriodos);
}

export type ProyeccionHorizonte = { meses: 3 | 6 | 12; valor: number };

/** Proyecciones a 3, 6 y 12 meses a partir del saldo actual. */
export function getProyecciones(
  saldoActual: number,
  tasaAnualPct: number,
  frecuencia: FrecuenciaCapitalizacion
): ProyeccionHorizonte[] {
  return ([3, 6, 12] as const).map((meses) => ({
    meses,
    valor: proyectarValorFuturo(saldoActual, tasaAnualPct, frecuencia, meses),
  }));
}
