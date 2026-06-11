import { and, eq, isNull, or, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import sqlite from '@/db/client';
import { productoFinanciero } from '@/db/schema';
import { getCurrentUserId } from '@/modules/auth/data/session';
import type { Producto } from '@/modules/productos/domain/producto.model';

function userFilter() {
  const uid = getCurrentUserId();
  if (uid == null) return undefined;
  return or(eq(productoFinanciero.usuarioId, uid), isNull(productoFinanciero.usuarioId));
}

export const getAllProductos = (setProductos: (p: Producto[]) => void) => {
  if (!db) { setProductos([]); return; }
  const filter = userFilter();
  const rows = filter
    ? db.select().from(productoFinanciero).where(filter).all()
    : db.select().from(productoFinanciero).all();
  setProductos(rows as unknown as Producto[]);
};

/** Lectura síncrona (para poblar selectores fuera de un componente). */
export const getProductosSync = (): Producto[] => {
  if (!db) return [];
  const filter = userFilter();
  const rows = filter
    ? db.select().from(productoFinanciero).where(filter).all()
    : db.select().from(productoFinanciero).all();
  return rows as unknown as Producto[];
};

/**
 * Suma un ahorro al monto neto del producto destino.
 * Solo debe usarse dentro de un withTransactionSync (registrar-transaccion).
 */
export const addMontoToProductoInternal = (productId: number, amount: number) => {
  if (!db || amount <= 0) return;
  db.update(productoFinanciero)
    .set({ montoNeto: sql`COALESCE(${productoFinanciero.montoNeto}, 0) + ${amount}` })
    .where(eq(productoFinanciero.id, productId))
    .run();
};

export const getResumenProductos = (callback: (total: number, count: number) => void) => {
  if (!db) { callback(0, 0); return; }
  const filter = userFilter();
  const rows = filter
    ? db.select().from(productoFinanciero).where(filter).all()
    : db.select().from(productoFinanciero).all();
  const total = rows.reduce((acc, p) => acc + (p.montoNeto ?? 0), 0);
  callback(total, rows.length);
};

export const insertProducto = (p: Producto) => {
  if (!db) return;
  db.insert(productoFinanciero).values({
    nombre: p.nombre,
    montoNeto: p.montoNeto,
    montoTotal: p.montoTotal,
    interes: p.interes,
    entidadFinanciera: p.entidadFinanciera,
    tipo: p.tipo,
    metaId: p.metaId ?? null,
    usuarioId: getCurrentUserId(),
  }).run();
};

export const updateProducto = (p: Producto) => {
  if (!db || !p.id) return;
  db.update(productoFinanciero)
    .set({
      nombre: p.nombre,
      montoNeto: p.montoNeto,
      montoTotal: p.montoTotal,
      interes: p.interes,
      entidadFinanciera: p.entidadFinanciera,
      tipo: p.tipo,
      metaId: p.metaId ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(productoFinanciero.id, p.id))
    .run();
};

export const deleteProducto = (id: number) => {
  if (!db) return;
  db.delete(productoFinanciero).where(eq(productoFinanciero.id, id)).run();
};

/** Desvincula las transacciones asociadas antes de borrar el producto.
 *  Necesario porque PRAGMA foreign_keys = ON impide borrar con referencias activas. */
export const deleteProductoYDesvincular = (id: number): boolean => {
  if (!db) return false;
  const tiene = sqlite.getFirstSync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM transaccion WHERE producto_financiero_id = ?', [id]
  );
  sqlite.runSync('UPDATE transaccion SET producto_financiero_id = NULL WHERE producto_financiero_id = ?', [id]);
  db.delete(productoFinanciero).where(eq(productoFinanciero.id, id)).run();
  return (tiene?.n ?? 0) > 0;
};
