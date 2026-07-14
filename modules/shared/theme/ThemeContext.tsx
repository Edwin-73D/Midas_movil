import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  MidasColorsDark,
  MidasColorsLight,
  type MidasPalette,
} from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

const STORAGE_KEY = '@midas/theme-mode';

type ThemeContextValue = {
  colors: MidasPalette;
  scheme: Scheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Alterna directamente entre claro y oscuro (resuelve 'system' al actual). */
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Cargar preferencia persistida al iniciar.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const scheme: Scheme = mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode;

  const toggle = useCallback(() => {
    setMode(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === 'light' ? MidasColorsLight : MidasColorsDark,
      scheme,
      mode,
      setMode,
      toggle,
    }),
    [scheme, mode, setMode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback seguro si algún componente se renderiza fuera del provider.
    return {
      colors: MidasColorsDark,
      scheme: 'dark',
      mode: 'system',
      setMode: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}

/**
 * Construye estilos dependientes del tema. Recibe una fábrica
 * `(colors) => StyleSheet.create({...})` y la memoiza por paleta activa.
 */
export function useThemedStyles<T>(factory: (colors: MidasPalette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
