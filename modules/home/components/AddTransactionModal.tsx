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

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import { CLAVE_LIBRE, getAdvertenciaCuenta, type AdvertenciaCuenta } from '@/modules/productos/data/producto.service';
import { AdvertenciaCuentaModal } from '@/modules/productos/ui/components/AdvertenciaCuentaModal';

type TransactionType = 'expense' | 'income' | 'saving';

export type Frecuencia = 'semanal' | 'mensual';

export interface NewTransaction {
  type: TransactionType;
  amount: number;
  category: number | null;
  description: string;
  metaId?: number;
  productoFinancieroId?: number;
  recurrente?: boolean;
  frecuencia?: Frecuencia;
  diaEjecucion?: number;
}

export type MetaPickerItem = { id: number; nombre: string };
export type ProductoPickerItem = { id: number; nombre: string; montoNeto: number; tipo: 'asset' | 'debt'; clave?: string | null };
export type PresupuestoCategoriaItem = { ID: number; nombre: string };

export interface InitialTransactionData {
  type: TransactionType;
  amount: string;
  category: number | null;
  description: string;
  metaId?: number;
  productoFinancieroId?: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (tx: NewTransaction) => void | Promise<void>;
  metas: MetaPickerItem[];
  productos?: ProductoPickerItem[];
  presupuestoCategorias?: PresupuestoCategoriaItem[];
  onCreateProducto?: () => void;
  onGoToBudget?: () => void;
  initialData?: InitialTransactionData;
  isEditing?: boolean;
}

export function AddTransactionModal({
  visible,
  onClose,
  onSubmit,
  metas,
  productos = [],
  presupuestoCategorias = [],
  onCreateProducto,
  onGoToBudget,
  initialData,
  isEditing = false,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const TYPE_TABS: { value: TransactionType; label: string; color: string }[] = [
    { value: 'expense', label: t('transaction.expense'), color: colors.danger },
    { value: 'income',  label: t('transaction.income'),  color: colors.positive },
    { value: 'saving',  label: t('transaction.saving'),  color: colors.gold },
  ];

  const FREQ_LABELS: Record<Frecuencia, string> = {
    semanal: t('transaction.weekly'),
    mensual: t('transaction.monthly'),
  };

  const [type,               setType]               = useState<TransactionType>('expense');
  const [amount,             setAmount]             = useState('');
  const [category,           setCategory]           = useState<number | null>(null);
  const [selectedMetaId,     setSelectedMetaId]     = useState<number | null>(null);
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
  const [description,        setDescription]        = useState('');
  const [recurrente,         setRecurrente]         = useState(false);
  const [frecuencia,         setFrecuencia]         = useState<Frecuencia>('mensual');
  const [diaEjecucion,       setDiaEjecucion]       = useState<number | null>(null);
  const [advertencia,        setAdvertencia]        = useState<AdvertenciaCuenta>(null);

  const defaultProductoId = productos.find((p) => p.clave === CLAVE_LIBRE)?.id ?? null;

  useEffect(() => {
    if (visible && initialData) {
      setType(initialData.type);
      setAmount(initialData.amount);
      setCategory(initialData.category);
      setSelectedMetaId(initialData.metaId ?? null);
      setSelectedProductoId(initialData.productoFinancieroId ?? null);
      setDescription(initialData.description);
    }
  }, [visible, initialData]);

  // Al abrir el modal para una transacción nueva, preseleccionar "Libre" por defecto.
  useEffect(() => {
    if (visible && !isEditing) {
      setSelectedProductoId(defaultProductoId);
    }
  }, [visible, isEditing, defaultProductoId]);

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
      setSelectedMetaId(null);
    }
  }

  async function handleSubmit(opts?: { skipAdvertencia?: boolean }) {
    if (!isValid) return;

    if (type === 'expense' && selectedProductoId != null) {
      const producto = productos.find((p) => p.id === selectedProductoId);
      if (producto?.tipo === 'asset') {
        const editingSameProducto =
          isEditing && initialData?.productoFinancieroId === selectedProductoId;
        const saldoDisponible = editingSameProducto
          ? producto.montoNeto + (parseFloat(initialData!.amount) || 0)
          : producto.montoNeto;
        if (amountValue > saldoDisponible) {
          if (producto.clave === CLAVE_LIBRE) {
            Alert.alert(t('transaction.libreInsufficientTitle'), t('transaction.libreInsufficientMessage'));
          } else {
            Alert.alert(t('transaction.insufficientFundsTitle'), t('transaction.insufficientFundsMessage'));
          }
          return;
        }
      }

      if (!opts?.skipAdvertencia) {
        const adv = getAdvertenciaCuenta(selectedProductoId);
        if (adv) {
          setAdvertencia(adv);
          return;
        }
      }
    }

    try {
      await onSubmit({
        type,
        amount: isNaN(amountValue) ? 0 : amountValue,
        category: type === 'expense' ? category : null,
        description: type === 'saving' ? '' : description,
        metaId: type === 'saving' ? selectedMetaId ?? undefined : undefined,
        productoFinancieroId: selectedProductoId ?? undefined,
        recurrente: recurrente || undefined,
        frecuencia: recurrente ? frecuencia : undefined,
        diaEjecucion: recurrente && diaEjecucion != null ? diaEjecucion : undefined,
      });
    } catch (e) {
      if (e instanceof Error && e.message === 'LIBRE_SIN_FONDOS') {
        Alert.alert(t('transaction.libreInsufficientTitle'), t('transaction.libreInsufficientMessage'));
        return;
      }
      if (e instanceof Error && e.message === 'INSUFFICIENT_FUNDS') {
        Alert.alert(t('transaction.insufficientFundsTitle'), t('transaction.insufficientFundsMessage'));
        return;
      }
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
    setRecurrente(false);
    setFrecuencia('mensual');
    setDiaEjecucion(null);
    setAdvertencia(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleCreateProducto() {
    resetForm();
    onClose();
    onCreateProducto?.();
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
            <Text style={styles.title}>
              {isEditing ? t('transaction.edit') : t('transaction.new')}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Selector de tipo ──────────────────────────────────────── */}
            {!isEditing && (
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
            )}

            {/* ── Monto ─────────────────────────────────────────────────── */}
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>

            {/* ── Categoría (solo gastos) ───────────────────────────────── */}
            {type === 'expense' && (
              <>
                <Text style={styles.label}>{t('transaction.category')}</Text>
                {presupuestoCategorias.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.hint}>
                      {t('transaction.noBudgetCategories', 'Debes crear tu presupuesto primero para poder registrar gastos.')}
                    </Text>
                    {onGoToBudget && (
                      <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => { handleClose(); onGoToBudget(); }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.createButtonText}>
                          {t('transaction.goToBudget', 'Ir al presupuesto')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.metaScroll}
                    keyboardShouldPersistTaps="handled"
                  >
                    {presupuestoCategorias.map((cat) => {
                      const selected = category === cat.ID;
                      return (
                        <TouchableOpacity
                          key={cat.ID}
                          style={[
                            styles.metaChip,
                            selected && { backgroundColor: colors.danger, borderColor: colors.danger },
                          ]}
                          onPress={() => setCategory(cat.ID)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
                            {cat.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}

            {/* ── Gasto: producto financiero opcional ───────────────────── */}
            {type === 'expense' && productos.length > 0 && (
              <>
                <Text style={styles.label}>{t('transaction.productOptional')}</Text>
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
                          selected && { backgroundColor: colors.gold, borderColor: colors.gold },
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
              </>
            )}

            {/* ── Ingreso: producto financiero opcional ─────────────────── */}
            {type === 'income' && productos.length > 0 && (
              <>
                <Text style={styles.label}>{t('transaction.productOptional')}</Text>
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
                          selected && { backgroundColor: colors.gold, borderColor: colors.gold },
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
              </>
            )}

            {/* ── Ahorro: producto + meta ───────────────────────────────── */}
            {type === 'saving' && (
              <>
                <Text style={styles.label}>{t('transaction.product')}</Text>
                {productos.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.hint}>{t('transaction.noProducts')}</Text>
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={handleCreateProducto}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.createButtonText}>{t('transaction.createProduct')}</Text>
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
                              backgroundColor: colors.gold,
                              borderColor: colors.gold,
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

                <Text style={styles.label}>{t('transaction.goal')}</Text>
                {metas.length === 0 ? (
                  <Text style={styles.hint}>{t('transaction.noGoals')}</Text>
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
                              backgroundColor: colors.savingsColor,
                              borderColor: colors.savingsColor,
                            },
                          ]}
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

            {/* ── Descripción (no para ahorros) ─────────────────────────── */}
            {type !== 'saving' && (
              <>
                <Text style={styles.label}>{t('transaction.description')}</Text>
                <TextInput
                  style={styles.descInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={type === 'income' ? t('transaction.placeholderIncome') : t('transaction.placeholder')}
                  placeholderTextColor={colors.textSecondary}
                  returnKeyType="done"
                  maxLength={120}
                />
              </>
            )}

            {/* ── Recurrencia (solo al crear) ───────────────────────────── */}
            {!isEditing && (
              <>
                <View style={styles.recurRow}>
                  <View style={styles.recurLabelGroup}>
                    <Text style={styles.recurLabel}>{t('transaction.recurring')}</Text>
                    <Text style={styles.recurSubLabel}>{t('transaction.recurringSubtitle')}</Text>
                  </View>
                  <Switch
                    value={recurrente}
                    onValueChange={setRecurrente}
                    trackColor={{ false: colors.border, true: colors.gold }}
                    thumbColor={recurrente ? colors.onGold : colors.tabBarInactive}
                  />
                </View>

                {recurrente && (
                  <>
                    <Text style={styles.label}>{t('transaction.frequency')}</Text>
                    <View style={styles.chipRow}>
                      {(['semanal', 'mensual'] as Frecuencia[]).map((f) => {
                        const selected = frecuencia === f;
                        return (
                          <TouchableOpacity
                            key={f}
                            style={[
                              styles.chip,
                              selected && {
                                backgroundColor: colors.gold,
                                borderColor: colors.gold,
                              },
                            ]}
                            onPress={() => { setFrecuencia(f); setDiaEjecucion(null); }}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.chipLabel, selected && { color: colors.onGold }]}>
                              {FREQ_LABELS[f]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* ── Día de ejecución ─────────────────────────────────── */}
                    <Text style={styles.label}>{t('transaction.dayOfExecution')}</Text>
                    {frecuencia === 'semanal' ? (
                      <View style={styles.chipRow}>
                        {(t('transaction.daysOfWeek', { returnObjects: true }) as string[]).map((d, i) => {
                          const selected = diaEjecucion === i;
                          return (
                            <TouchableOpacity
                              key={d}
                              style={[
                                styles.dayChip,
                                selected && { backgroundColor: colors.gold, borderColor: colors.gold },
                              ]}
                              onPress={() => setDiaEjecucion(selected ? null : i)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.dayChipText, selected && { color: colors.onGold }]}>
                                {d}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.dayInputRow}>
                        <Text style={styles.hint}>{t('transaction.dayOfMonth')}</Text>
                        <TextInput
                          style={styles.dayInput}
                          value={diaEjecucion != null ? String(diaEjecucion) : ''}
                          onChangeText={(v) => {
                            const n = parseInt(v, 10);
                            setDiaEjecucion(!v ? null : Number.isFinite(n) ? Math.min(31, Math.max(1, n)) : diaEjecucion);
                          }}
                          keyboardType="number-pad"
                          placeholder="—"
                          placeholderTextColor={colors.textSecondary}
                          maxLength={2}
                        />
                      </View>
                    )}
                  </>
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
              onPress={() => handleSubmit()}
              activeOpacity={0.85}
              disabled={!isValid}
            >
              <Text style={styles.submitLabel}>
                {isEditing ? t('transaction.saveChanges') : t('common.save')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <AdvertenciaCuentaModal
        visible={advertencia != null}
        etiqueta={advertencia?.etiqueta ?? null}
        metas={advertencia?.metas ?? []}
        onCancel={() => setAdvertencia(null)}
        onConfirm={() => {
          setAdvertencia(null);
          handleSubmit({ skipAdvertencia: true });
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
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    closeIcon: {
      color: c.textSecondary,
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
      backgroundColor: c.inputBackground,
    },
    typeLabel: {
      color: c.textSecondary,
      fontWeight: '600',
      fontSize: 14,
    },
    typeLabelActive: {
      color: c.onGold,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    currencySymbol: {
      color: c.gold,
      fontSize: 32,
      fontWeight: '300',
    },
    amountInput: {
      color: c.textPrimary,
      fontSize: 48,
      fontWeight: '300',
      minWidth: 120,
      textAlign: 'center',
    },
    label: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    hint: {
      color: c.textSecondary,
      fontSize: 14,
    },
    emptyBox: {
      gap: 12,
    },
    createButton: {
      backgroundColor: c.inputBackground,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.gold,
    },
    createButtonText: {
      color: c.gold,
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
      borderColor: c.border,
      backgroundColor: 'transparent',
    },
    metaChip: {
      paddingVertical: 10,
      paddingHorizontal: 16,
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
    descInput: {
      backgroundColor: c.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.textPrimary,
      fontSize: 15,
    },
    recurRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.inputBackground,
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
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    recurSubLabel: {
      color: c.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    submitButton: {
      backgroundColor: c.gold,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 4,
    },
    submitButtonDisabled: {
      opacity: 0.4,
    },
    submitLabel: {
      color: c.onGold,
      fontSize: 16,
      fontWeight: '700',
    },
    dayChip: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: 'transparent',
      minWidth: 40,
    },
    dayChipText: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    dayInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dayInput: {
      backgroundColor: c.inputBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: c.textPrimary,
      fontSize: 15,
      width: 64,
      textAlign: 'center',
    },
  });
