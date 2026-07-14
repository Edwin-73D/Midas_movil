import { Audio } from 'expo-av';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import { FacturaDecisionModal } from '@/modules/facturas/components/FacturaDecisionModal';
import { FacturaMultipleModal } from '@/modules/facturas/components/FacturaMultipleModal';
import { FacturaSingleModal } from '@/modules/facturas/components/FacturaSingleModal';
import type { FacturaAnalizada } from '@/modules/facturas/domain/factura.types';
import { usePresupuestoViewModel } from '@/modules/presupuesto/PresupuestoViewModel';
import { interpretarVoz } from '@/modules/voz/services/interpretar-voz.service';

type FlowState = 'idle' | 'recording' | 'interpreting' | 'error' | 'decision' | 'single' | 'multiple';

export default function VozRecorderScreen() {
  const insets = useSafeAreaInsets();
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [gastos, setGastos] = useState<FacturaAnalizada | null>(null);
  const [lastUri, setLastUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isStartingRef = useRef(false);
  const shouldCancelRef = useRef(false);
  const rippleAnim = useRef(new Animated.Value(1)).current;
  const { agregarGasto, categorias } = usePresupuestoViewModel();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const animateRipple = useCallback(
    (metering: number) => {
      const normalized = Math.max(0, Math.min(1, (metering + 160) / 160));
      Animated.spring(rippleAnim, {
        toValue: 1 + normalized * 0.65,
        useNativeDriver: true,
        friction: 5,
      }).start();
    },
    [rippleAnim]
  );

  async function startRecording() {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    shouldCancelRef.current = false;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de micrófono denegado. Habilítalo en Ajustes del dispositivo.');
        setFlowState('error');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording && status.metering != null) {
            animateRipple(status.metering);
          }
        },
        100
      );

      // Si el usuario soltó antes de que terminara el setup, cancelar
      if (shouldCancelRef.current) {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        setFlowState('idle');
        return;
      }

      recordingRef.current = recording;
      setFlowState('recording');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al iniciar grabación');
      setFlowState('error');
    } finally {
      isStartingRef.current = false;
    }
  }

  async function stopAndAnalyze() {
    // Si el inicio aún está en vuelo, marcar para cancelar cuando termine
    if (isStartingRef.current) {
      shouldCancelRef.current = true;
      return;
    }

    const recording = recordingRef.current;
    if (!recording) return;

    // Limpiar la ref antes del try para que quede null en cualquier rama de error
    recordingRef.current = null;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (!uri) throw new Error('No se pudo obtener el audio grabado');

      setLastUri(uri);
      rippleAnim.setValue(1);
      await analizarAudio(uri);
    } catch (e) {
      try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); } catch {}
      setErrorMsg(e instanceof Error ? e.message : 'Error al detener grabación');
      setFlowState('error');
    }
  }

  async function analizarAudio(uri: string) {
    setFlowState('interpreting');
    try {
      const result = await interpretarVoz(uri);
      setGastos(result);
      setFlowState(result.items.length >= 2 ? 'decision' : 'single');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No se pudo interpretar el audio');
      setFlowState('error');
    }
  }

  function handleGuardar() {
    router.back();
  }

  const isRecording = flowState === 'recording';
  const isInterpreting = flowState === 'interpreting';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Botón cerrar */}
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>

      {/* Contenido principal */}
      {(flowState === 'idle' || isRecording || isInterpreting) && (
        <View style={styles.center}>
          <Text style={styles.title}>
            {isRecording ? t('voice.listening') : isInterpreting ? '' : t('voice.title')}
          </Text>

          {!isInterpreting && (
            <Text style={styles.subtitle}>
              {isRecording ? t('voice.releaseToProcess') : t('voice.holdMic')}
            </Text>
          )}

          {isInterpreting ? (
            <View style={styles.interpretingBox}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={styles.interpretingText}>{t('voice.interpreting')}</Text>
            </View>
          ) : (
            <View style={styles.micWrapper}>
              {/* Ripple circles */}
              {isRecording && (
                <>
                  <Animated.View
                    style={[
                      styles.ripple,
                      styles.ripple3,
                      { transform: [{ scale: Animated.multiply(rippleAnim, 1.4) }] },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.ripple,
                      styles.ripple2,
                      { transform: [{ scale: Animated.multiply(rippleAnim, 1.2) }] },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.ripple,
                      styles.ripple1,
                      { transform: [{ scale: rippleAnim }] },
                    ]}
                  />
                </>
              )}

              {/* Micrófono push-to-talk */}
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micButtonActive]}
                onPressIn={startRecording}
                onPressOut={stopAndAnalyze}
                activeOpacity={0.85}
                disabled={isInterpreting}
              >
                <Text style={styles.micIcon}>🎤</Text>
              </TouchableOpacity>
            </View>
          )}

          {isRecording && (
            <View style={styles.recordingDot}>
              <View style={styles.redDot} />
              <Text style={styles.recordingText}>{t('voice.recording')}</Text>
            </View>
          )}

          {!isRecording && !isInterpreting && (
            <View style={styles.examples}>
              <Text style={styles.examplesTitle}>{t('voice.examplesTitle')}</Text>
              <Text style={styles.exampleText}>"Gasté cuarenta y cinco mil en almuerzo"</Text>
              <Text style={styles.exampleText}>"Taxi a la oficina, doce mil, ayer"</Text>
              <Text style={styles.exampleText}>"Pagué cien mil de arriendo hoy"</Text>
            </View>
          )}
        </View>
      )}

      {/* Error */}
      {flowState === 'error' && (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>{t('voice.errorTitle')}</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              if (lastUri) analizarAudio(lastUri);
              else setFlowState('idle');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.btnLabel}>
              {lastUri ? t('voice.retryAnalysis') : t('voice.tryAgain')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={() => { setLastUri(null); setFlowState('idle'); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnLabel, { color: colors.gold }]}>{t('voice.recordAgain')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.manualLink}>{t('voice.manual')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modales reutilizados del flujo de facturas */}
      {gastos && (
        <>
          <FacturaDecisionModal
            visible={flowState === 'decision'}
            onSingle={() => setFlowState('single')}
            onMultiple={() => setFlowState('multiple')}
            onClose={() => setFlowState('idle')}
          />
          <FacturaSingleModal
            visible={flowState === 'single'}
            factura={gastos}
            categorias={(categorias as { ID: number; nombre: string; clave?: string | null }[]).filter(c => c.clave !== 'ahorros')}
            onClose={() => setFlowState('idle')}
            onGuardar={handleGuardar}
            agregarGasto={agregarGasto}
          />
          <FacturaMultipleModal
            visible={flowState === 'multiple'}
            factura={gastos}
            categorias={(categorias as { ID: number; nombre: string; clave?: string | null }[]).filter(c => c.clave !== 'ahorros')}
            onClose={() => setFlowState('idle')}
            onGuardar={handleGuardar}
            agregarGasto={agregarGasto}
          />
        </>
      )}
    </View>
  );
}

const MIC_SIZE = 96;
const RIPPLE_BASE = MIC_SIZE + 24;

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    closeButton: {
      position: 'absolute',
      top: 52,
      left: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    closeText: {
      color: c.textPrimary,
      fontSize: 26,
      lineHeight: 28,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      gap: 20,
    },
    title: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
    },
    micWrapper: {
      width: RIPPLE_BASE * 1.6,
      height: RIPPLE_BASE * 1.6,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 16,
    },
    ripple: {
      position: 'absolute',
      width: RIPPLE_BASE,
      height: RIPPLE_BASE,
      borderRadius: RIPPLE_BASE / 2,
    },
    ripple1: { backgroundColor: c.gold + '33' },
    ripple2: { backgroundColor: c.gold + '22' },
    ripple3: { backgroundColor: c.gold + '11' },
    micButton: {
      width: MIC_SIZE,
      height: MIC_SIZE,
      borderRadius: MIC_SIZE / 2,
      backgroundColor: c.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    micButtonActive: {
      backgroundColor: c.gold,
      shadowColor: c.gold,
      shadowOpacity: 0.5,
      elevation: 10,
    },
    micIcon: {
      fontSize: 40,
    },
    recordingDot: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    redDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.danger,
    },
    recordingText: {
      color: c.danger,
      fontSize: 15,
      fontWeight: '600',
    },
    interpretingBox: {
      alignItems: 'center',
      gap: 16,
      marginVertical: 24,
    },
    interpretingText: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    examples: {
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },
    examplesTitle: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    exampleText: {
      color: c.textSecondary,
      fontSize: 13,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    errorTitle: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
    },
    errorMsg: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
    },
    btn: {
      backgroundColor: c.gold,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 32,
      alignItems: 'center',
      width: '100%',
    },
    btnOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: c.gold,
    },
    btnLabel: {
      color: c.onGold,
      fontSize: 15,
      fontWeight: '700',
    },
    manualLink: {
      color: c.textSecondary,
      fontSize: 14,
      textDecorationLine: 'underline',
      marginTop: 4,
    },
  });
