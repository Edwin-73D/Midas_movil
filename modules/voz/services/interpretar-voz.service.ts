import * as FileSystem from 'expo-file-system';

import type { FacturaAnalizada } from '@/modules/facturas/domain/factura.types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const hoy = () => new Date().toISOString().slice(0, 10);
const ayer = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const PROMPT = `Eres un asistente experto en finanzas personales. Escucha el audio y extrae todos los gastos que el usuario menciona.

Reglas:
- Si el usuario dice "hoy", usa la fecha ${hoy()}
- Si dice "ayer", usa la fecha ${ayer()}
- Si no menciona fecha, pon null
- Los montos son números (sin símbolo de moneda). Si dice "cuarenta y cinco mil" → 45000
- Nunca devuelvas ítems vacíos. Si no entiendes el monto, ponlo en 0
- El campo "total" debe ser la suma de todos los ítems

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto extra:
{
  "items": [
    { "nombre": "descripción del gasto", "monto": 45000 }
  ],
  "fecha": "YYYY-MM-DD o null",
  "total": 45000
}`;

function extractJson(text: string): string | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) return brace[0];
  return null;
}

export async function interpretarVoz(audioUri: string): Promise<FacturaAnalizada> {
  if (!API_KEY) throw new Error('API key de Gemini no configurada en .env');

  const base64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: 'audio/mp4',
                data: base64,
              },
            },
            { text: PROMPT },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1024,
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
  if (!raw) throw new Error('No se encontró JSON en la respuesta');

  let parsed: { items: { nombre: string; monto: number }[]; fecha: string | null; total: number };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Respuesta de Gemini malformada');
  }

  const items = Array.isArray(parsed.items) ? parsed.items : [];
  const total = Number(parsed.total) || items.reduce((s, it) => s + (Number(it.monto) || 0), 0);

  if (items.length === 0 || total === 0) {
    throw new Error('No se pudo identificar ningún gasto en el audio');
  }

  const cleanItems = items.map((it) => ({
    nombre: String(it.nombre ?? '').trim() || 'Gasto',
    monto: Number(it.monto) || 0,
  }));

  return {
    comercio: cleanItems[0].nombre,
    fecha: parsed.fecha && /^\d{4}-\d{2}-\d{2}$/.test(parsed.fecha) ? parsed.fecha : null,
    items: cleanItems,
    total,
  };
}
