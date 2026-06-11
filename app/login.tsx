import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MidasColors } from '@/constants/theme';
import { useAuth } from '@/modules/auth/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  function handleLogin() {
    setError('');
    const result = login(username.trim(), password);
    if (result.error) setError(result.error);
    // Si no hay error, el guard de AuthContext redirige automáticamente a /
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.container}>
          {/* ── Logo / Título ─────────────────────────────────────────── */}
          <View style={styles.logoArea}>
            <Text style={styles.logo}>Midas</Text>
            <Text style={styles.subtitle}>Tu gestor financiero personal</Text>
          </View>

          {/* ── Formulario ────────────────────────────────────────────── */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Iniciar sesión</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Ej. juan123"
                placeholderTextColor={MidasColors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={MidasColors.textSecondary}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonLabel}>Entrar</Text>
            </TouchableOpacity>
          </View>

          {/* ── Link a registro ───────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <Link href={'/register' as any} asChild>
              <Pressable>
                <Text style={styles.footerLink}>Regístrate</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: MidasColors.appBackground,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 32,
  },
  logoArea: {
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    color: MidasColors.gold,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    color: MidasColors.textSecondary,
    fontSize: 14,
  },
  form: {
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  formTitle: {
    color: MidasColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 13,
    backgroundColor: 'rgba(231,76,60,0.1)',
    borderRadius: 8,
    padding: 10,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: MidasColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: MidasColors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  button: {
    backgroundColor: MidasColors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonLabel: {
    color: '#0F0F0F',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: MidasColors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: MidasColors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
});
