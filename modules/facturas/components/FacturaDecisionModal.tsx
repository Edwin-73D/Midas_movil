import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MidasColors } from '@/constants/theme';

interface Props {
  visible: boolean;
  onSingle: () => void;
  onMultiple: () => void;
  onClose: () => void;
}

export function FacturaDecisionModal({ visible, onSingle, onMultiple, onClose }: Props) {
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

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 14,
  },
  title: {
    color: MidasColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  button: {
    backgroundColor: MidasColors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: MidasColors.gold,
  },
  buttonLabel: {
    color: '#0F0F0F',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonLabelOutline: {
    color: MidasColors.gold,
  },
});
