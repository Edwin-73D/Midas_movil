import { MidasColorsDark, type MidasPalette } from '@/constants/theme';

/** Color de la barra/insignia de progreso de una meta según su porcentaje. */
export function getProgressColor(pct: number, c: MidasPalette = MidasColorsDark): string {
  if (pct >= 100) return c.positive;
  if (pct >= 60) return c.gold;
  if (pct >= 30) return c.needsColor;
  return c.danger;
}
