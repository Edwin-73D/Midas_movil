export type ProductoTipo = 'asset' | 'debt';

export type FrecuenciaCapitalizacion = 'mensual' | 'trimestral' | 'semestral' | 'anual';

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
  // Clave estable de la cuenta fija "Libre" (dinero no trackeado); null en el resto.
  clave?: string | null;
  // Propósito declarado de la cuenta; null/undefined = sin etiquetar.
  etiqueta?: 'ahorro' | 'inversion' | null;
  // Frecuencia de capitalización del interés; null/undefined = no participa.
  frecuenciaCapitalizacion?: FrecuenciaCapitalizacion | null;
  // Última fecha (YYYY-MM-DD) hasta la que se aplicó capitalización; null/undefined = no participa.
  fechaUltimaCapitalizacion?: string | null;
}
