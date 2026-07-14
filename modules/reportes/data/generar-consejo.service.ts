import sqlite from '@/db/client';
import { getCurrentUserId } from '@/modules/auth/data/session';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/modules/shared/ai/gemini.config';
import {
  MESES,
  type Periodo,
  type ReporteCompleto,
} from '../domain/report.model';
import { getReporteCompleto } from './report.service';

export type ConsejoResult = {
  texto: string | null;
  // Mes al que corresponde el consejo (para el reporte general).
  mes: { anio: number; mes: number } | null;
  hayDatos: boolean;
};

// ─── Hash de los datos relevantes (para regenerar solo cuando cambian) ────────

function calcularHash(r: ReporteCompleto): string {
  return JSON.stringify({
    ing: Math.round(r.resumen.ingresos),
    gas: Math.round(r.resumen.gastos),
    aho: Math.round(r.resumen.ahorros),
    cats: r.gastosCategoria.map((c) => `${c.nombre}:${Math.round(c.total)}`),
    comp: r.comparativa.items.map(
      (c) => `${c.nombre}:${Math.round(c.presupuestado)}/${Math.round(c.gastado)}`
    ),
    metas: r.aportesMetas.map((m) => `${m.nombre}:${Math.round(m.aportePeriodo)}`),
  });
}

// ─── Construcción del prompt ──────────────────────────────────────────────────

function construirPrompt(r: ReporteCompleto, etiquetaMes: string): string {
  const { ingresos, gastos, ahorros, balanceNeto } = r.resumen;

  const topCategorias = r.gastosCategoria
    .slice(0, 3)
    .map((c) => `${c.nombre} ($${Math.round(c.total)}, ${c.porcentaje.toFixed(0)}%)`)
    .join(', ');

  const excesos = r.comparativa.items
    .filter((c) => c.diferencia < 0)
    .map((c) => `${c.nombre} (excedido $${Math.round(Math.abs(c.diferencia))})`)
    .join(', ');

  const metas = r.aportesMetas
    .map((m) => `${m.nombre} (aporte $${Math.round(m.aportePeriodo)}, ${m.progresoTotal.toFixed(0)}% del total)`)
    .join(', ');

  return `Eres un asesor financiero personal cercano y amable. Con base en estos datos del mes de ${etiquetaMes}, redacta UN párrafo de 3 a 4 oraciones (máximo 100 palabras) con un consejo financiero útil y práctico, en español, en tono positivo y motivador. Menciona una fortaleza observada en los datos y sugiere una acción concreta y específica para mejorar. No uses listas ni markdown, responde solo con el párrafo en texto plano.

Datos del mes:
- Ingresos: $${Math.round(ingresos)}
- Gastos: $${Math.round(gastos)}
- Ahorros: $${Math.round(ahorros)}
- Balance neto: $${Math.round(balanceNeto)}
- Categorías con mayor gasto: ${topCategorias || 'sin gastos registrados'}
- Categorías excedidas del presupuesto: ${excesos || 'ninguna'}
- Aportes a metas: ${metas || 'sin aportes a metas'}`;
}

// ─── Llamada a Gemini (texto plano) ───────────────────────────────────────────

async function generarConsejoIA(r: ReporteCompleto, etiquetaMes: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: construirPrompt(r, etiquetaMes) }] }],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const limpio = text.replace(/\s+/g, ' ').trim();
    return limpio || null;
  } catch {
    return null;
  }
}

// ─── Caché por usuario/mes ────────────────────────────────────────────────────

type ConsejoRow = { texto: string; datos_hash: string | null };

async function getConsejoMensual(
  anio: number,
  mes: number,
  reporte: ReporteCompleto
): Promise<string | null> {
  const uid = getCurrentUserId();
  const hash = calcularHash(reporte);

  let cached: ConsejoRow | null = null;
  try {
    cached = sqlite.getFirstSync(
      `SELECT texto, datos_hash FROM consejo_financiero
       WHERE usuario_id IS ? AND anio = ? AND mes = ?`,
      [uid, anio, mes]
    ) as ConsejoRow | null;
  } catch (e) {
    console.log('Error leyendo consejo cacheado:', e);
  }

  // Hit de caché: los datos no cambiaron.
  if (cached && cached.datos_hash === hash) return cached.texto;

  const etiquetaMes = `${MESES[mes - 1]} ${anio}`;
  const texto = await generarConsejoIA(reporte, etiquetaMes);

  // Si la IA falla pero había un consejo previo, se conserva el anterior.
  if (!texto) return cached?.texto ?? null;

  try {
    if (cached) {
      sqlite.runSync(
        `UPDATE consejo_financiero SET texto = ?, datos_hash = ?, updated_at = CURRENT_TIMESTAMP
         WHERE usuario_id IS ? AND anio = ? AND mes = ?`,
        [texto, hash, uid, anio, mes]
      );
    } else {
      sqlite.runSync(
        `INSERT INTO consejo_financiero (usuario_id, anio, mes, texto, datos_hash)
         VALUES (?, ?, ?, ?, ?)`,
        [uid, anio, mes, texto, hash]
      );
    }
  } catch (e) {
    console.log('Error guardando consejo:', e);
  }

  return texto;
}

/** Último mes (año/mes) con transacciones del usuario activo. */
function getUltimoMesConDatos(): { anio: number; mes: number } | null {
  const uid = getCurrentUserId();
  try {
    const row = sqlite.getFirstSync(
      `SELECT strftime('%Y', fecha_hora) AS y, strftime('%m', fecha_hora) AS m
       FROM transaccion
       WHERE (usuario_id = ? OR usuario_id IS NULL)
       ORDER BY fecha_hora DESC LIMIT 1`,
      [uid]
    ) as { y: string; m: string } | null;
    if (!row?.y || !row?.m) return null;
    return { anio: parseInt(row.y, 10), mes: parseInt(row.m, 10) };
  } catch (e) {
    console.log('Error getUltimoMesConDatos:', e);
    return null;
  }
}

/**
 * HU-07: obtiene el consejo financiero para el período.
 * - Reporte mensual: consejo del mes seleccionado (cacheado).
 * - Reporte general: consejo del último mes con datos disponibles.
 */
export async function obtenerConsejo(
  periodo: Periodo,
  reporte: ReporteCompleto
): Promise<ConsejoResult> {
  if (periodo.tipo === 'mes') {
    if (!reporte.resumen.hayDatos) {
      return { texto: null, mes: { anio: periodo.anio, mes: periodo.mes }, hayDatos: false };
    }
    const texto = await getConsejoMensual(periodo.anio, periodo.mes, reporte);
    return { texto, mes: { anio: periodo.anio, mes: periodo.mes }, hayDatos: true };
  }

  // General: usar el último mes con datos.
  const ultimo = getUltimoMesConDatos();
  if (!ultimo) return { texto: null, mes: null, hayDatos: false };

  const reporteMes = getReporteCompleto({ tipo: 'mes', anio: ultimo.anio, mes: ultimo.mes });
  const texto = await getConsejoMensual(ultimo.anio, ultimo.mes, reporteMes);
  return { texto, mes: ultimo, hayDatos: true };
}
