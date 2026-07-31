import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { type MidasPalette } from '@/constants/theme';
import { useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import type { MetaVinculada } from '@/modules/productos/data/producto.service';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

interface Props {
  visible: boolean;
  etiqueta: 'ahorro' | 'inversion' | null;
  metas: MetaVinculada[];
  onCancel: () => void;
  onConfirm: () => void;
}

export function AdvertenciaCuentaModal({ visible, etiqueta, metas, onCancel, onConfirm }: Props) {
  const styles = useThemedStyles(makeStyles);
  const etiquetaLabel = etiqueta === 'inversion' ? 'inversión' : 'ahorro';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel} />
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>Cuenta de {etiquetaLabel}</Text>
          <Text style={styles.message}>
            Estás por gastar dinero de una cuenta destinada a {etiquetaLabel}.
          </Text>

          {metas.length === 0 ? (
            <Text style={styles.message}>Esta cuenta todavía no tiene metas asociadas.</Text>
          ) : (
            <View style={styles.metasList}>
              {metas.map((m) => {
                const pct = m.metaTotal > 0 ? Math.min((m.monto / m.metaTotal) * 100, 100) : 0;
                return (
                  <View key={m.id} style={styles.metaRow}>
                    <Text style={styles.metaNombre} numberOfLines={1}>{m.nombre}</Text>
                    <Text style={styles.metaProgreso}>
                      {formatCurrency(m.monto)} de {formatCurrency(m.metaTotal)} ({pct.toFixed(0)}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={onConfirm} activeOpacity={0.8}>
            <Text style={styles.buttonLabel}>Continuar de todos modos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonLabel, styles.buttonLabelOutline]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    card: {
      backgroundColor: c.cardBackground,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      gap: 14,
    },
    title: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    message: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    metasList: {
      backgroundColor: c.inputBackground,
      borderRadius: 12,
      padding: 12,
      gap: 8,
    },
    metaRow: {
      gap: 2,
    },
    metaNombre: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    metaProgreso: {
      color: c.textSecondary,
      fontSize: 12,
    },
    button: {
      backgroundColor: c.gold,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: c.gold,
    },
    buttonLabel: {
      color: c.onGold,
      fontSize: 15,
      fontWeight: '700',
    },
    buttonLabelOutline: {
      color: c.gold,
    },
  });
