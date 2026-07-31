import { eq, sql } from 'drizzle-orm';

import expo, { db } from '@/db/client';
import { meta, metaAporte, productoFinanciero, transaccion } from '@/db/schema';
import { ajustarMontoRealAhorros } from '@/modules/finanzas/ahorro-categoria';
import { metaEvents } from '@/modules/metas/metaEvents';
import { TransaccionRepository } from '@/modules/transacciones/TransaccionRepository';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

type Opts = {
  onPresupuestoGasto?: (categoriaId: number, monto: number) => Promise<void> | void;
};

export function eliminarTransaccion(id: number, opts: Opts = {}): void {
  if (!db) return;
  const tx = TransaccionRepository.getById(id);
  if (!tx) return;

  try {
    // El presupuesto usa runAsync, se actualiza fuera del withTransactionSync
    // (mismo patrón que registrar-transaccion).
    if (tx.tipo === 'expense' && tx.categoria_id != null) {
      opts.onPresupuestoGasto?.(tx.categoria_id, -tx.valor_transaccion);
    }

    expo.withTransactionSync(() => {
      // Reversar aporte a meta si existía
      if (tx.meta_id != null) {
        const aportes = db!
          .select()
          .from(metaAporte)
          .where(eq(metaAporte.transaccionId, id))
          .all();
        const totalAporte = aportes.reduce((acc, a) => acc + a.monto, 0);

        if (totalAporte > 0) {
          db!.update(meta)
            .set({ monto: sql`COALESCE(${meta.monto}, 0) - ${totalAporte}` })
            .where(eq(meta.id, tx.meta_id))
            .run();
        }

        db!.delete(metaAporte)
          .where(eq(metaAporte.transaccionId, id))
          .run();
      }

      // Revertir saldo del producto financiero si era un ahorro o ingreso vinculado
      if ((tx.tipo === 'saving' || tx.tipo === 'income') && tx.producto_financiero_id != null) {
        db!.update(productoFinanciero)
          .set({
            montoNeto: sql`COALESCE(${productoFinanciero.montoNeto}, 0) - ${tx.valor_transaccion}`,
          })
          .where(eq(productoFinanciero.id, tx.producto_financiero_id))
          .run();
      }

      // Un gasto vinculado libera de vuelta el saldo del producto al borrarse.
      if (tx.tipo === 'expense' && tx.producto_financiero_id != null) {
        db!.update(productoFinanciero)
          .set({
            montoNeto: sql`COALESCE(${productoFinanciero.montoNeto}, 0) + ${tx.valor_transaccion}`,
          })
          .where(eq(productoFinanciero.id, tx.producto_financiero_id))
          .run();
      }

      // HU-01: revertir el aporte de este ahorro en la categoría "Ahorros".
      if (tx.tipo === 'saving') {
        ajustarMontoRealAhorros(-tx.valor_transaccion);
      }

      db!.delete(transaccion)
        .where(eq(transaccion.id, id))
        .run();
    });

    if (tx.meta_id != null) metaEvents.emit();
    transactionEvents.emit();
  } catch (e) {
    console.log('Error eliminarTransaccion:', e);
  }
}
