// Dominio de la pantalla de Reportes (HU-R01 a HU-R09)

export type Periodo =
  | { tipo: 'general' }
  | { tipo: 'mes'; anio: number; mes: number }; // mes: 1-12

export interface ResumenFinanciero {
  ingresos: number;
  gastos: number;
  ahorros: number;
  balanceNeto: number;
  hayDatos: boolean;
}

export interface GastoCategoria {
  nombre: string;
  total: number;
  porcentaje: number; // respecto al total de gastos del período
}

export interface ComparativaCategoria {
  nombre: string;
  presupuestado: number;
  gastado: number;
  diferencia: number; // presupuestado - gastado (>=0 sobrante, <0 exceso)
}

export interface ComparativaPresupuesto {
  items: ComparativaCategoria[];
  tienePresupuesto: boolean;
}

export interface PuntoTendencia {
  ym: string; // 'YYYY-MM'
  label: string; // mes corto, ej. 'jun'
  ingresos: number;
  gastos: number;
}

export interface Tendencia {
  puntos: PuntoTendencia[]; // siempre 6, rellenados con 0
  mesesConDatos: number;
}

export interface AporteMeta {
  nombre: string;
  aportePeriodo: number;
  progresoTotal: number; // % acumulado de la meta
}

export interface ProductoReporte {
  nombre: string;
  saldo: number;
  aportadoPeriodo: number;
  interesEstimado: number;
  sinTasa: boolean;
}

export interface ReporteCompleto {
  resumen: ResumenFinanciero;
  gastosCategoria: GastoCategoria[];
  comparativa: ComparativaPresupuesto;
  tendencia: Tendencia;
  aportesMetas: AporteMeta[];
  productos: ProductoReporte[];
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const MESES_CORTO = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/** Etiqueta legible de un período. */
export function etiquetaPeriodo(p: Periodo): string {
  if (p.tipo === 'general') return 'General';
  return `${MESES[p.mes - 1]} ${p.anio}`;
}
