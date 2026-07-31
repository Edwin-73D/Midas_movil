import expo, { db } from '@/db/client';
import { transaccion } from '@/db/schema';
import { getCurrentUserId } from '@/modules/auth/data/session';
import { ajustarMontoRealAhorros } from '@/modules/finanzas/ahorro-categoria';
import { addMontoToMetaInternal } from '@/modules/metas/data/meta.service';
import {
  addMontoToProductoInternal,
  ajustarSaldoProductoInternal,
  CLAVE_LIBRE,
  getProductoSaldoYTipo,
  resolveProductoFinancieroId,
} from '@/modules/productos/data/producto.service';
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

  // Si no se eligió cuenta explícita, se asigna la cuenta "Libre" por defecto.
  const productoFinancieroId = resolveProductoFinancieroId(input.productoFinancieroId);

  // Validar saldo disponible antes de tocar la DB, para no dejar una transacción
  // insertada sin su ajuste de saldo correspondiente si se aborta.
  if (input.type === 'expense' && productoFinancieroId != null) {
    const producto = getProductoSaldoYTipo(productoFinancieroId);
    if (producto?.tipo === 'asset' && input.amount > producto.montoNeto) {
      throw new Error(producto.clave === CLAVE_LIBRE ? 'LIBRE_SIN_FONDOS' : 'INSUFFICIENT_FUNDS');
    }
  }

  expo.withTransactionSync(() => {
    const result = db!
      .insert(transaccion)
      .values({
        nombre: input.description || null,
        valorTransaccion: input.amount,
        tipo: input.type,
        categoriaId: categoriaId ?? null,
        metaId: input.metaId ?? null,
        productoFinancieroId: productoFinancieroId ?? null,
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

    // Un ahorro o un ingreso pueden acreditarse al saldo de un producto financiero.
    if ((input.type === 'saving' || input.type === 'income') && productoFinancieroId != null) {
      addMontoToProductoInternal(productoFinancieroId, input.amount);
    }

    // Un gasto vinculado a un producto financiero debita su saldo.
    if (input.type === 'expense' && productoFinancieroId != null) {
      ajustarSaldoProductoInternal(productoFinancieroId, -input.amount);
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
