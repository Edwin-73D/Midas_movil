// Configuración compartida de la API de Google Gemini.
// Cambiar el modelo aquí afecta a todos los servicios de IA (voz, facturas).

export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
