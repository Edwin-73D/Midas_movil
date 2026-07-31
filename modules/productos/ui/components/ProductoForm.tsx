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
import type {
  FrecuenciaCapitalizacion,
  Producto,
  ProductoTipo,
} from '@/modules/productos/domain/producto.model';

const FRECUENCIAS: { value: FrecuenciaCapitalizacion; label: string }[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (p: Producto) => void;
  initialData?: Producto;
}

export default function ProductoForm({ visible, onClose, onSubmit, initialData }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [nombre, setNombre] = useState(initialData?.nombre ?? '');
  const [entidad, setEntidad] = useState(initialData?.entidadFinanciera ?? '');
  const [tipo, setTipo] = useState<ProductoTipo>(initialData?.tipo ?? 'asset');
  const [montoNeto, setMontoNeto] = useState(initialData?.montoNeto?.toString() ?? '');
  const [interes, setInteres] = useState(initialData?.interes?.toString() ?? '');
  const [etiqueta, setEtiqueta] = useState<'ahorro' | 'inversion' | null>(initialData?.etiqueta ?? null);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaCapitalizacion | null>(
    initialData?.frecuenciaCapitalizacion ?? null
  );

  const tieneInteres = Number(interes) > 0;

  const handleSubmit = () => {
    const trimNombre = nombre.trim();
    const trimEntidad = entidad.trim();
    if (!trimNombre || !trimEntidad || !montoNeto) return;

    const parsedMontoNeto = Number(montoNeto);
    if (Number.isNaN(parsedMontoNeto) || parsedMontoNeto < 0) return;

    const parsedInteres = Number(interes) || 0;
    // Si hay tasa configurada, se exige frecuencia de capitalización.
    if (parsedInteres > 0 && !frecuencia) return;

    onSubmit({
      id: initialData?.id,
      nombre: trimNombre,
      entidadFinanciera: trimEntidad,
      tipo,
      montoNeto: parsedMontoNeto,
      montoTotal: parsedMontoNeto,
      interes: parsedInteres,
      metaId: initialData?.metaId ?? null,
      etiqueta,
      frecuenciaCapitalizacion: parsedInteres > 0 ? frecuencia : null,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {initialData ? 'Editar Producto' : 'Nuevo Producto'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Chase Sapphire"
              placeholderTextColor={colors.textSecondary}
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={styles.label}>Entidad Financiera</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Chase Bank"
              placeholderTextColor={colors.textSecondary}
              value={entidad}
              onChangeText={setEntidad}
            />

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.tipoRow}>
              <TouchableOpacity
                style={[styles.tipoBtn, tipo === 'asset' && styles.tipoBtnActive]}
                onPress={() => setTipo('asset')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipoBtnText, tipo === 'asset' && styles.tipoBtnTextActive]}>
                  Asset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tipoBtn, tipo === 'debt' && styles.tipoBtnDebtActive]}
                onPress={() => setTipo('debt')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipoBtnText, tipo === 'debt' && styles.tipoBtnDebtTextActive]}>
                  Debt
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Etiqueta (opcional)</Text>
            <View style={styles.tipoRow}>
              <TouchableOpacity
                style={[styles.tipoBtn, etiqueta === null && styles.tipoBtnActive]}
                onPress={() => setEtiqueta(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipoBtnText, etiqueta === null && styles.tipoBtnTextActive]}>
                  Ninguna
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tipoBtn, etiqueta === 'ahorro' && styles.tipoBtnActive]}
                onPress={() => setEtiqueta('ahorro')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipoBtnText, etiqueta === 'ahorro' && styles.tipoBtnTextActive]}>
                  Ahorro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tipoBtn, etiqueta === 'inversion' && styles.tipoBtnActive]}
                onPress={() => setEtiqueta('inversion')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipoBtnText, etiqueta === 'inversion' && styles.tipoBtnTextActive]}>
                  Inversión
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Monto Neto</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={montoNeto}
              onChangeText={setMontoNeto}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Interés % (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={interes}
              onChangeText={setInteres}
              keyboardType="decimal-pad"
            />

            {tieneInteres && (
              <>
                <Text style={styles.label}>Frecuencia de capitalización</Text>
                <View style={styles.frecuenciaRow}>
                  {FRECUENCIAS.map((f) => (
                    <TouchableOpacity
                      key={f.value}
                      style={[styles.frecuenciaBtn, frecuencia === f.value && styles.tipoBtnActive]}
                      onPress={() => setFrecuencia(f.value)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.tipoBtnText, frecuencia === f.value && styles.tipoBtnTextActive]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
              <Text style={styles.submitBtnText}>Guardar</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
      paddingBottom: 32,
      maxHeight: '85%',
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: c.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 4,
    },
    sheetTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    closeBtn: {
      color: c.textSecondary,
      fontSize: 18,
      padding: 4,
    },
    label: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
      marginTop: 14,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: c.inputBackground,
      color: c.textPrimary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
    },
    tipoRow: {
      flexDirection: 'row',
      gap: 10,
    },
    frecuenciaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    frecuenciaBtn: {
      flexBasis: '47%',
      flexGrow: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: c.inputBackground,
      alignItems: 'center',
    },
    tipoBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: c.inputBackground,
      alignItems: 'center',
    },
    tipoBtnActive: {
      backgroundColor: c.gold + '33',
      borderWidth: 1,
      borderColor: c.gold,
    },
    tipoBtnDebtActive: {
      backgroundColor: c.danger + '33',
      borderWidth: 1,
      borderColor: c.danger,
    },
    tipoBtnText: {
      color: c.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    tipoBtnTextActive: {
      color: c.gold,
    },
    tipoBtnDebtTextActive: {
      color: c.danger,
    },
    submitBtn: {
      backgroundColor: c.gold,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 24,
    },
    submitBtnText: {
      color: c.onGold,
      fontSize: 16,
      fontWeight: '700',
    },
  });
