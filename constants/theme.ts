/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// ─── Paletas de Midas (HU-09: modo claro / oscuro) ───────────────────────────
// Ambas paletas comparten exactamente las mismas claves para poder alternar
// el tema en caliente. Los colores semánticos (alertas, categorías) se ajustan
// por contraste en cada modo pero mantienen su identidad de color.

export type MidasPalette = {
  appBackground: string;
  cardBackground: string;
  insightBackground: string;
  gold: string;
  textPrimary: string;
  textSecondary: string;
  positive: string;
  needsColor: string;
  wantsColor: string;
  savingsColor: string;
  tabBarBackground: string;
  tabBarInactive: string;
  // Tokens adicionales para sustituir hexes antes hardcodeados.
  border: string;
  inputBackground: string;
  onGold: string;
  danger: string;
  overlay: string;
};

export const MidasColorsDark: MidasPalette = {
  appBackground:     '#0F0F0F',
  cardBackground:    '#1A1A1A',
  insightBackground: '#2A3318',
  gold:              '#C8A84B',
  textPrimary:       '#FFFFFF',
  textSecondary:     '#9BA1A6',
  positive:          '#4CAF50',
  needsColor:        '#F5A623',
  wantsColor:        '#9B59B6',
  savingsColor:      '#4CAF50',
  tabBarBackground:  '#111111',
  tabBarInactive:    '#555555',
  border:            '#2A2A2A',
  inputBackground:   '#2A2A2A',
  onGold:            '#0F0F0F',
  danger:            '#E74C3C',
  overlay:           'rgba(0,0,0,0.65)',
};

export const MidasColorsLight: MidasPalette = {
  appBackground:     '#F4F4F6',
  cardBackground:    '#FFFFFF',
  insightBackground: '#EAF3E0',
  gold:              '#A8862F',
  textPrimary:       '#11181C',
  textSecondary:     '#5A6168',
  positive:          '#2E7D32',
  needsColor:        '#C9760B',
  wantsColor:        '#8E44AD',
  savingsColor:      '#2E7D32',
  tabBarBackground:  '#FFFFFF',
  tabBarInactive:    '#9AA0A6',
  border:            '#E2E2E6',
  inputBackground:   '#EDEDF0',
  onGold:            '#0F0F0F',
  danger:            '#D9382C',
  overlay:           'rgba(0,0,0,0.45)',
};

/**
 * Alias estático del tema oscuro. Se mantiene para los archivos aún no migrados
 * al ThemeContext; los componentes migrados deben usar `useTheme().colors`.
 */
export const MidasColors = MidasColorsDark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
