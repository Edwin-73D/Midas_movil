import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import { registrarTransaccion } from '@/modules/finanzas/registrar-transaccion.service';

import type { FacturaAnalizada } from '../domain/factura.types';

type CategoriaRow = { ID: number; nombre: string };

interface Props {
  visible: boolean;
  factura: FacturaAnalizada;
  categorias: CategoriaRow[];
  onClose: () => void;
  onGuardar: () => void;
  agregarGasto: (categoriaId: number, monto: number) => void;
}

export function FacturaSingleModal({
  visible,
  factura,
  categorias,
  onClose,
  onGuardar,
  agregarGasto,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const hoy = new Date().toISOString().slice(0, 10);

  const [descripcion, setDescripcion] = useState(factura.comercio);
  const [monto, setMonto] = useState(factura.total > 0 ? String(factura.total) : '');
  const [fecha, setFecha] = useState(factura.fecha ?? hoy);
  const [categoria, setCategoria] = useState<number | null>(null);

  const isValid = parseFloat(monto) > 0 && categoria !== null;

  async function handleGuardar() {
    if (!isValid) return;
    try {
      await registrarTransaccion(
        {
          type: 'expense',
          amount: parseFloat(monto),
          category: categoria,
          description: descripcion,
          metaId: undefined,
        },
        {
          resolveCategoriaId: () => categoria,
          onPresupuestoGasto: agregarGasto,
        }
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
      return;
    }
    onGuardar();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Confirmar gasto</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.input}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Monto</Text>
            <View style={styles.montoRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.montoInput}
                value={monto}
                onChangeText={setMonto}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textSecondary}
                placeholder="0.00"
              />
            </View>

            <Text style={styles.label}>Fecha</Text>
            <TextInput
              style={styles.input}
              value={fecha}
              onChangeText={setFecha}
              placeholderTextColor={colors.textSecondary}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Categoría</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              keyboardShouldPersistTaps="handled"
            >
              {categorias.map((cat) => {
                const selected = categoria === cat.ID;
                return (
                  <TouchableOpacity
                    key={cat.ID}
                    style={[
                      styles.chip,
                      selected && { backgroundColor: colors.danger, borderColor: colors.danger },
                    ]}
                    onPress={() => setCategoria(cat.ID)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
                      {cat.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
              onPress={handleGuardar}
              activeOpacity={0.85}
              disabled={!isValid}
            >
              <Text style={styles.submitLabel}>Guardar gasto</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    sheetWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 36,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    title: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    closeIcon: {
      color: c.textSecondary,
      fontSize: 28,
      lineHeight: 28,
    },
    label: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 14,
    },
    input: {
      backgroundColor: c.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.textPrimary,
      fontSize: 15,
    },
    montoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    currencySymbol: {
      color: c.gold,
      fontSize: 24,
      fontWeight: '300',
    },
    montoInput: {
      color: c.textPrimary,
      fontSize: 36,
      fontWeight: '300',
      flex: 1,
    },
    chipRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
    },
    chip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: 'transparent',
    },
    chipLabel: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    chipLabelActive: {
      color: c.onGold,
    },
    submitButton: {
      backgroundColor: c.gold,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    submitButtonDisabled: {
      opacity: 0.4,
    },
    submitLabel: {
      color: c.onGold,
      fontSize: 16,
      fontWeight: '700',
    },
  });
