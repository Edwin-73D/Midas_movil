import React, { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { type MidasPalette } from '@/constants/theme';
import type { Producto } from '@/modules/productos/domain/producto.model';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

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

function getIconConfig(tipo: string, entidad: string, gold: string): { icon: 'creditcard.fill' | 'banknote.fill' | 'arrow.up.right' | 'building.columns.fill'; bg: string; color: string } {
  if (tipo === 'debt') return { icon: 'creditcard.fill', bg: '#E5737322', color: '#E57373' };
  const lower = (entidad ?? '').toLowerCase();
  if (lower.includes('saving') || lower.includes('cash') || lower.includes('emergency'))
    return { icon: 'banknote.fill', bg: '#81C78422', color: '#81C784' };
  if (lower.includes('fund') || lower.includes('invest') || lower.includes('vanguard') || lower.includes('index'))
    return { icon: 'arrow.up.right', bg: `${gold}22`, color: gold };
  return { icon: 'building.columns.fill', bg: '#64B5F622', color: '#64B5F6' };
}

interface Props {
  producto: Producto;
  onEdit: (p: Producto) => void;
  onDelete: (id: number) => void;
  onPress?: (p: Producto) => void;
}

export default function ProductoItem({ producto, onEdit, onDelete, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { icon, bg, color } = getIconConfig(producto.tipo, producto.entidadFinanciera ?? '', colors.gold);

  // HU-05: menú contextual de tres puntos (editar / eliminar) anclado al botón.
  const triggerRef = useRef<View>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      setMenuPos({ top: y + h + 4, right: SCREEN_WIDTH - (x + w) });
    });
  };
  const closeMenu = () => setMenuPos(null);

  const handleEdit = () => {
    closeMenu();
    onEdit(producto);
  };

  const handleDelete = () => {
    closeMenu();
    Alert.alert('Eliminar', `¿Eliminar "${producto.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => producto.id && onDelete(producto.id),
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(producto)}
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

      {/* Botón de tres puntos */}
      <TouchableOpacity
        ref={triggerRef}
        onPress={openMenu}
        hitSlop={10}
        style={styles.menuTrigger}
        activeOpacity={0.7}
      >
        <IconSymbol name="ellipsis.vertical" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Menú desplegable */}
      <Modal
        visible={menuPos != null}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <Pressable style={styles.menuOverlay} onPress={closeMenu} />
        {menuPos && (
          <View style={[styles.menu, { top: menuPos.top, right: menuPos.right }]}>
            <TouchableOpacity style={styles.menuOption} onPress={handleEdit} activeOpacity={0.7}>
              <Text style={styles.menuOptionText}>Editar</Text>
            </TouchableOpacity>
            <View style={styles.menuSeparator} />
            <TouchableOpacity style={styles.menuOption} onPress={handleDelete} activeOpacity={0.7}>
              <Text style={[styles.menuOptionText, styles.menuOptionDanger]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </TouchableOpacity>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.cardBackground,
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
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 3,
    },
    date: {
      color: c.textSecondary,
      fontSize: 11,
    },
    right: {
      alignItems: 'flex-end',
      marginLeft: 8,
    },
    amount: {
      color: c.textPrimary,
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
    menuTrigger: {
      marginLeft: 6,
      width: 28,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    menu: {
      position: 'absolute',
      minWidth: 150,
      backgroundColor: c.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
    },
    menuOption: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    menuOptionText: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    menuOptionDanger: {
      color: c.danger,
    },
    menuSeparator: {
      height: 1,
      backgroundColor: c.border,
      marginHorizontal: 8,
    },
  });
