import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { categoria } from '@/db/schema';
import { getCurrentUserId } from '@/modules/auth/data/session';

/** HU-01: clave estable de la categoría fija de ahorros del presupuesto. */
export const CLAVE_AHORROS = 'ahorros';

/**
 * Ajusta el gasto acumulado (monto_real) de la categoría fija "Ahorros" del
 * usuario activo. Se usa para que cada ahorro registrado/editado/eliminado se
 * refleje en el presupuesto:
 *   - registrar ahorro  → delta positivo
 *   - eliminar ahorro   → delta negativo
 *   - editar monto      → diferencia (nuevo − anterior)
 *
 * Pensado para llamarse dentro de un `expo.withTransactionSync`. Si la categoría
 * fija aún no existe y el delta es positivo, la crea sobre la marcha.
 */
export function ajustarMontoRealAhorros(delta: number): void {
  if (!db || !Number.isFinite(delta) || delta === 0) return;

  const uid = getCurrentUserId();

  const res = db
    .update(categoria)
    .set({ montoReal: sql`COALESCE(${categoria.montoReal}, 0) + ${delta}` })
    .where(
      uid != null
        ? and(eq(categoria.clave, CLAVE_AHORROS), eq(categoria.usuarioId, uid))
        : eq(categoria.clave, CLAVE_AHORROS)
    )
    .run();

  if (res.changes === 0 && delta > 0) {
    db.insert(categoria)
      .values({
        nombre: 'Ahorros',
        clave: CLAVE_AHORROS,
        montoEsperado: 0,
        montoReal: delta,
        porcentaje: 0,
        usuarioId: uid,
      })
      .run();
  }
}
