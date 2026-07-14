import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
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
import {
  type AhorroProducto,
  editarMontoAhorro,
  eliminarAhorro,
  getAhorrosPorProducto,
} from '@/modules/finanzas/ahorro.service';
import type { Producto } from '@/modules/productos/domain/producto.model';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(raw: string): string {
  if (!raw) return '';
  try {
    const date = new Date(raw.replace(' ', 'T'));
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return raw;
  }
}

interface Props {
  visible: boolean;
  producto: Producto | null;
  onClose: () => void;
}

export function ProductoAhorrosModal({ visible, producto, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [ahorros, setAhorros] = useState<AhorroProducto[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const productId = producto?.id ?? null;

  useEffect(() => {
    if (!visible || productId == null) return;
    const reload = () => setAhorros(getAhorrosPorProducto(productId));
    reload();
    // Recargar si cambia cualquier transacción (alta/edición/borrado de ahorros).
    return transactionEvents.subscribe(reload);
  }, [visible, productId]);

  const totalAhorrado = ahorros.reduce((acc, a) => acc + a.monto, 0);

  function handleDelete(a: AhorroProducto) {
    Alert.alert(
      'Eliminar ahorro',
      `¿Eliminar este ahorro de ${formatCurrency(a.monto)}? El saldo del producto se recalculará.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarAhorro(a.id),
        },
      ]
    );
  }

  function startEdit(a: AhorroProducto) {
    setEditingId(a.id);
    setEditValue(String(a.monto));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  function saveEdit(a: AhorroProducto) {
    const nuevo = parseFloat(editValue);
    if (!Number.isFinite(nuevo) || nuevo <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0.');
      return;
    }
    editarMontoAhorro(a.id, nuevo);
    cancelEdit();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {producto?.nombre ?? 'Producto'}
              </Text>
              <Text style={styles.subtitle}>Historial de ahorros</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Saldo</Text>
              <Text style={styles.statValue}>{formatCurrency(producto?.montoNeto ?? 0)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Aportado por ahorros</Text>
              <Text style={[styles.statValue, { color: colors.gold }]}>
                {formatCurrency(totalAhorrado)}
              </Text>
            </View>
            {(producto?.interes ?? 0) > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Proyección (1 mes)</Text>
                  <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                    {formatCurrency((producto!.montoNeto ?? 0) * (1 + (producto!.interes!) / 100 / 12))}
                  </Text>
                </View>
              </>
            )}
          </View>

          {ahorros.length === 0 ? (
            <Text style={styles.empty}>
              Este producto aún no tiene ahorros asociados. Registra un ahorro y elige este
              producto para verlo aquí.
            </Text>
          ) : (
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {ahorros.map((a) => {
                const isEditing = editingId === a.id;
                return (
                  <View key={a.id} style={styles.row}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {a.metaNombre ? `🎯 ${a.metaNombre}` : 'Ahorro'}
                      </Text>
                      <Text style={styles.rowDate}>{formatDate(a.fechaHora)}</Text>
                    </View>

                    {isEditing ? (
                      <View style={styles.editRow}>
                        <TextInput
                          style={styles.editInput}
                          value={editValue}
                          onChangeText={setEditValue}
                          keyboardType="decimal-pad"
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={() => saveEdit(a)}
                        />
                        <TouchableOpacity onPress={() => saveEdit(a)} hitSlop={8}>
                          <Text style={styles.saveText}>Guardar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cancelEdit} hitSlop={8}>
                          <Text style={styles.cancelText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.rowRight}>
                        <Text style={styles.rowAmount}>{formatCurrency(a.monto)}</Text>
                        <View style={styles.actions}>
                          <TouchableOpacity onPress={() => startEdit(a)} hitSlop={8}>
                            <Text style={styles.editText}>Editar</Text>
                          </TouchableOpacity>
                          <View style={styles.actionDivider} />
                          <TouchableOpacity onPress={() => handleDelete(a)} hitSlop={8}>
                            <Text style={styles.deleteText}>Eliminar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
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
      paddingBottom: 32,
      maxHeight: '85%',
      gap: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    title: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    closeIcon: {
      color: c.textSecondary,
      fontSize: 28,
      lineHeight: 28,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.inputBackground,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    stat: {
      flex: 1,
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: c.border,
      marginHorizontal: 14,
    },
    statLabel: {
      color: c.textSecondary,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    statValue: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: '700',
    },
    empty: {
      color: c.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      paddingVertical: 12,
    },
    list: {
      flexGrow: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    rowInfo: {
      flex: 1,
    },
    rowTitle: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    rowDate: {
      color: c.textSecondary,
      fontSize: 12,
    },
    rowRight: {
      alignItems: 'flex-end',
      gap: 4,
    },
    rowAmount: {
      color: c.gold,
      fontSize: 15,
      fontWeight: '700',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionDivider: {
      width: 1,
      height: 12,
      backgroundColor: c.border,
    },
    editText: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    deleteText: {
      color: c.danger,
      fontSize: 12,
      fontWeight: '600',
    },
    editRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    editInput: {
      backgroundColor: c.appBackground,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      color: c.textPrimary,
      fontSize: 14,
      minWidth: 80,
      textAlign: 'right',
      borderWidth: 1,
      borderColor: c.gold,
    },
    saveText: {
      color: c.gold,
      fontSize: 13,
      fontWeight: '700',
    },
    cancelText: {
      color: c.textSecondary,
      fontSize: 16,
    },
  });
