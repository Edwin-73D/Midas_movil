/** Formato de moneda consistente para la pantalla de reportes. */
export function fmtMoney(value: number): string {
  const rounded = Math.round(value);
  return `$ ${rounded.toLocaleString('es-CO')}`;
}

/** Colores para barras de categorías, reutiliza la convención del proyecto. */
export const CATEGORY_COLORS: Record<string, string> = {
  needs: '#F5A623',
  wants: '#9B59B6',
  savings: '#4CAF50',
  'savings & debt': '#4CAF50',
};

const PALETTE = ['#C8A84B', '#3498DB', '#E74C3C', '#1ABC9C', '#9B59B6', '#F39C12', '#16A085'];

export function colorParaCategoria(nombre: string, index: number): string {
  const key = nombre.toLowerCase();
  return CATEGORY_COLORS[key] ?? PALETTE[index % PALETTE.length];
}
