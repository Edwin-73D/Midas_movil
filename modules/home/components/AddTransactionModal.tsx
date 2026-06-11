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

type TransactionType = 'expense' | 'income' | 'saving';
type Category = 'Needs' | 'Wants';

export interface NewTransaction {
  type: TransactionType;
  amount: number;
  category: Category | null;
  description: string;
  metaId?: number;
  productoFinancieroId?: number;
}

export type MetaPickerItem = { id: number; nombre: string };
export type ProductoPickerItem = { id: number; nombre: string };

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (tx: NewTransaction) => void;
  metas: MetaPickerItem[];
  productos: ProductoPickerItem[];
  onCreateProducto: () => void;
}

const CATEGORIES: { label: Category; color: string }[] = [
  { label: 'Needs', color: MidasColors.needsColor },
  { label: 'Wants', color: MidasColors.wantsColor },
];

const TYPE_TABS: { value: TransactionType; label: string; color: string }[] = [
  { value: 'expense', label: 'Gasto', color: '#E74C3C' },
  { value: 'income', label: 'Ingreso', color: MidasColors.positive },
  { value: 'saving', label: 'Ahorro', color: MidasColors.gold },
];

export function AddTransactionModal({
  visible,
  onClose,
  onSubmit,
  metas,
  productos,
  onCreateProducto,
}: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedMetaId, setSelectedMetaId] = useState<number | null>(null);
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
  const [description, setDescription] = useState('');

  const amountValue = parseFloat(amount);
  const isValid =
    amountValue > 0 &&
    (type === 'income' ||
      (type === 'expense' && category !== null) ||
      (type === 'saving' && selectedProductoId !== null));

  function selectType(next: TransactionType) {
    setType(next);
    setCategory(null);
    if (next !== 'saving') {
      setSelectedProductoId(null);
      setSelectedMetaId(null);
    }
  }

  function handleSubmit() {
    if (!isValid) return;
    try {
      onSubmit({
        type,
        amount: isNaN(amountValue) ? 0 : amountValue,
        category: type === 'expense' ? category : null,
        // El ahorro no lleva descripción; su título se deriva de la meta/producto.
        description: type === 'saving' ? '' : description,
        metaId: type === 'saving' ? selectedMetaId ?? undefined : undefined,
        productoFinancieroId:
          type === 'saving' ? selectedProductoId ?? undefined : undefined,
      });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
      return;
    }
    resetForm();
    onClose();
  }

  function resetForm() {
    setType('expense');
    setAmount('');
    setCategory(null);
    setSelectedMetaId(null);
    setSelectedProductoId(null);
    setDescription('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleCreateProducto() {
    resetForm();
    onClose();
    onCreateProducto();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Nueva transacción</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.typeRow}>
              {TYPE_TABS.map((tab) => {
                const active = type === tab.value;
                return (
                  <TouchableOpacity
                    key={tab.value}
                    style={[styles.typeButton, active && { backgroundColor: tab.color }]}
                    onPress={() => selectType(tab.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={MidasColors.textSecondary}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>

            {type === 'expense' && (
              <>
                <Text style={styles.label}>Categoría</Text>
                <View style={styles.chipRow}>
                  {CATEGORIES.map((cat) => {
                    const selected = category === cat.label;
                    return (
                      <TouchableOpacity
                        key={cat.label}
                        style={[
                          styles.chip,
                          selected && { backgroundColor: cat.color, borderColor: cat.color },
                        ]}
                        onPress={() => setCategory(cat.label)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {type === 'saving' && (
              <>
                <Text style={styles.label}>Producto financiero *</Text>
                {productos.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.hint}>
                      Aún no tienes productos financieros. Crea uno para destinar tu ahorro.
                    </Text>
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={handleCreateProducto}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.createButtonText}>+ Crear producto financiero</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.metaScroll}
                    keyboardShouldPersistTaps="handled"
                  >
                    {productos.map((p) => {
                      const selected = selectedProductoId === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[
                            styles.metaChip,
                            selected && {
                              backgroundColor: MidasColors.gold,
                              borderColor: MidasColors.gold,
                            },
                          ]}
                          onPress={() => setSelectedProductoId(p.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
                            {p.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                <Text style={styles.label}>Meta (opcional)</Text>
                {metas.length === 0 ? (
                  <Text style={styles.hint}>No tienes metas. Puedes crear una en la pestaña Metas.</Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.metaScroll}
                    keyboardShouldPersistTaps="handled"
                  >
                    {metas.map((m) => {
                      const selected = selectedMetaId === m.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            styles.metaChip,
                            selected && {
                              backgroundColor: MidasColors.savingsColor,
                              borderColor: MidasColors.savingsColor,
                            },
                          ]}
                          // Tocar de nuevo la meta seleccionada la deselecciona (es opcional).
                          onPress={() =>
                            setSelectedMetaId((curr) => (curr === m.id ? null : m.id))
                          }
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
                            {m.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}

            {type !== 'saving' && (
              <>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={styles.descInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Ej. Almuerzo con el equipo"
                  placeholderTextColor={MidasColors.textSecondary}
                  returnKeyType="done"
                  maxLength={120}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={!isValid}
            >
              <Text style={styles.submitLabel}>Guardar</Text>
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
    maxHeight: '90%',
  },
  scrollContent: {
    gap: 16,
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
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  typeLabel: {
    color: MidasColors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  typeLabelActive: {
    color: '#0F0F0F',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  currencySymbol: {
    color: MidasColors.gold,
    fontSize: 32,
    fontWeight: '300',
  },
  amountInput: {
    color: MidasColors.textPrimary,
    fontSize: 48,
    fontWeight: '300',
    minWidth: 120,
    textAlign: 'center',
  },
  label: {
    color: MidasColors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    color: MidasColors.textSecondary,
    fontSize: 14,
  },
  emptyBox: {
    gap: 12,
  },
  createButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: MidasColors.gold,
  },
  createButtonText: {
    color: MidasColors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaScroll: {
    gap: 10,
    paddingVertical: 4,
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
  metaChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
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
  descInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: MidasColors.textPrimary,
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: MidasColors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
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
