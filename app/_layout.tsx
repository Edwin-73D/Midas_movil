import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { MidasColors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/modules/auth/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
            headerStyle: { backgroundColor: MidasColors.appBackground },
            headerTintColor: MidasColors.gold,
            headerTitleStyle: { color: MidasColors.textPrimary },
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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppStack />
    </AuthProvider>
  );
}
