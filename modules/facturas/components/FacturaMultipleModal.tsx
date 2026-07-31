import React, { useEffect, useState } from 'react';
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
import { CLAVE_LIBRE, getAdvertenciaCuenta, type AdvertenciaCuenta } from '@/modules/productos/data/producto.service';
import { AdvertenciaCuentaModal } from '@/modules/productos/ui/components/AdvertenciaCuentaModal';
import type { ProductoPickerItem } from '@/modules/home/components/AddTransactionModal';

import type { FacturaAnalizada } from '../domain/factura.types';

type CategoriaRow = { ID: number; nombre: string };

type ItemState = {
  checked: boolean;
  nombre: string;
  monto: string;
  categoria: number | null;
};

interface Props {
  visible: boolean;
  factura: FacturaAnalizada;
  categorias: CategoriaRow[];
  productos: ProductoPickerItem[];
  onClose: () => void;
  onGuardar: () => void;
  agregarGasto: (categoriaId: number, monto: number) => void;
}

export function FacturaMultipleModal({
  visible,
  factura,
  categorias,
  productos,
  onClose,
  onGuardar,
  agregarGasto,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [items, setItems] = useState<ItemState[]>(() =>
    factura.items.map((it) => ({
      checked: true,
      nombre: it.nombre,
      monto: it.monto > 0 ? String(it.monto) : '',
      categoria: null,
    }))
  );
  const [productoId, setProductoId] = useState<number | null>(null);
  const [advertencia, setAdvertencia] = useState<AdvertenciaCuenta>(null);

  useEffect(() => {
    if (visible) {
      setProductoId(productos.find((p) => p.clave === CLAVE_LIBRE)?.id ?? null);
      setAdvertencia(null);
    }
  }, [visible, productos]);

  const selectedCount = items.filter((it) => it.checked).length;
  const canGuardar = items.some((it) => it.checked && parseFloat(it.monto) > 0 && it.categoria !== null);

  function updateItem<K extends keyof ItemState>(index: number, key: K, value: ItemState[K]) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  }

  async function handleGuardar(opts?: { skipAdvertencia?: boolean }) {
    if (!canGuardar) return;

    if (productoId != null && !opts?.skipAdvertencia) {
      const adv = getAdvertenciaCuenta(productoId);
      if (adv) {
        setAdvertencia(adv);
        return;
      }
    }

    const toSave = items.filter((it) => it.checked && parseFloat(it.monto) > 0 && it.categoria !== null);
    let errored = false;
    for (const item of toSave) {
      try {
        await registrarTransaccion(
          {
            type: 'expense',
            amount: parseFloat(item.monto),
            category: item.categoria,
            description: item.nombre,
            metaId: undefined,
            productoFinancieroId: productoId ?? undefined,
          },
          {
            resolveCategoriaId: () => item.categoria,
            onPresupuestoGasto: agregarGasto,
          }
        );
      } catch (e) {
        errored = true;
        if (e instanceof Error && e.message === 'LIBRE_SIN_FONDOS') {
          Alert.alert(
            'Sin fondos en Libre',
            'No tienes dinero registrado en tu cuenta Libre para este gasto. Registra un ingreso primero o elige otra cuenta.'
          );
        } else if (e instanceof Error && e.message === 'INSUFFICIENT_FUNDS') {
          Alert.alert('Saldo insuficiente', 'Este gasto supera el saldo disponible de la cuenta seleccionada.');
        } else {
          Alert.alert('Error', `No se pudo guardar "${item.nombre}"`);
        }
        break;
      }
    }
    if (!errored) onGuardar();
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
            <Text style={styles.title}>Selecciona los ítems</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.accountLabel}>Cuenta para todos los ítems</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accountRow}
            keyboardShouldPersistTaps="handled"
          >
            {productos.map((p) => {
              const selected = productoId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.accountChip,
                    selected && { backgroundColor: colors.gold, borderColor: colors.gold },
                  ]}
                  onPress={() => setProductoId(p.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catLabel, selected && styles.catLabelActive]}>
                    {p.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
            {items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => updateItem(index, 'checked', !item.checked)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                    {item.checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.itemIndex}>Ítem {index + 1}</Text>
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, !item.checked && styles.inputDisabled]}
                  value={item.nombre}
                  onChangeText={(v) => updateItem(index, 'nombre', v)}
                  editable={item.checked}
                  placeholderTextColor={colors.textSecondary}
                />

                <View style={styles.montoRow}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={[styles.montoInput, !item.checked && styles.inputDisabled]}
                    value={item.monto}
                    onChangeText={(v) => updateItem(index, 'monto', v)}
                    keyboardType="decimal-pad"
                    editable={item.checked}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.catRow}>
                  {categorias.map((cat) => {
                    const selected = item.categoria === cat.ID;
                    return (
                      <TouchableOpacity
                        key={cat.ID}
                        style={[
                          styles.catChip,
                          selected && { backgroundColor: colors.danger, borderColor: colors.danger },
                          !item.checked && styles.catChipDisabled,
                        ]}
                        onPress={() => item.checked && updateItem(index, 'categoria', cat.ID)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.catLabel, selected && styles.catLabelActive]}>
                          {cat.nombre}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.countText}>
              {selectedCount} de {items.length} ítems seleccionados
            </Text>
            <TouchableOpacity
              style={[styles.submitButton, !canGuardar && styles.submitButtonDisabled]}
              onPress={() => handleGuardar()}
              activeOpacity={0.85}
              disabled={!canGuardar}
            >
              <Text style={styles.submitLabel}>Guardar seleccionados</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <AdvertenciaCuentaModal
        visible={advertencia != null}
        etiqueta={advertencia?.etiqueta ?? null}
        metas={advertencia?.metas ?? []}
        onCancel={() => setAdvertencia(null)}
        onConfirm={() => {
          setAdvertencia(null);
          handleGuardar({ skipAdvertencia: true });
        }}
      />
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
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 28,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
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
    list: {
      flex: 1,
    },
    accountLabel: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    accountRow: {
      gap: 8,
      paddingBottom: 12,
    },
    accountChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: 'transparent',
    },
    itemCard: {
      backgroundColor: c.inputBackground,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      gap: 10,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: c.gold,
      borderColor: c.gold,
    },
    checkmark: {
      color: c.onGold,
      fontSize: 13,
      fontWeight: '700',
    },
    itemIndex: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    input: {
      backgroundColor: c.cardBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: c.textPrimary,
      fontSize: 14,
    },
    inputDisabled: {
      opacity: 0.4,
    },
    montoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    currencySymbol: {
      color: c.gold,
      fontSize: 18,
    },
    montoInput: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: '300',
      flex: 1,
    },
    catRow: {
      flexDirection: 'row',
      gap: 8,
    },
    catChip: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: 'transparent',
    },
    catChipDisabled: {
      opacity: 0.4,
    },
    catLabel: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    catLabelActive: {
      color: c.onGold,
    },
    footer: {
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: c.border,
      gap: 12,
    },
    countText: {
      color: c.textSecondary,
      fontSize: 13,
      textAlign: 'center',
    },
    submitButton: {
      backgroundColor: c.gold,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
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
