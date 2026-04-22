import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MidasColors } from '@/constants/theme';

type TransactionType = 'income' | 'expense';
type Category = 'Needs' | 'Wants' | 'Savings';

interface NewTransaction {
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (tx: NewTransaction) => void;
}

const CATEGORIES: { label: Category; color: string }[] = [
  { label: 'Needs', color: MidasColors.needsColor },
  { label: 'Wants', color: MidasColors.wantsColor },
  { label: 'Savings', color: MidasColors.savingsColor },
];

export function AddTransactionModal({ visible, onClose, onSubmit }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');

  const isValid = parseFloat(amount) > 0 && category !== null;

  function handleSubmit() {
    if (!isValid || !category) return;
    onSubmit({ type, amount: parseFloat(amount), category, description });
    resetForm();
    onClose();
  }

  function resetForm() {
    setType('expense');
    setAmount('');
    setCategory(null);
    setDescription('');
  }

  function handleClose() {
    resetForm();
    onClose();
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Nueva transacción</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Type toggle */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && { backgroundColor: MidasColors.positive },
              ]}
              onPress={() => setType('income')}
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
                Egreso
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
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

          {/* Category */}
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

          {/* Description */}
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

          {/* Submit */}
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
  chipRow: {
    flexDirection: 'row',
    gap: 10,
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
