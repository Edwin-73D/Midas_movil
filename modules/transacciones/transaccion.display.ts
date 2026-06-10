import { MidasColors } from '@/constants/theme';
import type { TransaccionRow, TransaccionTipo } from './TransaccionRepository';

const EXPENSE_COLOR = '#E74C3C';

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
  valor: number
): { text: string; color: string } {
  const abs = Math.abs(valor).toFixed(2);
  switch (tipo) {
    case 'income':
      return { text: `+$${abs}`, color: MidasColors.positive };
    case 'saving':
      return { text: `↑ $${abs}`, color: MidasColors.gold };
    case 'expense':
      return { text: `-$${abs}`, color: EXPENSE_COLOR };
    default:
      // Filas heredadas sin tipo: se infiere por el signo del valor.
      return valor >= 0
        ? { text: `+$${abs}`, color: MidasColors.positive }
        : { text: `-$${abs}`, color: EXPENSE_COLOR };
  }
}
