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

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  function handleRegister() {
    setError('');
    const result = register({ username: username.trim(), email: email.trim(), password });
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
            <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
          </View>

          {/* ── Formulario ────────────────────────────────────────────── */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>{t('register.formTitle')}</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('register.username')}</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder={t('register.usernamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('register.email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('register.emailPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('register.password')}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t('register.passwordPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonLabel}>{t('register.submit')}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Link a login ──────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('register.hasAccount')} </Text>
            <Link href={'/login' as any} asChild>
              <Pressable>
                <Text style={styles.footerLink}>{t('register.signIn')}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.appBackground,
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
      color: c.gold,
      fontSize: 42,
      fontWeight: '700',
      letterSpacing: 1,
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: 14,
    },
    form: {
      backgroundColor: c.cardBackground,
      borderRadius: 20,
      padding: 24,
      gap: 16,
    },
    formTitle: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
    },
    errorText: {
      color: c.danger,
      fontSize: 13,
      backgroundColor: c.danger + '1A',
      borderRadius: 8,
      padding: 10,
    },
    inputGroup: {
      gap: 6,
    },
    label: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: c.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.textPrimary,
      fontSize: 15,
      borderWidth: 1,
      borderColor: c.border,
    },
    button: {
      backgroundColor: c.gold,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 4,
    },
    buttonLabel: {
      color: c.onGold,
      fontSize: 16,
      fontWeight: '700',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      color: c.textSecondary,
      fontSize: 14,
    },
    footerLink: {
      color: c.gold,
      fontSize: 14,
      fontWeight: '600',
    },
  });
