import sqlite from '@/db/client';
import { getCurrentUserId } from '@/modules/auth/data/session';
import { registrarTransaccion } from './registrar-transaccion.service';
import type { ExpenseCategory } from '@/modules/shared/finance/categories';

type Frecuencia = 'semanal' | 'mensual';

type PlantillaInput = {
  nombre: string | null;
  valor_transaccion: number;
  tipo: 'income' | 'expense' | 'saving';
  categoria_id: number | null;
  meta_id: number | null;
  producto_financiero_id?: number | null;
  descripcion: string | null;
  frecuencia: Frecuencia;
  dia_ejecucion?: number | null;
};

type RecurrenteRow = {
  id: number;
  nombre: string | null;
  valor_transaccion: number;
  tipo: string;
  categoria_id: number | null;
  meta_id: number | null;
  producto_financiero_id: number | null;
  descripcion: string | null;
  frecuencia: string;
  proxima_fecha: string;
  dia_ejecucion: number | null;
};

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Calcula la próxima fecha de ejecución respetando el día configurado. */
function proximaFecha(frecuencia: Frecuencia, diaEjecucion?: number | null): string {
  const now = new Date();

  if (frecuencia === 'semanal' && diaEjecucion != null) {
    // 0=Dom, 1=Lun, ..., 6=Sáb — igual que Date.getDay()
    const currentDay = now.getDay();
    const daysUntil = ((diaEjecucion - currentDay + 7) % 7) || 7;
    now.setDate(now.getDate() + daysUntil);
    return toISODate(now);
  }

  if (frecuencia === 'mensual' && diaEjecucion != null) {
    const dayTarget = Math.max(1, Math.min(diaEjecucion, 31));
    const candidate = new Date(now.getFullYear(), now.getMonth(), dayTarget);
    if (candidate <= now) {
      candidate.setMonth(candidate.getMonth() + 1);
    }
    // Clamp al último día del mes destino (ej. 31 en febrero → 28/29)
    const lastDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
    candidate.setDate(Math.min(dayTarget, lastDay));
    return toISODate(candidate);
  }

  if (frecuencia === 'semanal') {
    now.setDate(now.getDate() + 7);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return toISODate(now);
}

export function crearPlantillaRecurrente(input: PlantillaInput): void {
  try {
    const usuarioId = getCurrentUserId();
    sqlite.runSync(
      `INSERT INTO transaccion_recurrente
         (nombre, valor_transaccion, tipo, categoria_id, meta_id, producto_financiero_id,
          descripcion, frecuencia, proxima_fecha, dia_ejecucion, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.nombre,
        input.valor_transaccion,
        input.tipo,
        input.categoria_id,
        input.meta_id,
        input.producto_financiero_id ?? null,
        input.descripcion,
        input.frecuencia,
        proximaFecha(input.frecuencia as Frecuencia, input.dia_ejecucion),
        input.dia_ejecucion ?? null,
        usuarioId,
      ]
    );
  } catch (e) {
    console.log('Error crearPlantillaRecurrente:', e);
  }
}

type ProcesarOpts = {
  onPresupuestoGasto: (categoriaId: number, monto: number) => void | Promise<void>;
};

export function procesarRecurrentes(opts: ProcesarOpts): void {
  const today = toISODate(new Date());
  const usuarioId = getCurrentUserId();

  let rows: RecurrenteRow[] = [];
  try {
    rows = sqlite.getAllSync(
      `SELECT * FROM transaccion_recurrente
       WHERE activa = 1
         AND proxima_fecha <= ?
         AND (usuario_id = ? OR usuario_id IS NULL)`,
      [today, usuarioId]
    ) as RecurrenteRow[];
  } catch (e) {
    console.log('Error leyendo recurrentes:', e);
    return;
  }

  for (const row of rows) {
    try {
      registrarTransaccion(
        {
          type: row.tipo as 'income' | 'expense' | 'saving',
          amount: row.valor_transaccion,
          category: null as ExpenseCategory | null,
          description: row.descripcion ?? row.nombre ?? '',
          metaId: row.meta_id ?? undefined,
          productoFinancieroId: row.producto_financiero_id ?? undefined,
        },
        {
          resolveCategoriaId: () => row.categoria_id,
          onPresupuestoGasto: opts.onPresupuestoGasto,
        }
      );

      const siguiente = proximaFecha(row.frecuencia as Frecuencia, row.dia_ejecucion);
      sqlite.runSync(
        'UPDATE transaccion_recurrente SET proxima_fecha = ? WHERE id = ?',
        [siguiente, row.id]
      );
    } catch (e) {
      console.log(`Error procesando recurrente ${row.id}:`, e);
    }
  }
}
