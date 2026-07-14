import { MidasColorsDark, type MidasPalette } from '@/constants/theme';
import type { TransaccionRow, TransaccionTipo } from './TransaccionRepository';

/**
 * Título a mostrar de una transacción.
 * HU-16: un ahorro no tiene descripción; su título es la meta o, si no hay,
 * el producto financiero destino.
 */
export function transactionTitle(
  tx: Pick<
    TransaccionRow,
    'tipo' | 'nombre' | 'descripcion' | 'meta_nombre' | 'producto_nombre'
  >
): string {
  if (tx.tipo === 'saving') {
    return tx.meta_nombre || tx.producto_nombre || 'Ahorro';
  }
  return tx.nombre || tx.descripcion || 'Transacción';
}

/** Texto y color del monto según el tipo de transacción (HU-16). */
export function amountDisplay(
  tipo: TransaccionTipo | null,
  valor: number,
  c: MidasPalette = MidasColorsDark,
): { text: string; color: string } {
  const abs = Math.abs(valor).toFixed(2);
  switch (tipo) {
    case 'income':
      return { text: `+$${abs}`, color: c.positive };
    case 'saving':
      return { text: `↑ $${abs}`, color: c.gold };
    case 'expense':
      return { text: `-$${abs}`, color: c.danger };
    default:
      return valor >= 0
        ? { text: `+$${abs}`, color: c.positive }
        : { text: `-$${abs}`, color: c.danger };
  }
}
