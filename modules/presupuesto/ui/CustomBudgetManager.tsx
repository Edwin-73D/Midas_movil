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

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import type { FrecuenciaPresupuesto } from '@/modules/presupuesto/periodo';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';

export type CategoriaItem = {
  nombre: string;
  monto: number;
  // HU-01: la categoría fija de ahorros no se puede renombrar ni eliminar.
  clave?: string | null;
  fija?: boolean;
};

interface Props {
  visible: boolean;
  categoriasIniciales: CategoriaItem[];
  frecuenciaInicial: FrecuenciaPresupuesto;
  onClose: () => void;
  onConfirm: (cats: CategoriaItem[], frecuencia: FrecuenciaPresupuesto) => void;
}

function getDefaults(t: (key: string) => string): CategoriaItem[] {
  return [
    { nombre: t('budget.categories.needs'),   monto: 0 },
    { nombre: t('budget.categories.wants'),   monto: 0 },
    { nombre: t('budget.categories.savings'), monto: 0, clave: 'ahorros', fija: true },
  ];
}

export function CustomBudgetManager({
  visible,
  categoriasIniciales,
  frecuenciaInicial,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [cats, setCats] = useState<CategoriaItem[]>([]);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaPresupuesto>(frecuenciaInicial);

  useEffect(() => {
    if (visible) {
      setCats(
        categoriasIniciales.length > 0
          ? categoriasIniciales.map((c) => ({ ...c }))
          : getDefaults(t)
      );
      setFrecuencia(frecuenciaInicial);
    }
  }, [visible, categoriasIniciales, frecuenciaInicial, t]);

  const total = cats.reduce((s, c) => s + (parseFloat(String(c.monto)) || 0), 0);
  const isValid =
    cats.length > 0 && cats.every((c) => c.monto > 0 && (c.fija || c.nombre.trim().length > 0));

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
    if (!isValid) return;
    onConfirm(cats.map((c) => (c.fija ? c : { ...c, nombre: c.nombre.trim() })), frecuencia);
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
            <Text style={styles.title}>{t('budget.configureTitle')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Frecuencia del presupuesto ─────────────────────────────── */}
            <Text style={styles.sectionLabel}>{t('budget.frequencyLabel')}</Text>
            <View style={styles.frecuenciaRow}>
              <TouchableOpacity
                style={[styles.frecuenciaBtn, frecuencia === 'mensual' && styles.frecuenciaBtnActive]}
                onPress={() => setFrecuencia('mensual')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.frecuenciaBtnText,
                    frecuencia === 'mensual' && styles.frecuenciaBtnTextActive,
                  ]}
                >
                  {t('budget.frequencyMonthly')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.frecuenciaBtn, frecuencia === 'quincenal' && styles.frecuenciaBtnActive]}
                onPress={() => setFrecuencia('quincenal')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.frecuenciaBtnText,
                    frecuencia === 'quincenal' && styles.frecuenciaBtnTextActive,
                  ]}
                >
                  {t('budget.frequencyBiweekly')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Total ──────────────────────────────────────────────────── */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('budget.totalBudget').toUpperCase()}</Text>
              <Text style={styles.totalValue}>
                ${Math.round(total).toLocaleString('es-CO')}
              </Text>
            </View>

            {/* ── Lista de categorías ────────────────────────────────────── */}
            {cats.map((cat, index) => (
              <View key={index} style={styles.catRow}>
                <View style={styles.catInputGroup}>
                  {cat.fija ? (
                    <View style={[styles.catNombreInput, styles.catNombreLocked]}>
                      <Text style={styles.catNombreLockedText} numberOfLines={1}>
                        {cat.nombre}
                      </Text>
                      <Text style={styles.lockBadge}>🔒</Text>
                    </View>
                  ) : (
                    <TextInput
                      style={styles.catNombreInput}
                      value={cat.nombre}
                      onChangeText={(v) => updateNombre(index, v)}
                      placeholder={t('budget.categoryPlaceholder')}
                      placeholderTextColor={colors.textSecondary}
                      maxLength={40}
                    />
                  )}
                  <View style={styles.montoRow}>
                    <Text style={styles.montoPrefix}>$</Text>
                    <TextInput
                      style={styles.catMontoInput}
                      value={cat.monto > 0 ? String(cat.monto) : ''}
                      onChangeText={(v) => updateMonto(index, v)}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                {cat.fija ? (
                  // La categoría fija no se puede eliminar; placeholder para alinear.
                  <View style={styles.removeButtonPlaceholder} />
                ) : (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeCategoria(index)}
                    hitSlop={8}
                  >
                    <Text style={styles.removeIcon}>−</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* ── Agregar categoría ─────────────────────────────────────── */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={addCategoria}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>{t('budget.addCategory')}</Text>
            </TouchableOpacity>

            {/* ── Confirmar ─────────────────────────────────────────────── */}
            {!isValid && (
              <Text style={styles.validationHint}>
                {t('budget.allAmountsRequired', 'Todas las categorías deben tener un monto mayor a $0')}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.confirmButton, !isValid && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.85}
              disabled={!isValid}
            >
              <Text style={styles.confirmLabel}>{t('budget.confirm')}</Text>
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
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    closeIcon: {
      color: c.textSecondary,
      fontSize: 28,
      lineHeight: 28,
    },
    sectionLabel: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    frecuenciaRow: {
      flexDirection: 'row',
      gap: 10,
    },
    frecuenciaBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: c.inputBackground,
      alignItems: 'center',
    },
    frecuenciaBtnActive: {
      backgroundColor: c.gold + '33',
      borderWidth: 1,
      borderColor: c.gold,
    },
    frecuenciaBtnText: {
      color: c.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    frecuenciaBtnTextActive: {
      color: c.gold,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    totalLabel: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    totalValue: {
      color: c.gold,
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
      backgroundColor: c.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: c.textPrimary,
      fontSize: 14,
    },
    catNombreLocked: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.gold + '15',
      borderWidth: 1,
      borderColor: c.gold + '55',
    },
    catNombreLockedText: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    lockBadge: {
      fontSize: 11,
      marginLeft: 6,
    },
    montoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 10,
      gap: 2,
      minWidth: 100,
    },
    montoPrefix: {
      color: c.gold,
      fontSize: 14,
      fontWeight: '600',
    },
    catMontoInput: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 14,
      paddingVertical: 10,
    },
    removeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButtonPlaceholder: {
      width: 32,
      height: 32,
    },
    removeIcon: {
      color: c.danger,
      fontSize: 20,
      lineHeight: 22,
      fontWeight: '600',
    },
    addButton: {
      borderWidth: 1.5,
      borderColor: c.gold,
      borderStyle: 'dashed',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    addButtonText: {
      color: c.gold,
      fontSize: 14,
      fontWeight: '600',
    },
    validationHint: {
      color: c.danger,
      fontSize: 12,
      textAlign: 'center',
    },
    confirmButton: {
      backgroundColor: c.gold,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 4,
    },
    confirmButtonDisabled: {
      opacity: 0.4,
    },
    confirmLabel: {
      color: c.onGold,
      fontSize: 16,
      fontWeight: '700',
    },
  });
