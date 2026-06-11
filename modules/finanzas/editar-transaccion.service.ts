import sqlite from '@/db/client';
import type { ExpenseCategory } from '@/modules/shared/finance/categories';
import { TransaccionRepository } from '@/modules/transacciones/TransaccionRepository';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

type EditData = {
  type: 'income' | 'expense' | 'saving';
  amount: number;
  category: ExpenseCategory | null;
  description: string;
  metaId?: number;
};

type Opts = {
  resolveCategoriaId: (cat: ExpenseCategory) => number | null;
  onPresupuestoGasto?: (categoriaId: number, monto: number) => Promise<void> | void;
};

export function editarTransaccion(id: number, data: EditData, opts: Opts): void {
  const old = TransaccionRepository.getById(id);
  if (!old) return;

  try {
    // Revertir efecto del presupuesto anterior
    if (old.tipo === 'expense' && old.categoria_id != null) {
      opts.onPresupuestoGasto?.(old.categoria_id, -old.valor_transaccion);
    }

    const newCatId =
      data.type === 'expense' && data.category
        ? opts.resolveCategoriaId(data.category)
        : null;

    // Aplicar nuevo efecto de presupuesto
    if (data.type === 'expense' && newCatId != null) {
      opts.onPresupuestoGasto?.(newCatId, data.amount);
    }

    sqlite.runSync(
      `UPDATE transaccion
       SET nombre = ?, valor_transaccion = ?, categoria_id = ?, descripcion = ?, tipo = ?
       WHERE ID = ?`,
      [data.description || null, data.amount, newCatId, data.description || null, data.type, id]
    );

    transactionEvents.emit();
  } catch (e) {
    console.log('Error editarTransaccion:', e);
  }
}
