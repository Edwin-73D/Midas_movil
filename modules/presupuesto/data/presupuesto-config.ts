import sqlite from '@/db/client';
import { getCurrentUserId } from '@/modules/auth/data/session';
import type { FrecuenciaPresupuesto } from '@/modules/presupuesto/periodo';

/** Frecuencia del presupuesto del usuario activo ('mensual' | 'quincenal'). */
export function getFrecuenciaPresupuesto(): FrecuenciaPresupuesto {
  const uid = getCurrentUserId();
  if (uid == null) return 'mensual';
  try {
    const row = sqlite.getFirstSync(
      'SELECT frecuencia_presupuesto FROM usuario WHERE id = ?',
      [uid]
    ) as { frecuencia_presupuesto: string | null } | null;
    return (row?.frecuencia_presupuesto as FrecuenciaPresupuesto) ?? 'mensual';
  } catch {
    return 'mensual';
  }
}

export function setFrecuenciaPresupuesto(frecuencia: FrecuenciaPresupuesto): void {
  const uid = getCurrentUserId();
  if (uid == null) return;
  try {
    sqlite.runSync('UPDATE usuario SET frecuencia_presupuesto = ? WHERE id = ?', [frecuencia, uid]);
  } catch (error) {
    console.log('Error guardando frecuencia_presupuesto:', error);
  }
}
