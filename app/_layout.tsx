import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { MidasColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
