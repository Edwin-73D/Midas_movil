import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MidasColors } from '@/constants/theme';
import type { Producto } from '@/modules/productos/domain/producto.model';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatRelativeDate(dateStr?: string): string {
  if (!dateStr) return 'Last Updated Today';
  try {
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
    const date = new Date(normalized);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffDays <= 0) return 'Last Updated Today';
    if (diffDays === 1) return 'Last Updated Yesterday';
    if (diffDays < 7) return `Last Updated ${diffDays} days ago`;
    if (diffDays < 14) return 'Last Updated 1 week ago';
    return `Last Updated ${Math.floor(diffDays / 7)} weeks ago`;
  } catch {
    return 'Last Updated Today';
  }
}

function getIconConfig(tipo: string, entidad: string): { icon: 'creditcard.fill' | 'banknote.fill' | 'arrow.up.right' | 'building.columns.fill'; bg: string; color: string } {
  if (tipo === 'debt') return { icon: 'creditcard.fill', bg: '#E5737322', color: '#E57373' };
  const lower = (entidad ?? '').toLowerCase();
  if (lower.includes('saving') || lower.includes('cash') || lower.includes('emergency'))
    return { icon: 'banknote.fill', bg: '#81C78422', color: '#81C784' };
  if (lower.includes('fund') || lower.includes('invest') || lower.includes('vanguard') || lower.includes('index'))
    return { icon: 'arrow.up.right', bg: `${MidasColors.gold}22`, color: MidasColors.gold };
  return { icon: 'building.columns.fill', bg: '#64B5F622', color: '#64B5F6' };
}

interface Props {
  producto: Producto;
  onEdit: (p: Producto) => void;
  onDelete: (id: number) => void;
  onPress?: (p: Producto) => void;
}

export default function ProductoItem({ producto, onEdit, onDelete, onPress }: Props) {
  const { icon, bg, color } = getIconConfig(producto.tipo, producto.entidadFinanciera ?? '');

  const handleLongPress = () => {
    Alert.alert(producto.nombre, '¿Qué deseas hacer?', [
      { text: 'Editar', onPress: () => onEdit(producto) },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
        Alert.alert('Eliminar', `¿Eliminar "${producto.nombre}"?`, [
          { text: 'Cancelar' },
          { text: 'Eliminar', style: 'destructive', onPress: () => producto.id && onDelete(producto.id) },
        ]);
      }},
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(producto)}
      onLongPress={handleLongPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: bg }]}>
        <IconSymbol name={icon} size={20} color={color} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{producto.nombre}</Text>
        <Text style={styles.date}>{formatRelativeDate(producto.updatedAt)}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(producto.montoNeto ?? 0)}</Text>
        <View style={[styles.badge, producto.tipo === 'debt' ? styles.badgeDebt : styles.badgeAsset]}>
          <Text style={[styles.badgeText, producto.tipo === 'debt' ? styles.badgeDebtText : styles.badgeAssetText]}>
            {producto.tipo === 'debt' ? 'Debt' : 'Asset'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    color: MidasColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  date: {
    color: MidasColors.textSecondary,
    fontSize: 11,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amount: {
    color: MidasColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeAsset: {
    backgroundColor: '#4CAF5022',
  },
  badgeDebt: {
    backgroundColor: '#E5737322',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeAssetText: {
    color: '#4CAF50',
  },
  badgeDebtText: {
    color: '#E57373',
  },
});
