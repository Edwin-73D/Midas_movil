import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { type MidasPalette } from '@/constants/theme';
import { useThemedStyles } from '@/modules/shared/theme/ThemeContext';

interface Props {
  visible: boolean;
  onSingle: () => void;
  onMultiple: () => void;
  onClose: () => void;
}

export function FacturaDecisionModal({ visible, onSingle, onMultiple, onClose }: Props) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>¿Cómo quieres registrar esta factura?</Text>

          <TouchableOpacity style={styles.button} onPress={onSingle} activeOpacity={0.8}>
            <Text style={styles.buttonLabel}>Una sola transacción</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={onMultiple}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonLabel, styles.buttonLabelOutline]}>
              Varias transacciones
            </Text>
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
      marginBottom: 6,
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
