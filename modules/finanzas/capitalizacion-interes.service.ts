import { eq, sql } from 'drizzle-orm';

import expo, { db } from '@/db/client';
import { productoFinanciero, transaccion } from '@/db/schema';
import { getCurrentUserId } from '@/modules/auth/data/session';
import {
  ajustarMontoRealIntereses,
  obtenerOCrearCategoriaIntereses,
} from '@/modules/finanzas/interes-categoria';
import { presupuestoEvents } from '@/modules/presupuesto/presupuestoEvents';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

type Frecuencia = 'mensual' | 'trimestral' | 'semestral' | 'anual';

const MESES_POR_PERIODO: Record<Frecuencia, number> = {
  mensual: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

const PERIODOS_POR_ANIO: Record<Frecuencia, number> = {
  mensual: 12,
  trimestral: 4,
  semestral: 2,
  anual: 1,
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Suma N meses a una fecha YYYY-MM-DD, con clamp de fin de mes (mismo patrón que
 *  proximaFecha() en transaccion-recurrente.service.ts, p.ej. 31-ene + 1 mes → 28/29-feb). */
function addMonthsClamped(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return toISODate(d);
}

type ProductoElegible = {
  id: number;
  montoNeto: number | null;
  tipo: string | null;
  interes: number | null;
  frecuenciaCapitalizacion: string;
  fechaUltimaCapitalizacion: string;
  usuarioId: number | null;
};

/**
 * Revisa todos los productos financieros con tasa y frecuencia de
 * capitalización configuradas, y aplica interés compuesto por cada periodo
 * vencido desde `fechaUltimaCapitalizacion` hasta hoy. Se ejecuta al abrir la
 * app (mismo patrón que `procesarRecurrentes`), pero a diferencia de ese motor
 * SÍ hace catch-up de múltiples periodos vencidos: el criterio de aceptación
 * exige un movimiento por cada periodo vencido, componiendo uno sobre otro.
 *
 * No reutiliza `registrarTransaccion`/`ajustarSaldoProductoInternal`: esas
 * rutas asumen que toda transacción `expense` resta del producto vinculado,
 * mientras que el interés de una deuda debe sumar a lo que se debe.
 */
export function procesarCapitalizacionIntereses(): void {
  if (!db) return;

  const uid = getCurrentUserId();
  const hoy = toISODate(new Date());

  let productos: ProductoElegible[] = [];
  try {
    const rows = db
      .select({
        id: productoFinanciero.id,
        montoNeto: productoFinanciero.montoNeto,
        tipo: productoFinanciero.tipo,
        interes: productoFinanciero.interes,
        frecuenciaCapitalizacion: productoFinanciero.frecuenciaCapitalizacion,
        fechaUltimaCapitalizacion: productoFinanciero.fechaUltimaCapitalizacion,
        usuarioId: productoFinanciero.usuarioId,
      })
      .from(productoFinanciero)
      .all();

    productos = rows.filter(
      (r): r is ProductoElegible =>
        (r.interes ?? 0) > 0 &&
        !!r.frecuenciaCapitalizacion &&
        !!r.fechaUltimaCapitalizacion &&
        (uid == null || r.usuarioId == null || r.usuarioId === uid)
    );
  } catch (e) {
    console.log('Error leyendo productos para capitalización:', e);
    return;
  }

  let huboCambios = false;
  let huboDeuda = false;

  for (const producto of productos) {
    try {
      const frecuencia = producto.frecuenciaCapitalizacion as Frecuencia;
      const periodMonths = MESES_POR_PERIODO[frecuencia];
      const periodsPerYear = PERIODOS_POR_ANIO[frecuencia];
      // Decisión: tasa anual nominal, conversión simple (no efectiva compuesta).
      const tasaPeriodo = (producto.interes ?? 0) / 100 / periodsPerYear;
      const esDeuda = producto.tipo === 'debt';

      let cursor = producto.fechaUltimaCapitalizacion;
      let saldo = producto.montoNeto ?? 0;
      let categoriaInteresesId: number | null = null;
      let procesoAlguno = false;

      expo.withTransactionSync(() => {
        // Catch-up: uno o más periodos pueden estar vencidos si la app estuvo
        // cerrada. Cada iteración compone sobre el saldo ya incrementado por
        // la anterior y genera su propia transacción.
        while (true) {
          const corte = addMonthsClamped(cursor, periodMonths);
          if (corte > hoy) break;

          const delta = saldo * tasaPeriodo;
          saldo += delta;

          if (esDeuda && categoriaInteresesId == null) {
            categoriaInteresesId = obtenerOCrearCategoriaIntereses();
          }

          db!
            .insert(transaccion)
            .values({
              nombre: 'Capitalización de interés',
              valorTransaccion: delta,
              tipo: esDeuda ? 'expense' : 'income',
              categoriaId: esDeuda ? categoriaInteresesId : null,
              productoFinancieroId: producto.id,
              descripcion: `Capitalización ${frecuencia} (${corte})`,
              fechaHora: corte,
              usuarioId: producto.usuarioId,
            })
            .run();

          // Ambos tipos SUMAN al montoNeto: en un asset crece el patrimonio, en
          // una deuda crece lo que se debe. Solo cambia el `tipo` de la
          // transacción registrada (income vs expense) para efectos de
          // presupuesto/reportes — por eso no se usa ajustarSaldoProductoInternal,
          // que resta en toda transacción `expense`.
          db!
            .update(productoFinanciero)
            .set({ montoNeto: sql`COALESCE(${productoFinanciero.montoNeto}, 0) + ${delta}` })
            .where(eq(productoFinanciero.id, producto.id))
            .run();

          if (esDeuda) {
            ajustarMontoRealIntereses(delta);
          }

          db!
            .update(productoFinanciero)
            .set({ fechaUltimaCapitalizacion: corte })
            .where(eq(productoFinanciero.id, producto.id))
            .run();

          cursor = corte;
          procesoAlguno = true;
        }
      });

      if (procesoAlguno) {
        huboCambios = true;
        if (esDeuda) huboDeuda = true;
      }
    } catch (e) {
      console.log(`Error procesando capitalización del producto ${producto.id}:`, e);
    }
  }

  if (huboCambios) {
    transactionEvents.emit();
    if (huboDeuda) presupuestoEvents.emit();
  }
}
