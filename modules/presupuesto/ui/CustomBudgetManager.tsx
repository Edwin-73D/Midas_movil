import React, { useEffect, useState } from 'react';
import {
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

export type CategoriaItem = { nombre: string; monto: number };

interface Props {
  visible: boolean;
  categoriasIniciales: CategoriaItem[];
  onClose: () => void;
  onConfirm: (cats: CategoriaItem[]) => void;
}

const DEFAULTS: CategoriaItem[] = [
  { nombre: 'Needs',          monto: 0 },
  { nombre: 'Wants',          monto: 0 },
  { nombre: 'Savings & Debt', monto: 0 },
];

export function CustomBudgetManager({ visible, categoriasIniciales, onClose, onConfirm }: Props) {
  const [cats, setCats] = useState<CategoriaItem[]>([]);

  useEffect(() => {
    if (visible) {
      setCats(
        categoriasIniciales.length > 0
          ? categoriasIniciales.map((c) => ({ ...c }))
          : DEFAULTS.map((c) => ({ ...c }))
      );
    }
  }, [visible, categoriasIniciales]);

  const total = cats.reduce((s, c) => s + (parseFloat(String(c.monto)) || 0), 0);

  function updateNombre(index: number, value: string) {
    setCats((prev) => prev.map((c, i) => (i === index ? { ...c, nombre: value } : c)));
  }

  function updateMonto(index: number, value: string) {
    const monto = parseFloat(value) || 0;
    setCats((prev) => prev.map((c, i) => (i === index ? { ...c, monto } : c)));
  }

  function addCategoria() {
    setCats((prev) => [...prev, { nombre: '', monto: 0 }]);
  }

  function removeCategoria(index: number) {
    setCats((prev) => prev.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    const valid = cats.filter((c) => c.nombre.trim() && c.monto > 0);
    if (valid.length === 0) return;
    onConfirm(valid);
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
          {/* ── Header ─────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.title}>Configurar presupuesto</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Total ──────────────────────────────────────────────────── */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL PRESUPUESTADO</Text>
              <Text style={styles.totalValue}>
                ${Math.round(total).toLocaleString('es-CO')}
              </Text>
            </View>

            {/* ── Lista de categorías ────────────────────────────────────── */}
            {cats.map((cat, index) => (
              <View key={index} style={styles.catRow}>
                <View style={styles.catInputGroup}>
                  <TextInput
                    style={styles.catNombreInput}
                    value={cat.nombre}
                    onChangeText={(v) => updateNombre(index, v)}
                    placeholder="Categoría"
                    placeholderTextColor={MidasColors.textSecondary}
                    maxLength={40}
                  />
                  <View style={styles.montoRow}>
                    <Text style={styles.montoPrefix}>$</Text>
                    <TextInput
                      style={styles.catMontoInput}
                      value={cat.monto > 0 ? String(cat.monto) : ''}
                      onChangeText={(v) => updateMonto(index, v)}
                      placeholder="0"
                      placeholderTextColor={MidasColors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeCategoria(index)}
                  hitSlop={8}
                >
                  <Text style={styles.removeIcon}>−</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* ── Agregar categoría ─────────────────────────────────────── */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={addCategoria}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>+ Agregar categoría</Text>
            </TouchableOpacity>

            {/* ── Confirmar ─────────────────────────────────────────────── */}
            <TouchableOpacity
              style={[styles.confirmButton, total === 0 && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.85}
              disabled={total === 0}
            >
              <Text style={styles.confirmLabel}>Confirmar presupuesto</Text>
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
  scrollContent: {
    gap: 12,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  totalLabel: {
    color: MidasColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    color: MidasColors.gold,
    fontSize: 18,
    fontWeight: '700',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catInputGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  catNombreInput: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: MidasColors.textPrimary,
    fontSize: 14,
  },
  montoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 2,
    minWidth: 100,
  },
  montoPrefix: {
    color: MidasColors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  catMontoInput: {
    flex: 1,
    color: MidasColors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    color: '#E74C3C',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '600',
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: MidasColors.gold,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: MidasColors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: MidasColors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmLabel: {
    color: '#0F0F0F',
    fontSize: 16,
    fontWeight: '700',
  },
});
