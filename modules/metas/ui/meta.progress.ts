import { MidasColors } from '@/constants/theme';

/** Color de la barra/insignia de progreso de una meta según su porcentaje. */
export function getProgressColor(pct: number): string {
  if (pct >= 100) return MidasColors.positive;
  if (pct >= 60) return MidasColors.gold;
  if (pct >= 30) return MidasColors.needsColor;
  return '#E74C3C';
}
