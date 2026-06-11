import sqlite from '@/db/client';
import { registrarTransaccion } from './registrar-transaccion.service';
import type { ExpenseCategory } from '@/modules/shared/finance/categories';

type Frecuencia = 'semanal' | 'mensual';

type PlantillaInput = {
  nombre: string | null;
  valor_transaccion: number;
  tipo: 'income' | 'expense' | 'saving';
  categoria_id: number | null;
  meta_id: number | null;
  descripcion: string | null;
  frecuencia: Frecuencia;
};

type RecurrenteRow = {
  id: number;
  nombre: string | null;
  valor_transaccion: number;
  tipo: string;
  categoria_id: number | null;
  meta_id: number | null;
  descripcion: string | null;
  frecuencia: string;
  proxima_fecha: string;
};

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function proximaFecha(frecuencia: Frecuencia): string {
  const now = new Date();
  if (frecuencia === 'semanal') {
    now.setDate(now.getDate() + 7);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return toISODate(now);
}

export function crearPlantillaRecurrente(input: PlantillaInput): void {
  try {
    sqlite.runSync(
      `INSERT INTO transaccion_recurrente
         (nombre, valor_transaccion, tipo, categoria_id, meta_id, descripcion, frecuencia, proxima_fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.nombre,
        input.valor_transaccion,
        input.tipo,
        input.categoria_id,
        input.meta_id,
        input.descripcion,
        input.frecuencia,
        proximaFecha(input.frecuencia as Frecuencia),
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

  let rows: RecurrenteRow[] = [];
  try {
    rows = sqlite.getAllSync(
      `SELECT * FROM transaccion_recurrente WHERE activa = 1 AND proxima_fecha <= ?`,
      [today]
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
        },
        {
          resolveCategoriaId: () => row.categoria_id,
          onPresupuestoGasto: opts.onPresupuestoGasto,
        }
      );

      const siguiente = proximaFecha(row.frecuencia as Frecuencia);
      sqlite.runSync(
        'UPDATE transaccion_recurrente SET proxima_fecha = ? WHERE id = ?',
        [siguiente, row.id]
      );
    } catch (e) {
      console.log(`Error procesando recurrente ${row.id}:`, e);
    }
  }
}
