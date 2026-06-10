import { eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { productoFinanciero } from '@/db/schema';
import type { Producto } from '@/modules/productos/domain/producto.model';

export const getAllProductos = (setProductos: (p: Producto[]) => void) => {
  if (!db) { setProductos([]); return; }
  const rows = db.select().from(productoFinanciero).all();
  setProductos(rows as unknown as Producto[]);
};

/** Lectura síncrona (para poblar selectores fuera de un componente). */
export const getProductosSync = (): Producto[] => {
  if (!db) return [];
  return db.select().from(productoFinanciero).all() as unknown as Producto[];
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
  const rows = db.select().from(productoFinanciero).all();
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
