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

import { MidasColors } from '@/constants/theme';
import type { Producto, ProductoTipo } from '@/modules/productos/domain/producto.model';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (p: Producto) => void;
  initialData?: Producto;
}

export default function ProductoForm({ visible, onClose, onSubmit, initialData }: Props) {
  const [nombre, setNombre] = useState(initialData?.nombre ?? '');
  const [entidad, setEntidad] = useState(initialData?.entidadFinanciera ?? '');
  const [tipo, setTipo] = useState<ProductoTipo>(initialData?.tipo ?? 'asset');
  const [montoNeto, setMontoNeto] = useState(initialData?.montoNeto?.toString() ?? '');
  const [montoTotal, setMontoTotal] = useState(initialData?.montoTotal?.toString() ?? '');
  const [interes, setInteres] = useState(initialData?.interes?.toString() ?? '');

  const handleSubmit = () => {
    const trimNombre = nombre.trim();
    const trimEntidad = entidad.trim();
    if (!trimNombre || !trimEntidad || !montoNeto) return;

    const parsedMontoNeto = Number(montoNeto);
    if (Number.isNaN(parsedMontoNeto) || parsedMontoNeto < 0) return;

    onSubmit({
      id: initialData?.id,
      nombre: trimNombre,
      entidadFinanciera: trimEntidad,
      tipo,
      montoNeto: parsedMontoNeto,
      montoTotal: Number(montoTotal) || parsedMontoNeto,
      interes: Number(interes) || 0,
      metaId: initialData?.metaId ?? null,
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

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Chase Sapphire"
              placeholderTextColor={MidasColors.textSecondary}
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={styles.label}>Entidad Financiera</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Chase Bank"
              placeholderTextColor={MidasColors.textSecondary}
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

            <Text style={styles.label}>Monto Neto</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={MidasColors.textSecondary}
              value={montoNeto}
              onChangeText={setMontoNeto}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Monto Total (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={MidasColors.textSecondary}
              value={montoTotal}
              onChangeText={setMontoTotal}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Interés % (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={MidasColors.textSecondary}
              value={interes}
              onChangeText={setInteres}
              keyboardType="decimal-pad"
            />

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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
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
    color: MidasColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    color: MidasColors.textSecondary,
    fontSize: 18,
    padding: 4,
  },
  label: {
    color: MidasColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#2A2A2C',
    color: MidasColors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  tipoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tipoBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2A2A2C',
    alignItems: 'center',
  },
  tipoBtnActive: {
    backgroundColor: `${MidasColors.gold}33`,
    borderWidth: 1,
    borderColor: MidasColors.gold,
  },
  tipoBtnDebtActive: {
    backgroundColor: '#E5737333',
    borderWidth: 1,
    borderColor: '#E57373',
  },
  tipoBtnText: {
    color: MidasColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tipoBtnTextActive: {
    color: MidasColors.gold,
  },
  tipoBtnDebtTextActive: {
    color: '#E57373',
  },
  submitBtn: {
    backgroundColor: MidasColors.gold,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: '#0F0F0F',
    fontSize: 16,
    fontWeight: '700',
  },
});
