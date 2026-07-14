import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { analizarFactura } from '@/modules/facturas/services/analizar-factura.service';
import { usePresupuestoViewModel } from '@/modules/presupuesto/PresupuestoViewModel';

type FlowState = 'camera' | 'loading' | 'error' | 'decision' | 'single' | 'multiple';

export default function FacturaScannerScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [flowState, setFlowState] = useState<FlowState>('camera');
  const [factura, setFactura] = useState<FacturaAnalizada | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastBase64, setLastBase64] = useState<string | null>(null);
  const { agregarGasto, categorias } = usePresupuestoViewModel();

  async function analizarImagen(base64: string) {
    setFlowState('loading');
    try {
      const result = await analizarFactura(base64);
      setFactura(result);
      setFlowState(result.items.length >= 2 ? 'decision' : 'single');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setErrorMsg(msg);
      setFlowState('error');
    }
  }

  async function handleCapture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.92 });
      const base64 = photo?.base64;
      if (!base64) { setErrorMsg('No se pudo leer la imagen'); setFlowState('error'); return; }
      setLastBase64(base64);
      await analizarImagen(base64);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al capturar');
      setFlowState('error');
    }
  }

  function handleReintentar() {
    if (lastBase64) {
      analizarImagen(lastBase64);
    } else {
      setFlowState('camera');
    }
  }

  function handleGuardar() {
    router.back();
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.permissionText}>{t('scanner.permission')}</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonLabel}>{t('scanner.grantPermission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cámara */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Overlay de guía */}
      {flowState === 'camera' && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Botón cerrar */}
          <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + 12 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {/* Área oscura arriba */}
          <View style={styles.dimTop} />

          {/* Fila central: oscuro | recuadro | oscuro */}
          <View style={styles.middleRow}>
            <View style={styles.dimSide} />
            <View style={styles.frameBox}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <Text style={styles.frameLabel}>{t('scanner.frameLabel')}</Text>
            </View>
            <View style={styles.dimSide} />
          </View>

          {/* Área oscura abajo + botón captura */}
          <View style={styles.dimBottom}>
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture} activeOpacity={0.85}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loading */}
      {flowState === 'loading' && (
        <View style={[StyleSheet.absoluteFill, styles.centered, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>{t('scanner.loading')}</Text>
        </View>
      )}

      {/* Error */}
      {flowState === 'error' && (
        <View style={[StyleSheet.absoluteFill, styles.centered, styles.loadingOverlay]}>
          <Text style={styles.errorTitle}>{t('scanner.errorTitle')}</Text>
          <Text style={styles.errorText}>
            {errorMsg || 'Intenta con mejor iluminación o ingresa el gasto manualmente.'}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={handleReintentar}
            activeOpacity={0.8}
          >
            <Text style={styles.errorButtonLabel}>
              {lastBase64 ? t('scanner.retryAnalysis') : t('scanner.retryPhoto')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.errorButton, styles.errorButtonOutline]}
            onPress={() => { setLastBase64(null); setFlowState('camera'); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.errorButtonLabel, { color: colors.gold }]}>
              {t('scanner.takeAnother')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.manualLink}>{t('scanner.manual')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modales del flujo */}
      {factura && (
        <>
          <FacturaDecisionModal
            visible={flowState === 'decision'}
            onSingle={() => setFlowState('single')}
            onMultiple={() => setFlowState('multiple')}
            onClose={() => setFlowState('camera')}
          />
          <FacturaSingleModal
            visible={flowState === 'single'}
            factura={factura}
            categorias={(categorias as { ID: number; nombre: string; clave?: string | null }[]).filter(c => c.clave !== 'ahorros')}
            onClose={() => setFlowState('camera')}
            onGuardar={handleGuardar}
            agregarGasto={agregarGasto}
          />
          <FacturaMultipleModal
            visible={flowState === 'multiple'}
            factura={factura}
            categorias={(categorias as { ID: number; nombre: string; clave?: string | null }[]).filter(c => c.clave !== 'ahorros')}
            onClose={() => setFlowState('camera')}
            onGuardar={handleGuardar}
            agregarGasto={agregarGasto}
          />
        </>
      )}
    </View>
  );
}

const DIM = 'rgba(0,0,0,0.62)';
const FRAME_W = 280;
const FRAME_H = 380;
const CORNER = 24;
const BORDER = 3;

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      position: 'absolute',
      left: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    closeButtonText: {
      color: '#fff',
      fontSize: 28,
      lineHeight: 30,
    },
    dimTop: {
      width: '100%',
      flex: 1,
      backgroundColor: DIM,
    },
    middleRow: {
      flexDirection: 'row',
      height: FRAME_H,
    },
    dimSide: {
      flex: 1,
      backgroundColor: DIM,
    },
    frameBox: {
      width: FRAME_W,
      height: FRAME_H,
      justifyContent: 'center',
      alignItems: 'center',
    },
    frameLabel: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    corner: {
      position: 'absolute',
      width: CORNER,
      height: CORNER,
      borderColor: c.gold,
    },
    cornerTL: {
      top: 0,
      left: 0,
      borderTopWidth: BORDER,
      borderLeftWidth: BORDER,
    },
    cornerTR: {
      top: 0,
      right: 0,
      borderTopWidth: BORDER,
      borderRightWidth: BORDER,
    },
    cornerBL: {
      bottom: 0,
      left: 0,
      borderBottomWidth: BORDER,
      borderLeftWidth: BORDER,
    },
    cornerBR: {
      bottom: 0,
      right: 0,
      borderBottomWidth: BORDER,
      borderRightWidth: BORDER,
    },
    dimBottom: {
      width: '100%',
      flex: 1,
      backgroundColor: DIM,
      alignItems: 'center',
      justifyContent: 'center',
    },
    captureButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 4,
      borderColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    captureButtonInner: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#fff',
    },
    loadingOverlay: {
      backgroundColor: 'rgba(0,0,0,0.82)',
      gap: 18,
      paddingHorizontal: 32,
    },
    loadingText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    errorTitle: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    errorText: {
      color: '#9BA1A6',
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 8,
    },
    manualLink: {
      color: '#9BA1A6',
      fontSize: 14,
      textDecorationLine: 'underline',
      marginTop: 4,
    },
    errorButton: {
      backgroundColor: c.gold,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 32,
      alignItems: 'center',
      width: '100%',
    },
    errorButtonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: c.gold,
    },
    errorButtonLabel: {
      color: c.onGold,
      fontSize: 15,
      fontWeight: '700',
    },
    permissionText: {
      color: '#FFFFFF',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 32,
    },
    permissionButton: {
      backgroundColor: c.gold,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 32,
    },
    permissionButtonLabel: {
      color: c.onGold,
      fontWeight: '700',
      fontSize: 15,
    },
  });
