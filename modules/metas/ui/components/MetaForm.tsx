import React, { useState } from 'react';
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

import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import type { Meta, MetaFormInput } from '@/modules/metas/domain/meta.model';

/** AAAA-MM-DD → DD/MM/AAAA (para mostrar en el campo) */
function isoToDisplay(iso?: string): string {
  if (!iso || iso.length !== 10) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

/** DD/MM/AAAA → AAAA-MM-DD (para enviar al servicio) */
function displayToIso(display: string): string {
  if (display.length !== 10) return '';
  const [d, m, y] = display.split('/');
  return `${y}-${m}-${d}`;
}

export default function MetaForm({
  visible,
  onSubmit,
  onClose,
  initialData,
}: {
  visible: boolean;
  onSubmit: (meta: MetaFormInput) => void;
  onClose: () => void;
  initialData?: Meta;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [metaTotal, setMetaTotal] = useState(initialData?.metaTotal?.toString() || '');
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
  // Estado en formato visual DD/MM/AAAA
  const [fecha, setFecha] = useState(() => isoToDisplay(initialData?.fechaFinalizar));

  const isEditing = !!initialData;

  // Sync fields when initialData changes (modal reuse)
  React.useEffect(() => {
    setNombre(initialData?.nombre || '');
    setMetaTotal(initialData?.metaTotal?.toString() || '');
    setDescripcion(initialData?.descripcion || '');
    setFecha(isoToDisplay(initialData?.fechaFinalizar));
  }, [initialData]);

  const isValid =
    nombre.trim().length > 0 &&
    fecha.length === 10 &&
    parseFloat(metaTotal) > 0;

  const handleFechaChange = (raw: string) => {
    // Solo dígitos
    const digits = raw.replace(/\D/g, '');
    // Insertar separadores: DD/MM/AAAA
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    if (digits.length > 4) formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
    setFecha(formatted.slice(0, 10));
  };

  const handleSubmit = () => {
    const trimmedNombre = nombre.trim();
    if (!trimmedNombre || !metaTotal || fecha.length !== 10) return;
    const parsedMetaTotal = Number(metaTotal);
    if (Number.isNaN(parsedMetaTotal) || parsedMetaTotal <= 0) return;

    onSubmit({
      id: initialData?.id,
      nombre: trimmedNombre,
      metaTotal: parsedMetaTotal,
      descripcion: descripcion.trim() || undefined,
      // El servicio y la BD esperan AAAA-MM-DD
      fechaFinalizar: displayToIso(fecha),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditing ? 'Editar meta' : 'Nueva meta'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} activeOpacity={0.7}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Accumulated savings (edit mode) */}
            {isEditing && (
              <View style={styles.accumulatedBanner}>
                <Text style={styles.accumulatedLabel}>Ahorro acumulado</Text>
                <Text style={styles.accumulatedValue}>
                  $ {Math.round(initialData?.monto ?? 0).toLocaleString('es-CO')}
                </Text>
              </View>
            )}

            {/* Nombre */}
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Viaje a Europa"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="next"
              maxLength={60}
            />

            {/* Meta total */}
            <Text style={styles.label}>Monto objetivo</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={metaTotal}
                onChangeText={setMetaTotal}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            {/* Fecha */}
            <Text style={styles.label}>Fecha límite</Text>
            <TextInput
              style={styles.input}
              value={fecha}
              onChangeText={handleFechaChange}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              returnKeyType="next"
              maxLength={10}
            />

            {/* Descripción */}
            <Text style={styles.label}>Descripción <Text style={styles.optional}>(opcional)</Text></Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Cuéntanos un poco sobre esta meta..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              returnKeyType="done"
              maxLength={200}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={!isValid}
            >
              <Text style={styles.submitLabel}>
                {isEditing ? 'Guardar cambios' : 'Crear meta'}
              </Text>
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
      paddingTop: 12,
      paddingBottom: 36,
      maxHeight: '92%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginBottom: 16,
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
    accumulatedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.positive + '15',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.positive + '30',
    },
    accumulatedLabel: {
      color: c.positive,
      fontSize: 13,
      fontWeight: '500',
    },
    accumulatedValue: {
      color: c.positive,
      fontSize: 16,
      fontWeight: '700',
    },
    label: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 16,
    },
    optional: {
      textTransform: 'none',
      fontSize: 11,
      fontWeight: '400',
      color: c.textSecondary,
      letterSpacing: 0,
    },
    input: {
      backgroundColor: c.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      color: c.textPrimary,
      fontSize: 15,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    multiline: {
      minHeight: 80,
      textAlignVertical: 'top',
      paddingTop: 13,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    currencySymbol: {
      color: c.gold,
      fontSize: 20,
      fontWeight: '400',
      marginRight: 6,
    },
    amountInput: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: '300',
      paddingVertical: 13,
    },
    submitButton: {
      backgroundColor: c.gold,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 28,
      marginBottom: 4,
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
