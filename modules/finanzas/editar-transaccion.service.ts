import { eq, sql } from 'drizzle-orm';

import expo, { db } from '@/db/client';
import { meta, metaAporte, transaccion } from '@/db/schema';
import { ajustarMontoRealAhorros } from '@/modules/finanzas/ahorro-categoria';
import { metaEvents } from '@/modules/metas/metaEvents';
import { TransaccionRepository } from '@/modules/transacciones/TransaccionRepository';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

type EditData = {
  type: 'income' | 'expense' | 'saving';
  amount: number;
  category: number | null;
  description: string;
  metaId?: number;
};

type Opts = {
  resolveCategoriaId: (cat: number) => number | null;
  onPresupuestoGasto?: (categoriaId: number, monto: number) => Promise<void> | void;
};

export function editarTransaccion(id: number, data: EditData, opts: Opts): void {
  if (!db) return;
  const old = TransaccionRepository.getById(id);
  if (!old) return;

  try {
    // Presupuesto actualiza con runAsync: se gestiona fuera del withTransactionSync
    // (mismo patrón que registrar-transaccion).
    if (old.tipo === 'expense' && old.categoria_id != null) {
      opts.onPresupuestoGasto?.(old.categoria_id, -old.valor_transaccion);
    }

    const newCatId =
      data.type === 'expense' && data.category
        ? opts.resolveCategoriaId(data.category)
        : null;

    if (data.type === 'expense' && newCatId != null) {
      opts.onPresupuestoGasto?.(newCatId, data.amount);
    }

    expo.withTransactionSync(() => {
      // HU-01: revertir el aporte anterior a la categoría "Ahorros" y aplicar
      // el nuevo, según el tipo antes/después de la edición.
      if (old.tipo === 'saving') {
        ajustarMontoRealAhorros(-old.valor_transaccion);
      }
      if (data.type === 'saving') {
        ajustarMontoRealAhorros(data.amount);
      }

      // 1. Reversar aporte anterior a meta si existía
      if (old.meta_id != null) {
        const aportes = db!
          .select()
          .from(metaAporte)
          .where(eq(metaAporte.transaccionId, id))
          .all();
        const totalAnterior = aportes.reduce((acc, a) => acc + a.monto, 0);

        if (totalAnterior > 0) {
          db!.update(meta)
            .set({ monto: sql`COALESCE(${meta.monto}, 0) - ${totalAnterior}` })
            .where(eq(meta.id, old.meta_id))
            .run();
        }

        db!.delete(metaAporte)
          .where(eq(metaAporte.transaccionId, id))
          .run();
      }

      // 2. Actualizar la transacción, incluyendo meta_id
      const newMetaId = data.metaId ?? null;
      db!.update(transaccion)
        .set({
          nombre: data.description || null,
          valorTransaccion: data.amount,
          categoriaId: newCatId,
          descripcion: data.description || null,
          tipo: data.type,
          metaId: newMetaId,
        })
        .where(eq(transaccion.id, id))
        .run();

      // 3. Crear nuevo aporte si el nuevo tipo es saving con meta
      if (data.type === 'saving' && newMetaId != null) {
        db!.insert(metaAporte)
          .values({
            metaId: newMetaId,
            monto: data.amount,
            descripcion: data.description,
            transaccionId: id,
          })
          .run();

        db!.update(meta)
          .set({ monto: sql`COALESCE(${meta.monto}, 0) + ${data.amount}` })
          .where(eq(meta.id, newMetaId))
          .run();
      }
    });

    if (old.meta_id != null || data.metaId != null) metaEvents.emit();
    transactionEvents.emit();
  } catch (e) {
    console.log('Error editarTransaccion:', e);
  }
}
