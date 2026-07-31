import { and, eq, isNull, or, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import sqlite from '@/db/client';
import { meta, productoFinanciero, transaccion } from '@/db/schema';
import { getCurrentUserId } from '@/modules/auth/data/session';
import type { Producto } from '@/modules/productos/domain/producto.model';

/** Clave estable de la cuenta fija "Libre" (dinero no trackeado). */
export const CLAVE_LIBRE = 'libre';

function userFilter() {
  const uid = getCurrentUserId();
  if (uid == null) return undefined;
  return or(eq(productoFinanciero.usuarioId, uid), isNull(productoFinanciero.usuarioId));
}

/**
 * Garantiza que el usuario (activo, o el `usuarioId` explícito) tenga su cuenta
 * fija "Libre". Se usa tanto al crear el usuario (registro/seed) como en cada
 * lectura de productos, para cubrir usuarios creados antes de esta feature.
 * Recibe `usuarioId` explícito porque en el registro se necesita crear la cuenta
 * antes de que `setSesion()` cambie la sesión activa.
 */
export function ensureProductoLibre(usuarioId?: number | null): Producto | null {
  if (!db) return null;
  const uid = usuarioId !== undefined ? usuarioId : getCurrentUserId();

  const existing = db
    .select()
    .from(productoFinanciero)
    .where(
      uid != null
        ? and(eq(productoFinanciero.clave, CLAVE_LIBRE), eq(productoFinanciero.usuarioId, uid))
        : eq(productoFinanciero.clave, CLAVE_LIBRE)
    )
    .get();
  if (existing) return existing as unknown as Producto;

  const result = db
    .insert(productoFinanciero)
    .values({
      nombre: 'Libre',
      montoNeto: 0,
      montoTotal: 0,
      interes: 0,
      entidadFinanciera: '',
      tipo: 'asset',
      usuarioId: uid ?? null,
      clave: CLAVE_LIBRE,
    })
    .run();

  return {
    id: Number(result.lastInsertRowId),
    nombre: 'Libre',
    montoNeto: 0,
    montoTotal: 0,
    interes: 0,
    entidadFinanciera: '',
    tipo: 'asset',
    clave: CLAVE_LIBRE,
  } as Producto;
}

/**
 * Resuelve el producto financiero a usar en una transacción: el elegido
 * explícitamente, o por defecto la cuenta "Libre" del usuario activo.
 */
export function resolveProductoFinancieroId(provided?: number | null): number | null {
  if (provided != null) return provided;
  return ensureProductoLibre()?.id ?? null;
}

function isProductoProtegido(id: number): boolean {
  if (!db) return false;
  const row = db
    .select({ clave: productoFinanciero.clave })
    .from(productoFinanciero)
    .where(eq(productoFinanciero.id, id))
    .get();
  return row?.clave === CLAVE_LIBRE;
}

export const getAllProductos = (setProductos: (p: Producto[]) => void) => {
  if (!db) { setProductos([]); return; }
  ensureProductoLibre();
  const filter = userFilter();
  const rows = filter
    ? db.select().from(productoFinanciero).where(filter).all()
    : db.select().from(productoFinanciero).all();
  setProductos(rows as unknown as Producto[]);
};

/** Lectura síncrona (para poblar selectores fuera de un componente). */
export const getProductosSync = (): Producto[] => {
  if (!db) return [];
  ensureProductoLibre();
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

/**
 * Ajusta el monto neto del producto por un delta arbitrario (positivo o negativo).
 * Solo debe usarse dentro de un withTransactionSync ya abierto por el caller.
 */
export const ajustarSaldoProductoInternal = (productId: number, delta: number) => {
  if (!db || delta === 0) return;
  db.update(productoFinanciero)
    .set({ montoNeto: sql`COALESCE(${productoFinanciero.montoNeto}, 0) + ${delta}` })
    .where(eq(productoFinanciero.id, productId))
    .run();
};

/** Lectura de saldo, tipo y clave, usada para validar antes de abrir una transacción. */
export const getProductoSaldoYTipo = (
  productId: number
): { montoNeto: number; tipo: 'asset' | 'debt'; clave: string | null } | null => {
  if (!db) return null;
  const row = db
    .select({
      montoNeto: productoFinanciero.montoNeto,
      tipo: productoFinanciero.tipo,
      clave: productoFinanciero.clave,
    })
    .from(productoFinanciero)
    .where(eq(productoFinanciero.id, productId))
    .get();
  if (!row) return null;
  return {
    montoNeto: row.montoNeto ?? 0,
    tipo: (row.tipo as 'asset' | 'debt') ?? 'asset',
    clave: row.clave ?? null,
  };
};

export const getResumenProductos = (callback: (total: number, count: number) => void) => {
  if (!db) { callback(0, 0); return; }
  ensureProductoLibre();
  const filter = userFilter();
  const rows = filter
    ? db.select().from(productoFinanciero).where(filter).all()
    : db.select().from(productoFinanciero).all();
  const total = rows.reduce((acc, p) => acc + (p.montoNeto ?? 0), 0);
  callback(total, rows.length);
};

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Un producto "participa" en capitalización si tiene tasa y frecuencia configuradas. */
function participaEnCapitalizacion(p: Producto): boolean {
  return (p.interes ?? 0) > 0 && !!p.frecuenciaCapitalizacion;
}

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
    etiqueta: p.etiqueta ?? null,
    usuarioId: getCurrentUserId(),
    frecuenciaCapitalizacion: p.frecuenciaCapitalizacion ?? null,
    // HU: fecha_ultima_capitalizacion se inicializa en la fecha de creación del producto.
    fechaUltimaCapitalizacion: participaEnCapitalizacion(p) ? hoyISO() : null,
  }).run();
};

export const updateProducto = (p: Producto) => {
  if (!db || !p.id) return;
  // La cuenta "Libre" no puede renombrarse ni cambiar de tipo (defensa adicional;
  // la UI ya no expone la opción de editarla).
  if (isProductoProtegido(p.id)) return;

  const existing = db
    .select({ fechaUltimaCapitalizacion: productoFinanciero.fechaUltimaCapitalizacion })
    .from(productoFinanciero)
    .where(eq(productoFinanciero.id, p.id))
    .get();
  const yaParticipaba = !!existing?.fechaUltimaCapitalizacion;
  const participaAhora = participaEnCapitalizacion(p);

  // Si el producto pasa de no participar a participar, arranca hoy (nunca se
  // retrocede a la fecha de creación original: evita una "emboscada" de interés
  // retroactivo sobre cuentas viejas). Si ya participaba, se conserva el último
  // corte real para seguir componiendo desde ahí. Si deja de participar, se limpia.
  const fechaUltimaCapitalizacion = participaAhora
    ? (yaParticipaba ? existing!.fechaUltimaCapitalizacion : hoyISO())
    : null;

  db.update(productoFinanciero)
    .set({
      nombre: p.nombre,
      montoNeto: p.montoNeto,
      montoTotal: p.montoTotal,
      interes: p.interes,
      entidadFinanciera: p.entidadFinanciera,
      tipo: p.tipo,
      metaId: p.metaId ?? null,
      etiqueta: p.etiqueta ?? null,
      updatedAt: new Date().toISOString(),
      frecuenciaCapitalizacion: participaAhora ? (p.frecuenciaCapitalizacion ?? null) : null,
      fechaUltimaCapitalizacion,
    })
    .where(eq(productoFinanciero.id, p.id))
    .run();
};

export const deleteProducto = (id: number) => {
  if (!db) return;
  if (isProductoProtegido(id)) return;
  db.delete(productoFinanciero).where(eq(productoFinanciero.id, id)).run();
};

/** Desvincula las transacciones asociadas antes de borrar el producto.
 *  Necesario porque PRAGMA foreign_keys = ON impide borrar con referencias activas. */
export const deleteProductoYDesvincular = (id: number): boolean => {
  if (!db) return false;
  // La cuenta "Libre" no puede eliminarse (defensa adicional; la UI ya no
  // expone la opción de eliminarla).
  if (isProductoProtegido(id)) return false;
  const tiene = sqlite.getFirstSync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM transaccion WHERE producto_financiero_id = ?', [id]
  );
  sqlite.runSync('UPDATE transaccion SET producto_financiero_id = NULL WHERE producto_financiero_id = ?', [id]);
  db.delete(productoFinanciero).where(eq(productoFinanciero.id, id)).run();
  return (tiene?.n ?? 0) > 0;
};

export type MetaVinculada = { id: number; nombre: string; monto: number; metaTotal: number };

/**
 * Metas que han recibido ahorros a través de este producto (vía transacciones
 * tipo 'saving' con este producto_financiero_id). No existe una columna formal
 * de vínculo meta↔producto en uso; este es el vínculo real derivado del historial.
 */
export function getMetasVinculadasProducto(productoId: number): MetaVinculada[] {
  if (!db) return [];
  const rows = db
    .selectDistinct({
      id: meta.id,
      nombre: meta.nombre,
      monto: meta.monto,
      metaTotal: meta.metaTotal,
    })
    .from(transaccion)
    .innerJoin(meta, eq(transaccion.metaId, meta.id))
    .where(and(eq(transaccion.productoFinancieroId, productoId), eq(transaccion.tipo, 'saving')))
    .all();
  return rows.map((r) => ({ id: r.id, nombre: r.nombre, monto: r.monto ?? 0, metaTotal: r.metaTotal }));
}

export type AdvertenciaCuenta = { etiqueta: 'ahorro' | 'inversion'; metas: MetaVinculada[] } | null;

/**
 * Determina si se debe advertir antes de gastar de esta cuenta: solo si está
 * etiquetada 'ahorro'/'inversion' y no todas sus metas vinculadas están completas
 * (o no tiene ninguna vinculada).
 */
export function getAdvertenciaCuenta(productoId: number): AdvertenciaCuenta {
  if (!db) return null;
  const row = db
    .select({ etiqueta: productoFinanciero.etiqueta })
    .from(productoFinanciero)
    .where(eq(productoFinanciero.id, productoId))
    .get();
  const etiqueta = row?.etiqueta as 'ahorro' | 'inversion' | null | undefined;
  if (etiqueta !== 'ahorro' && etiqueta !== 'inversion') return null;

  const metas = getMetasVinculadasProducto(productoId);
  const todasCumplidas = metas.length > 0 && metas.every((m) => m.monto >= m.metaTotal);
  if (todasCumplidas) return null;

  return { etiqueta, metas };
}
