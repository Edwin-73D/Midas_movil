import expo, { db } from '@/db/client';
import { transaccion } from '@/db/schema';
import { addMontoToMetaInternal } from '@/modules/metas/data/meta.service';
import { addMontoToProductoInternal } from '@/modules/productos/data/producto.service';
import type { ExpenseCategory } from '@/modules/shared/finance/categories';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

type TransactionType = 'income' | 'expense' | 'saving';

type TransactionInput = {
  type: TransactionType;
  amount: number;
  category: ExpenseCategory | null;
  description: string;
  metaId?: number;
  productoFinancieroId?: number;
};

type TransactionDeps = {
  resolveCategoriaId: (category: ExpenseCategory) => number | null;
  onPresupuestoGasto: (categoriaId: number, amount: number) => void | Promise<void>;
};

export function registrarTransaccion(
  input: TransactionInput,
  deps: TransactionDeps
): void {
  if (!db) return;

  // El ahorro nunca lleva categoría de gasto: no debe contar en el presupuesto.
  const categoriaId =
    input.type === 'expense' && input.category
      ? deps.resolveCategoriaId(input.category)
      : null;

  expo.withTransactionSync(() => {
    const result = db!
      .insert(transaccion)
      .values({
        nombre: input.description || null,
        valorTransaccion: input.amount,
        tipo: input.type,
        categoriaId: categoriaId ?? null,
        metaId: input.metaId ?? null,
        productoFinancieroId: input.productoFinancieroId ?? null,
        descripcion: input.description || null,
      })
      .run();

    // Meta opcional: actualiza su progreso (aplica a ahorro con meta).
    if (input.metaId != null) {
      addMontoToMetaInternal({
        metaId: input.metaId,
        amount: input.amount,
        descripcion: input.description,
        transaccionId: Number(result.lastInsertRowId),
      });
    }

    // Un ahorro incrementa el saldo del producto financiero destino.
    if (input.type === 'saving' && input.productoFinancieroId != null) {
      addMontoToProductoInternal(input.productoFinancieroId, input.amount);
    }
  });

  // Solo los gastos impactan el presupuesto.
  if (input.type === 'expense' && categoriaId != null) {
    deps.onPresupuestoGasto(categoriaId, input.amount);
  }

  transactionEvents.emit();
}
