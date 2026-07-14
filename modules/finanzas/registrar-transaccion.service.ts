import expo, { db } from '@/db/client';
import { transaccion } from '@/db/schema';
import { getCurrentUserId } from '@/modules/auth/data/session';
import { ajustarMontoRealAhorros } from '@/modules/finanzas/ahorro-categoria';
import { addMontoToMetaInternal } from '@/modules/metas/data/meta.service';
import { addMontoToProductoInternal } from '@/modules/productos/data/producto.service';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

type TransactionType = 'income' | 'expense' | 'saving';

type TransactionInput = {
  type: TransactionType;
  amount: number;
  category: number | null;
  description: string;
  metaId?: number;
  productoFinancieroId?: number;
};

type TransactionDeps = {
  resolveCategoriaId: () => number | null;
  onPresupuestoGasto: (categoriaId: number, amount: number) => void | Promise<void>;
};

export async function registrarTransaccion(
  input: TransactionInput,
  deps: TransactionDeps
): Promise<void> {
  if (!db) return;

  // El ahorro nunca lleva categoría de gasto: no debe contar en el presupuesto.
  const categoriaId =
    input.type === 'expense' && input.category != null
      ? deps.resolveCategoriaId()
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
        usuarioId: getCurrentUserId(),
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

    // HU-01: el ahorro suma a la categoría fija "Ahorros" del presupuesto.
    if (input.type === 'saving') {
      ajustarMontoRealAhorros(input.amount);
    }
  });

  // Solo los gastos impactan el presupuesto.
  if (input.type === 'expense' && categoriaId != null) {
    await deps.onPresupuestoGasto(categoriaId, input.amount);
  }

  transactionEvents.emit();
}
