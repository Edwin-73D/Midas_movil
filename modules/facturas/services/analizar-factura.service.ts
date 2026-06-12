import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/modules/shared/ai/gemini.config';
import type { FacturaAnalizada } from '../domain/factura.types';

const PROMPT = `Eres un asistente experto en lectura de facturas, recibos y tiquetes de compra.
Analiza la imagen y extrae toda la información visible. Sé tolerante con texto borroso o parcial — usa tu mejor estimación.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin explicaciones), con esta estructura:
{
  "comercio": "nombre del establecimiento (usa 'Comercio' si no se puede leer)",
  "fecha": "YYYY-MM-DD o null si no hay fecha visible",
  "items": [
    { "nombre": "nombre del producto o servicio", "monto": 12500 }
  ],
  "total": 45000
}

Reglas importantes:
- Los montos son números enteros o decimales, SIN símbolos de moneda ni puntos de miles.
- Si ves un total pero no ítems individuales, crea un único ítem con el nombre del comercio y ese total.
- Si no puedes determinar el total exacto, súmalo a partir de los ítems.
- Nunca devuelvas un array de ítems vacío: si no hay detalle, pon al menos un ítem genérico.
- Responde solo con el JSON, nada más.`;

function extractJson(text: string): string | null {
  // 1. Bloque markdown ```json ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // 2. Primer objeto JSON {...}
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];

  return null;
}

export async function analizarFactura(base64: string): Promise<FacturaAnalizada> {
  if (!GEMINI_API_KEY) throw new Error('API key de Gemini no configurada en .env');

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64,
              },
            },
            { text: PROMPT },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as any)?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Gemini: ${msg}`);
  }

  const data = await response.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text) throw new Error('Gemini no devolvió respuesta');

  const raw = extractJson(text);
  if (!raw) throw new Error(`No se encontró JSON en la respuesta`);

  let parsed: FacturaAnalizada;
  try {
    parsed = JSON.parse(raw) as FacturaAnalizada;
  } catch {
    throw new Error('JSON de Gemini malformado');
  }

  // Normalizar campos faltantes o inválidos
  const comercio = parsed.comercio?.trim() || 'Comercio';
  const total = Number(parsed.total) || 0;
  let items = Array.isArray(parsed.items) ? parsed.items : [];

  items = items
    .map((it) => ({ nombre: String(it.nombre ?? '').trim() || 'Ítem', monto: Number(it.monto) || 0 }))
    .filter((it) => it.monto >= 0);

  if (items.length === 0) {
    items = [{ nombre: comercio, monto: total }];
  }

  const totalFinal = total > 0 ? total : items.reduce((s, it) => s + it.monto, 0);

  return {
    comercio,
    fecha: parsed.fecha && /^\d{4}-\d{2}-\d{2}$/.test(parsed.fecha) ? parsed.fecha : null,
    items,
    total: totalFinal,
  };
}
