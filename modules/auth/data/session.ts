import sqlite from '@/db/client';

/** Lee el usuario activo directamente de SQLite (sin React context). */
export function getCurrentUserId(): number | null {
  try {
    const row = sqlite.getFirstSync(
      'SELECT usuario_id FROM sesion_activa WHERE id = 1'
    ) as { usuario_id: number } | null;
    return row?.usuario_id ?? null;
  } catch {
    return null;
  }
}
