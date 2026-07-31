import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { categoria } from '@/db/schema';
import { getCurrentUserId } from '@/modules/auth/data/session';

/** Clave estable de la categoría fija de intereses de deuda. */
export const CLAVE_INTERESES = 'intereses';

/**
 * Devuelve el id de la categoría fija "Intereses" del usuario activo,
 * creándola sobre la marcha si aún no existe. A diferencia de
 * ajustarMontoRealAhorros, aquí sí se necesita el id porque una transacción
 * `expense` debe enlazar un categoriaId (regla de dominio).
 * Pensado para llamarse dentro de un expo.withTransactionSync ya abierto.
 */
export function obtenerOCrearCategoriaIntereses(): number {
  const uid = getCurrentUserId();

  const existing = db!
    .select({ id: categoria.id })
    .from(categoria)
    .where(
      uid != null
        ? and(eq(categoria.clave, CLAVE_INTERESES), eq(categoria.usuarioId, uid))
        : eq(categoria.clave, CLAVE_INTERESES)
    )
    .get();
  if (existing) return existing.id;

  const result = db!
    .insert(categoria)
    .values({
      nombre: 'Intereses',
      clave: CLAVE_INTERESES,
      montoEsperado: 0,
      montoReal: 0,
      porcentaje: 0,
      usuarioId: uid,
    })
    .run();
  return Number(result.lastInsertRowId);
}

/**
 * Ajusta el gasto acumulado (monto_real) de la categoría fija "Intereses" del
 * usuario activo. Se usa para que cada interés de deuda capitalizado se
 * refleje en el presupuesto. Pensado para llamarse dentro de un
 * `expo.withTransactionSync` ya abierto.
 */
export function ajustarMontoRealIntereses(delta: number): void {
  if (!db || !Number.isFinite(delta) || delta === 0) return;

  const uid = getCurrentUserId();

  const res = db
    .update(categoria)
    .set({ montoReal: sql`COALESCE(${categoria.montoReal}, 0) + ${delta}` })
    .where(
      uid != null
        ? and(eq(categoria.clave, CLAVE_INTERESES), eq(categoria.usuarioId, uid))
        : eq(categoria.clave, CLAVE_INTERESES)
    )
    .run();

  if (res.changes === 0 && delta > 0) {
    db.insert(categoria)
      .values({
        nombre: 'Intereses',
        clave: CLAVE_INTERESES,
        montoEsperado: 0,
        montoReal: delta,
        porcentaje: 0,
        usuarioId: uid,
      })
      .run();
  }
}
