import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

import {
  etiquetaPeriodo,
  MESES,
  type Periodo,
  type ReporteCompleto,
} from '../domain/report.model';

type FileLike = { exists: boolean; delete(): void; copy(dest: unknown): void; uri: string };

function fmt(value: number): string {
  return `$ ${Math.round(value).toLocaleString('es-CO')}`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function nombreArchivo(p: Periodo): string {
  if (p.tipo === 'general') return 'reporte_general.pdf';
  return `reporte_${MESES[p.mes - 1].toLowerCase()}_${p.anio}.pdf`;
}

function buildHtml(r: ReporteCompleto, p: Periodo): string {
  const { resumen, gastosCategoria, comparativa, aportesMetas, productos } = r;

  const filaResumen = (label: string, valor: number, color: string) =>
    `<div class="cell"><span class="lbl">${label}</span><span class="val" style="color:${color}">${fmt(valor)}</span></div>`;

  const seccionResumen = resumen.hayDatos
    ? `<div class="grid">
         ${filaResumen('Ingresos', resumen.ingresos, '#2e7d32')}
         ${filaResumen('Gastos', resumen.gastos, '#c62828')}
         ${filaResumen('Ahorros', resumen.ahorros, '#b8860b')}
         ${filaResumen('Balance neto', resumen.balanceNeto, resumen.balanceNeto >= 0 ? '#2e7d32' : '#c62828')}
       </div>`
    : `<p class="empty">Sin datos en este período.</p>`;

  const seccionCategorias = gastosCategoria.length
    ? gastosCategoria
        .map(
          (g) => `
        <div class="bar-row">
          <div class="bar-head"><span>${esc(g.nombre)}</span><span>${fmt(g.total)} · ${g.porcentaje.toFixed(1)}%</span></div>
          <div class="bar-bg"><div class="bar-fill" style="width:${Math.max(g.porcentaje, 2)}%"></div></div>
        </div>`
        )
        .join('')
    : `<p class="empty">Sin gastos en el período.</p>`;

  const seccionComparativa = comparativa.tienePresupuesto
    ? comparativa.items
        .map((c) => {
          const excedido = c.diferencia < 0;
          const color = excedido ? '#c62828' : '#2e7d32';
          const txt = excedido
            ? `Excedido ${fmt(Math.abs(c.diferencia))}`
            : `Sobrante ${fmt(c.diferencia)}`;
          return `<div class="line"><b>${esc(c.nombre)}</b> — Presupuestado ${fmt(c.presupuestado)}, Gastado ${fmt(c.gastado)} <span style="color:${color}">(${txt})</span></div>`;
        })
        .join('')
    : `<p class="empty">Sin presupuesto configurado.</p>`;

  const seccionMetas = aportesMetas.length
    ? aportesMetas
        .map(
          (a) =>
            `<div class="line"><b>${esc(a.nombre)}</b> — Aporte ${fmt(a.aportePeriodo)} · ${a.progresoTotal.toFixed(0)}% del objetivo</div>`
        )
        .join('')
    : '';

  const seccionProductos = productos.length
    ? productos
        .map(
          (pr) =>
            `<div class="line"><b>${esc(pr.nombre)}</b> — Saldo ${fmt(pr.saldo)}, Aportado ${fmt(pr.aportadoPeriodo)}, Interés est. ${fmt(pr.interesEstimado)}${pr.sinTasa ? ' (sin tasa)' : ''}</div>`
        )
        .join('')
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  * { font-family: -apple-system, Roboto, Arial, sans-serif; }
  body { padding: 24px; color: #1a1a1a; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #777; font-size: 13px; margin-bottom: 20px; }
  h2 { font-size: 15px; border-bottom: 2px solid #C8A84B; padding-bottom: 4px; margin: 22px 0 10px; }
  .grid { display: flex; flex-wrap: wrap; gap: 12px; }
  .cell { flex: 1 1 40%; background: #f5f5f5; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; }
  .lbl { color: #777; font-size: 12px; }
  .val { font-size: 18px; font-weight: 700; }
  .bar-row { margin-bottom: 10px; }
  .bar-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px; }
  .bar-bg { background: #eee; border-radius: 4px; height: 8px; overflow: hidden; }
  .bar-fill { background: #C8A84B; height: 8px; }
  .line { font-size: 13px; padding: 5px 0; border-bottom: 1px solid #eee; }
  .empty { color: #999; font-size: 13px; font-style: italic; }
</style></head>
<body>
  <h1>Reporte financiero</h1>
  <div class="sub">${etiquetaPeriodo(p)} · Generado el ${new Date().toLocaleDateString('es-CO')}</div>

  <h2>Resumen</h2>
  ${seccionResumen}

  <h2>Gastos por categoría</h2>
  ${seccionCategorias}

  <h2>Presupuesto vs real</h2>
  ${seccionComparativa}

  ${seccionMetas ? `<h2>Aportes a metas</h2>${seccionMetas}` : ''}
  ${seccionProductos ? `<h2>Productos financieros</h2>${seccionProductos}` : ''}
</body></html>`;
}

/** Genera el PDF del reporte, lo nombra y abre el diálogo de compartir. */
export async function exportarReportePDF(
  reporte: ReporteCompleto,
  periodo: Periodo
): Promise<void> {
  try {
    const html = buildHtml(reporte, periodo);
    const { uri } = await Print.printToFileAsync({ html });

    // Renombrar al formato pedido (best-effort: si falla, se comparte el original).
    // Cast por un desfase de tipos en expo-file-system; la API existe en runtime.
    let fileUri = uri;
    try {
      const dest = new File(Paths.cache, nombreArchivo(periodo)) as unknown as FileLike;
      if (dest.exists) dest.delete();
      (new File(uri) as unknown as FileLike).copy(dest);
      fileUri = dest.uri;
    } catch {
      // se mantiene el uri original
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir reporte',
        UTI: 'com.adobe.pdf',
      });
      Alert.alert('Reporte generado', 'El PDF se generó correctamente.');
    } else {
      Alert.alert('Reporte generado', `PDF guardado en:\n${fileUri}`);
    }
  } catch (e) {
    Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo generar el PDF.');
  }
}
