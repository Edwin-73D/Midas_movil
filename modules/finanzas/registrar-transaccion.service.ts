import expo, { db } from '@/db/client';
import { transaccion } from '@/db/schema';
import { addMontoToMetaInternal } from '@/modules/metas/data/meta.service';
import type { ExpenseCategory } from '@/modules/shared/finance/categories';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

type TransactionInput = {
  type: 'income' | 'expense';
  amount: number;
  category: ExpenseCategory | null;
  description: string;
  metaId?: number;
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

  const categoriaId = input.category ? deps.resolveCategoriaId(input.category) : null;

  expo.withTransactionSync(() => {
    const result = db!
      .insert(transaccion)
      .values({
        nombre: input.description || null,
        valorTransaccion: input.amount,
        categoriaId: categoriaId ?? null,
        metaId: input.metaId ?? null,
        descripcion: input.description || null,
      })
      .run();

    if (input.metaId != null) {
      addMontoToMetaInternal({
        metaId: input.metaId,
        amount: input.amount,
        descripcion: input.description,
        transaccionId: Number(result.lastInsertRowid),
      });
    }
  });

  if (input.type === 'expense' && categoriaId != null) {
    deps.onPresupuestoGasto(categoriaId, input.amount);
  }

  transactionEvents.emit();
}
