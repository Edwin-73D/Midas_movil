import sqlite from '@/db/client';
import { getCurrentUserId } from '@/modules/auth/data/session';
import { calcPorcentajeActual } from '@/modules/metas/domain/meta.utils';
import { getProductosSync } from '@/modules/productos/data/producto.service';
import {
  MESES_CORTO,
  type AporteMeta,
  type ComparativaPresupuesto,
  type GastoCategoria,
  type Periodo,
  type ProductoReporte,
  type ReporteCompleto,
  type ResumenFinanciero,
  type Tendencia,
} from '../domain/report.model';

/** Cláusula de fecha para el período, aplicada a una columna concreta. */
function fechaClause(p: Periodo, col: string): { clause: string; params: any[] } {
  if (p.tipo === 'mes') {
    const ym = `${p.anio}-${String(p.mes).padStart(2, '0')}`;
    return { clause: ` AND strftime('%Y-%m', ${col}) = ?`, params: [ym] };
  }
  return { clause: '', params: [] };
}

// ─── HU-R01: Resumen financiero ──────────────────────────────────────────────

export function getResumenFinanciero(p: Periodo): ResumenFinanciero {
  const uid = getCurrentUserId();
  const f = fechaClause(p, 'fecha_hora');
  try {
    const row = sqlite.getFirstSync(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo = 'income'  THEN valor_transaccion ELSE 0 END), 0) AS ingresos,
         COALESCE(SUM(CASE WHEN tipo = 'expense' THEN valor_transaccion ELSE 0 END), 0) AS gastos,
         COALESCE(SUM(CASE WHEN tipo = 'saving'  THEN valor_transaccion ELSE 0 END), 0) AS ahorros,
         COUNT(*) AS n
       FROM transaccion
       WHERE (usuario_id = ? OR usuario_id IS NULL)${f.clause}`,
      [uid, ...f.params]
    ) as { ingresos: number; gastos: number; ahorros: number; n: number } | null;

    const ingresos = row?.ingresos ?? 0;
    const gastos = row?.gastos ?? 0;
    const ahorros = row?.ahorros ?? 0;
    return {
      ingresos,
      gastos,
      ahorros,
      balanceNeto: ingresos - gastos - ahorros,
      hayDatos: (row?.n ?? 0) > 0,
    };
  } catch (e) {
    console.log('Error getResumenFinanciero:', e);
    return { ingresos: 0, gastos: 0, ahorros: 0, balanceNeto: 0, hayDatos: false };
  }
}

// ─── HU-R03 / HU-R06: Gastos por categoría ───────────────────────────────────

export function getGastosPorCategoria(p: Periodo): GastoCategoria[] {
  const uid = getCurrentUserId();
  const f = fechaClause(p, 't.fecha_hora');
  try {
    const rows = sqlite.getAllSync(
      `SELECT c.nombre AS nombre, COALESCE(SUM(t.valor_transaccion), 0) AS total
       FROM transaccion t
       JOIN Categoria c ON t.categoria_id = c.ID
       WHERE t.tipo = 'expense'
         AND (t.usuario_id = ? OR t.usuario_id IS NULL)${f.clause}
       GROUP BY t.categoria_id, c.nombre
       ORDER BY total DESC`,
      [uid, ...f.params]
    ) as { nombre: string; total: number }[];

    const suma = rows.reduce((acc, r) => acc + r.total, 0);
    return rows.map((r) => ({
      nombre: r.nombre,
      total: r.total,
      porcentaje: suma > 0 ? (r.total / suma) * 100 : 0,
    }));
  } catch (e) {
    console.log('Error getGastosPorCategoria:', e);
    return [];
  }
}

// ─── HU-R04: Comparativa presupuesto vs real ─────────────────────────────────

export function getComparativaPresupuesto(p: Periodo): ComparativaPresupuesto {
  const uid = getCurrentUserId();
  const f = fechaClause(p, 't.fecha_hora');
  try {
    const rows = sqlite.getAllSync(
      `SELECT
         c.nombre AS nombre,
         c.monto_esperado AS presupuestado,
         COALESCE((
           SELECT SUM(t.valor_transaccion) FROM transaccion t
           WHERE t.categoria_id = c.ID AND t.tipo = 'expense'
             AND (t.usuario_id = ? OR t.usuario_id IS NULL)${f.clause}
         ), 0) AS gastado
       FROM Categoria c
       WHERE (c.usuario_id = ? OR c.usuario_id IS NULL) AND c.monto_esperado > 0
       ORDER BY c.nombre`,
      [uid, ...f.params, uid]
    ) as { nombre: string; presupuestado: number; gastado: number }[];

    return {
      tienePresupuesto: rows.length > 0,
      items: rows.map((r) => ({
        nombre: r.nombre,
        presupuestado: r.presupuestado,
        gastado: r.gastado,
        diferencia: r.presupuestado - r.gastado,
      })),
    };
  } catch (e) {
    console.log('Error getComparativaPresupuesto:', e);
    return { items: [], tienePresupuesto: false };
  }
}

// ─── HU-R05: Tendencia últimos 6 meses ───────────────────────────────────────

export function getTendencia6Meses(): Tendencia {
  const uid = getCurrentUserId();

  // Genera los 6 meses esperados (incluido el actual), del más antiguo al actual.
  const now = new Date();
  const ymList: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    ymList.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  try {
    const rows = sqlite.getAllSync(
      `SELECT strftime('%Y-%m', fecha_hora) AS ym,
         COALESCE(SUM(CASE WHEN tipo = 'income'  THEN valor_transaccion ELSE 0 END), 0) AS ingresos,
         COALESCE(SUM(CASE WHEN tipo = 'expense' THEN valor_transaccion ELSE 0 END), 0) AS gastos
       FROM transaccion
       WHERE (usuario_id = ? OR usuario_id IS NULL)
         AND strftime('%Y-%m', fecha_hora) >= ?
       GROUP BY ym`,
      [uid, ymList[0]]
    ) as { ym: string; ingresos: number; gastos: number }[];

    const byYm = new Map(rows.map((r) => [r.ym, r]));
    let mesesConDatos = 0;
    const puntos = ymList.map((ym) => {
      const r = byYm.get(ym);
      const ingresos = r?.ingresos ?? 0;
      const gastos = r?.gastos ?? 0;
      if (ingresos > 0 || gastos > 0) mesesConDatos++;
      return {
        ym,
        label: MESES_CORTO[parseInt(ym.slice(5, 7), 10) - 1],
        ingresos,
        gastos,
      };
    });

    return { puntos, mesesConDatos };
  } catch (e) {
    console.log('Error getTendencia6Meses:', e);
    return { puntos: [], mesesConDatos: 0 };
  }
}

// ─── HU-R07: Aportes a metas en el período ───────────────────────────────────

export function getAportesMetas(p: Periodo): AporteMeta[] {
  const uid = getCurrentUserId();
  const f = fechaClause(p, 'a.fecha_hora');
  try {
    const rows = sqlite.getAllSync(
      `SELECT m.nombre AS nombre, m.monto AS monto, m.meta_total AS metaTotal,
         COALESCE(SUM(a.monto), 0) AS aportePeriodo
       FROM meta_aporte a
       JOIN Meta m ON a.meta_id = m.ID
       WHERE (m.usuario_id = ? OR m.usuario_id IS NULL)${f.clause}
       GROUP BY a.meta_id, m.nombre, m.monto, m.meta_total
       HAVING aportePeriodo > 0
       ORDER BY aportePeriodo DESC`,
      [uid, ...f.params]
    ) as { nombre: string; monto: number; metaTotal: number; aportePeriodo: number }[];

    return rows.map((r) => ({
      nombre: r.nombre,
      aportePeriodo: r.aportePeriodo,
      progresoTotal: calcPorcentajeActual(r.monto ?? 0, r.metaTotal ?? 0),
    }));
  } catch (e) {
    console.log('Error getAportesMetas:', e);
    return [];
  }
}

// ─── HU-R08: Productos financieros en el período ─────────────────────────────

export function getProductosReporte(p: Periodo): ProductoReporte[] {
  const uid = getCurrentUserId();
  const f = fechaClause(p, 'fecha_hora');
  try {
    const productos = getProductosSync();
    const result: ProductoReporte[] = [];

    for (const prod of productos) {
      if (prod.id == null) continue;
      const row = sqlite.getFirstSync(
        `SELECT COALESCE(SUM(valor_transaccion), 0) AS total
         FROM transaccion
         WHERE producto_financiero_id = ? AND tipo = 'saving'
           AND (usuario_id = ? OR usuario_id IS NULL)${f.clause}`,
        [prod.id, uid, ...f.params]
      ) as { total: number } | null;

      const aportadoPeriodo = row?.total ?? 0;
      // En "mes" solo se muestran productos con movimientos; en "general", todos.
      if (p.tipo === 'mes' && aportadoPeriodo <= 0) continue;

      const saldo = prod.montoNeto ?? 0;
      const tasa = prod.interes ?? 0;
      const sinTasa = !(tasa > 0);
      // Estimación simple: 'interes' se interpreta como % anual.
      const interesEstimado = sinTasa
        ? 0
        : p.tipo === 'mes'
          ? (saldo * (tasa / 100)) / 12
          : saldo * (tasa / 100);

      result.push({
        nombre: prod.nombre,
        saldo,
        aportadoPeriodo,
        interesEstimado,
        sinTasa,
      });
    }

    return result;
  } catch (e) {
    console.log('Error getProductosReporte:', e);
    return [];
  }
}

// ─── Agregado: reporte completo del período ──────────────────────────────────

export function getReporteCompleto(p: Periodo): ReporteCompleto {
  return {
    resumen: getResumenFinanciero(p),
    gastosCategoria: getGastosPorCategoria(p),
    comparativa: getComparativaPresupuesto(p),
    tendencia: getTendencia6Meses(),
    aportesMetas: getAportesMetas(p),
    productos: getProductosReporte(p),
  };
}
