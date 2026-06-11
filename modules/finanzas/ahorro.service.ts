import { and, desc, eq, sql } from 'drizzle-orm';

import expo, { db } from '@/db/client';
import { meta, metaAporte, productoFinanciero, transaccion } from '@/db/schema';
import { metaEvents } from '@/modules/metas/metaEvents';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

export type AhorroProducto = {
  id: number;
  monto: number;
  fechaHora: string;
  descripcion: string | null;
  metaId: number | null;
  metaNombre: string | null;
};

/** Ahorros (tipo 'saving') asociados a un producto financiero, recientes primero. */
export function getAhorrosPorProducto(productId: number): AhorroProducto[] {
  if (!db) return [];
  const rows = db
    .select({
      id: transaccion.id,
      monto: transaccion.valorTransaccion,
      fechaHora: transaccion.fechaHora,
      descripcion: transaccion.descripcion,
      metaId: transaccion.metaId,
      metaNombre: meta.nombre,
    })
    .from(transaccion)
    .leftJoin(meta, eq(transaccion.metaId, meta.id))
    .where(
      and(eq(transaccion.productoFinancieroId, productId), eq(transaccion.tipo, 'saving'))
    )
    .orderBy(desc(transaccion.fechaHora))
    .all();

  return rows.map((r) => ({
    id: r.id,
    monto: r.monto,
    fechaHora: r.fechaHora ?? '',
    descripcion: r.descripcion,
    metaId: r.metaId,
    metaNombre: r.metaNombre,
  }));
}

/** Suma de los ahorros asociados a un producto. */
export function getTotalAhorradoProducto(productId: number): number {
  if (!db) return 0;
  const row = db
    .select({
      total: sql<number>`COALESCE(SUM(${transaccion.valorTransaccion}), 0)`,
    })
    .from(transaccion)
    .where(
      and(eq(transaccion.productoFinancieroId, productId), eq(transaccion.tipo, 'saving'))
    )
    .get();
  return row?.total ?? 0;
}

/**
 * Elimina un ahorro y revierte su efecto en el saldo del producto y, si tenía
 * meta asociada, en el progreso de la meta (y su aporte).
 */
export function eliminarAhorro(transaccionId: number): void {
  if (!db) return;

  expo.withTransactionSync(() => {
    const row = db!
      .select()
      .from(transaccion)
      .where(eq(transaccion.id, transaccionId))
      .get();
    if (!row || row.tipo !== 'saving') return;

    const monto = row.valorTransaccion;

    if (row.productoFinancieroId != null) {
      db!
        .update(productoFinanciero)
        .set({ montoNeto: sql`COALESCE(${productoFinanciero.montoNeto}, 0) - ${monto}` })
        .where(eq(productoFinanciero.id, row.productoFinancieroId))
        .run();
    }

    if (row.metaId != null) {
      // Restar exactamente lo aportado por esta transacción y borrar el aporte
      // ANTES de borrar la transacción (la FK del aporte es ON DELETE SET NULL).
      const aportes = db!
        .select()
        .from(metaAporte)
        .where(eq(metaAporte.transaccionId, transaccionId))
        .all();
      const totalAporte = aportes.reduce((acc, a) => acc + a.monto, 0);

      db!
        .update(meta)
        .set({ monto: sql`COALESCE(${meta.monto}, 0) - ${totalAporte}` })
        .where(eq(meta.id, row.metaId))
        .run();

      db!.delete(metaAporte).where(eq(metaAporte.transaccionId, transaccionId)).run();
    }

    db!.delete(transaccion).where(eq(transaccion.id, transaccionId)).run();
  });

  metaEvents.emit();
  transactionEvents.emit();
}

/**
 * Edita el monto de un ahorro y ajusta por diferencia el saldo del producto y,
 * si aplica, el progreso de la meta y su aporte.
 */
export function editarMontoAhorro(transaccionId: number, nuevoMonto: number): void {
  if (!db || !Number.isFinite(nuevoMonto) || nuevoMonto <= 0) return;

  expo.withTransactionSync(() => {
    const row = db!
      .select()
      .from(transaccion)
      .where(eq(transaccion.id, transaccionId))
      .get();
    if (!row || row.tipo !== 'saving') return;

    const delta = nuevoMonto - row.valorTransaccion;
    if (delta === 0) return;

    db!
      .update(transaccion)
      .set({ valorTransaccion: nuevoMonto })
      .where(eq(transaccion.id, transaccionId))
      .run();

    if (row.productoFinancieroId != null) {
      db!
        .update(productoFinanciero)
        .set({ montoNeto: sql`COALESCE(${productoFinanciero.montoNeto}, 0) + ${delta}` })
        .where(eq(productoFinanciero.id, row.productoFinancieroId))
        .run();
    }

    if (row.metaId != null) {
      db!
        .update(meta)
        .set({ monto: sql`COALESCE(${meta.monto}, 0) + ${delta}` })
        .where(eq(meta.id, row.metaId))
        .run();

      db!
        .update(metaAporte)
        .set({ monto: nuevoMonto })
        .where(eq(metaAporte.transaccionId, transaccionId))
        .run();
    }
  });

  metaEvents.emit();
  transactionEvents.emit();
}
