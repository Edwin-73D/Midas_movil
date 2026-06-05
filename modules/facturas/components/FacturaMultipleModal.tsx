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

const CATEGORIES: ExpenseCategory[] = ['Needs', 'Wants', 'Savings'];

type ItemState = {
  checked: boolean;
  nombre: string;
  monto: string;
  categoria: ExpenseCategory | null;
};

interface Props {
  visible: boolean;
  factura: FacturaAnalizada;
  categorias: CategoriaRow[];
  onClose: () => void;
  onGuardar: () => void;
  agregarGasto: (categoriaId: number, monto: number) => void;
}

export function FacturaMultipleModal({
  visible,
  factura,
  categorias,
  onClose,
  onGuardar,
  agregarGasto,
}: Props) {
  const [items, setItems] = useState<ItemState[]>(() =>
    factura.items.map((it) => ({
      checked: true,
      nombre: it.nombre,
      monto: it.monto > 0 ? String(it.monto) : '',
      categoria: null,
    }))
  );

  const selectedCount = items.filter((it) => it.checked).length;
  const canGuardar = items.some((it) => it.checked && parseFloat(it.monto) > 0 && it.categoria !== null);

  function updateItem<K extends keyof ItemState>(index: number, key: K, value: ItemState[K]) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  }

  function handleGuardar() {
    if (!canGuardar) return;
    const toSave = items.filter((it) => it.checked && parseFloat(it.monto) > 0 && it.categoria !== null);
    let errored = false;
    for (const item of toSave) {
      try {
        registrarTransaccion(
          {
            type: 'expense',
            amount: parseFloat(item.monto),
            category: item.categoria,
            description: item.nombre,
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
        errored = true;
        Alert.alert('Error', `No se pudo guardar "${item.nombre}"`);
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
                  placeholderTextColor={MidasColors.textSecondary}
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
                    placeholderTextColor={MidasColors.textSecondary}
                  />
                </View>

                <View style={styles.catRow}>
                  {CATEGORIES.map((cat) => {
                    const selected = item.categoria === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.catChip,
                          selected && { backgroundColor: MidasColors.gold, borderColor: MidasColors.gold },
                          !item.checked && styles.catChipDisabled,
                        ]}
                        onPress={() => item.checked && updateItem(index, 'categoria', cat)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.catLabel, selected && styles.catLabelActive]}>
                          {cat}
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
              onPress={handleGuardar}
              activeOpacity={0.85}
              disabled={!canGuardar}
            >
              <Text style={styles.submitLabel}>Guardar seleccionados</Text>
            </TouchableOpacity>
          </View>
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
    color: MidasColors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  closeIcon: {
    color: MidasColors.textSecondary,
    fontSize: 28,
    lineHeight: 28,
  },
  list: {
    flex: 1,
  },
  itemCard: {
    backgroundColor: '#242424',
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
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: MidasColors.gold,
    borderColor: MidasColors.gold,
  },
  checkmark: {
    color: '#0F0F0F',
    fontSize: 13,
    fontWeight: '700',
  },
  itemIndex: {
    color: MidasColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: MidasColors.textPrimary,
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
    color: MidasColors.gold,
    fontSize: 18,
  },
  montoInput: {
    color: MidasColors.textPrimary,
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
    borderColor: '#444',
    backgroundColor: 'transparent',
  },
  catChipDisabled: {
    opacity: 0.4,
  },
  catLabel: {
    color: MidasColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  catLabelActive: {
    color: '#0F0F0F',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    gap: 12,
  },
  countText: {
    color: MidasColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: MidasColors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
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
