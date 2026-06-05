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

import { MidasColors } from '@/constants/theme';
import { registrarTransaccion } from '@/modules/finanzas/registrar-transaccion.service';
import type { ExpenseCategory } from '@/modules/shared/finance/categories';
import { DB_CATEGORY_NAMES } from '@/modules/shared/finance/categories';

import type { FacturaAnalizada } from '../domain/factura.types';

type CategoriaRow = { ID: number; nombre: string };

const CATEGORIES: { label: ExpenseCategory; color: string }[] = [
  { label: 'Needs', color: MidasColors.needsColor },
  { label: 'Wants', color: MidasColors.wantsColor },
  { label: 'Savings', color: MidasColors.savingsColor },
];

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
  const hoy = new Date().toISOString().slice(0, 10);

  const [descripcion, setDescripcion] = useState(factura.comercio);
  const [monto, setMonto] = useState(factura.total > 0 ? String(factura.total) : '');
  const [fecha, setFecha] = useState(factura.fecha ?? hoy);
  const [categoria, setCategoria] = useState<ExpenseCategory | null>(null);

  const isValid = parseFloat(monto) > 0 && categoria !== null;

  function handleGuardar() {
    if (!isValid) return;
    try {
      registrarTransaccion(
        {
          type: 'expense',
          amount: parseFloat(monto),
          category: categoria,
          description: descripcion,
          metaId: undefined,
        },
        {
          resolveCategoriaId: (cat) => {
            const dbName = DB_CATEGORY_NAMES[cat];
            return categorias.find((c) => c.nombre === dbName)?.ID ?? null;
          },
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
              placeholderTextColor={MidasColors.textSecondary}
            />

            <Text style={styles.label}>Monto</Text>
            <View style={styles.montoRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.montoInput}
                value={monto}
                onChangeText={setMonto}
                keyboardType="decimal-pad"
                placeholderTextColor={MidasColors.textSecondary}
                placeholder="0.00"
              />
            </View>

            <Text style={styles.label}>Fecha</Text>
            <TextInput
              style={styles.input}
              value={fecha}
              onChangeText={setFecha}
              placeholderTextColor={MidasColors.textSecondary}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => {
                const selected = categoria === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[
                      styles.chip,
                      selected && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setCategoria(cat.label)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: MidasColors.cardBackground,
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
    color: MidasColors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  closeIcon: {
    color: MidasColors.textSecondary,
    fontSize: 28,
    lineHeight: 28,
  },
  label: {
    color: MidasColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: MidasColors.textPrimary,
    fontSize: 15,
  },
  montoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currencySymbol: {
    color: MidasColors.gold,
    fontSize: 24,
    fontWeight: '300',
  },
  montoInput: {
    color: MidasColors.textPrimary,
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
    borderColor: '#3A3A3A',
    backgroundColor: 'transparent',
  },
  chipLabel: {
    color: MidasColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#0F0F0F',
  },
  submitButton: {
    backgroundColor: MidasColors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitLabel: {
    color: '#0F0F0F',
    fontSize: 16,
    fontWeight: '700',
  },
});
