export type ProductoTipo = 'asset' | 'debt';

export interface Producto {
  id?: number;
  nombre: string;
  montoNeto: number;
  montoTotal: number;
  interes: number;
  entidadFinanciera: string;
  tipo: ProductoTipo;
  updatedAt?: string;
  metaId?: number | null;
}
