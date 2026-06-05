export interface Meta {
  id?: number;
  nombre: string;
  metaTotal: number;
  monto: number;
  porcentajeActual: number;
  descripcion?: string;
  fechaFinalizar: string;
}

/** Crear / editar meta (sin modificar ahorro acumulado). */
export type MetaFormInput = {
  id?: number;
  nombre: string;
  metaTotal: number;
  descripcion?: string;
  fechaFinalizar: string;
};
