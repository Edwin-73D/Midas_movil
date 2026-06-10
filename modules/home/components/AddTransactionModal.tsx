import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MidasColors } from '@/constants/theme';

type TransactionType = 'income' | 'expense';
type Category = 'Needs' | 'Wants' | 'Savings';

export type Frecuencia = 'semanal' | 'mensual';

export interface NewTransaction {
  type: TransactionType;
  amount: number;
  category: Category | null;
  description: string;
  metaId?: number;
  recurrente?: boolean;
  frecuencia?: Frecuencia;
}

export type MetaPickerItem = { id: number; nombre: string };
export type ProductoPickerItem = { id: number; nombre: string };

export interface InitialTransactionData {
  type: TransactionType;
  amount: string;
  category: Category | null;
  description: string;
  metaId?: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (tx: NewTransaction) => void;
  metas: MetaPickerItem[];
  // props opcionales para compatibilidad con _layout y modo edición
  productos?: ProductoPickerItem[];
  onCreateProducto?: () => void;
  initialData?: InitialTransactionData;
  isEditing?: boolean;
}

const CATEGORIES: { label: Category; color: string }[] = [
  { label: 'Needs', color: MidasColors.needsColor },
  { label: 'Wants', color: MidasColors.wantsColor },
  { label: 'Savings', color: MidasColors.savingsColor },
];

export function AddTransactionModal({
  visible,
  onClose,
  onSubmit,
  metas,
  initialData,
  isEditing = false,
}: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedMetaId, setSelectedMetaId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [recurrente, setRecurrente] = useState(false);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('mensual');

  // Poblar el formulario cuando se abre en modo edición
  useEffect(() => {
    if (visible && initialData) {
      setType(initialData.type);
      setAmount(initialData.amount);
      setCategory(initialData.category);
      setSelectedMetaId(initialData.metaId ?? null);
      setDescription(initialData.description);
    }
  }, [visible, initialData]);

  const isSavings = type === 'expense' && category === 'Savings';
  // Para Savings, solo se requiere seleccionar una meta.
  // Para los demás tipos, se requiere monto > 0 y categoría si es gasto.
  const isValid = isSavings
    ? selectedMetaId != null
    : parseFloat(amount) > 0 && (type === 'income' || category !== null);

  function handleSubmit() {
    if (!isValid) return;
    const parsedAmount = parseFloat(amount);
    try {
      onSubmit({
        type,
        amount: isNaN(parsedAmount) ? 0 : parsedAmount,
        category,
        description,
        metaId: selectedMetaId ?? undefined,
        recurrente: recurrente || undefined,
        frecuencia: recurrente ? frecuencia : undefined,
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
    setDescription('');
    setRecurrente(false);
    setFrecuencia('mensual');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function selectCategory(cat: Category) {
    setCategory(cat);
    if (cat !== 'Savings') setSelectedMetaId(null);
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
            <Text style={styles.title}>{isEditing ? 'Editar transacción' : 'Nueva transacción'}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && { backgroundColor: MidasColors.positive },
              ]}
              onPress={() => {
                setType('income');
                setCategory(null);
                setSelectedMetaId(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeLabel, type === 'income' && styles.typeLabelActive]}>
                Ingreso
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && { backgroundColor: '#E74C3C' },
              ]}
              onPress={() => setType('expense')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeLabel, type === 'expense' && styles.typeLabelActive]}>
                Gasto
              </Text>
            </TouchableOpacity>
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
                      onPress={() => selectCategory(cat.label)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {category === 'Savings' && (
                <>
                  <Text style={styles.label}>Meta de ahorro</Text>
                  {metas.length === 0 ? (
                    <Text style={styles.hint}>
                      Crea una meta en la pestaña Metas primero.
                    </Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.metaScroll}
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
                            onPress={() => setSelectedMetaId(m.id)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[styles.chipLabel, selected && styles.chipLabelActive]}
                            >
                              {m.nombre || `Meta ${m.id}`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </>
              )}
            </>
          )}

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

          {/* ── Recurrencia (solo al crear, no en modo edición) ── */}
          {!isEditing && (
            <>
              <View style={styles.recurRow}>
                <View style={styles.recurLabelGroup}>
                  <Text style={styles.recurLabel}>Transacción recurrente</Text>
                  <Text style={styles.recurSubLabel}>
                    Se registrará automáticamente según la frecuencia elegida
                  </Text>
                </View>
                <Switch
                  value={recurrente}
                  onValueChange={setRecurrente}
                  trackColor={{ false: '#3A3A3A', true: MidasColors.gold }}
                  thumbColor={recurrente ? '#0F0F0F' : '#888888'}
                />
              </View>

              {recurrente && (
                <>
                  <Text style={styles.label}>Frecuencia</Text>
                  <View style={styles.chipRow}>
                    {(['semanal', 'mensual'] as Frecuencia[]).map((f) => {
                      const selected = frecuencia === f;
                      return (
                        <TouchableOpacity
                          key={f}
                          style={[
                            styles.chip,
                            selected && {
                              backgroundColor: MidasColors.gold,
                              borderColor: MidasColors.gold,
                            },
                          ]}
                          onPress={() => setFrecuencia(f)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.chipLabel,
                              selected && { color: '#0F0F0F' },
                            ]}
                          >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
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
    gap: 16,
    maxHeight: '90%',
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
  recurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  recurLabelGroup: {
    flex: 1,
    gap: 2,
  },
  recurLabel: {
    color: MidasColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  recurSubLabel: {
    color: MidasColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
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
