import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import '@/modules/shared/i18n/i18n';
import { AuthProvider, useAuth } from '@/modules/auth/context/AuthContext';
import { ThemeProvider, useTheme } from '@/modules/shared/theme/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Guard de rutas. Difiere la navegación un tick para que NavigationContainer
 *  haya llamado onReady antes de que intentemos redirigir. */
function AuthGuard() {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const inAuthScreen =
        (segments[0] as string) === 'login' || (segments[0] as string) === 'register';
      if (!user && !inAuthScreen) {
        router.replace('/login' as any);
      } else if (user && inAuthScreen) {
        router.replace('/');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [user, segments]);

  return null;
}

function AppStack() {
  const { colors, scheme } = useTheme();

  return (
    <NavThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="transaction-history"
          options={{
            title: 'Historial de Transacciones',
            headerStyle: { backgroundColor: colors.appBackground },
            headerTintColor: colors.gold,
            headerTitleStyle: { color: colors.textPrimary },
          }}
        />
        <Stack.Screen
          name="factura-scanner"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="voz-recorder"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack>
      <AuthGuard />
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppStack />
      </ThemeProvider>
    </AuthProvider>
  );
}
