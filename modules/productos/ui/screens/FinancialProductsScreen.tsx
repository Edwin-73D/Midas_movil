import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MidasColors } from '@/constants/theme';
import type { Producto } from '@/modules/productos/domain/producto.model';
import ProductoForm from '../components/ProductoForm';
import ProductoItem from '../components/ProductoItem';
import { useProductos } from '../hooks/useProductos';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function FinancialProductsScreen() {
  const insets = useSafeAreaInsets();
  const { productos, total, count, addProducto, editProducto, removeProducto } = useProductos();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (p: Producto) => { setEditing(p); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = (p: Producto) => {
    if (editing) { editProducto(p); } else { addProducto(p); }
    handleClose();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconSlot}>
          <IconSymbol name="chevron.left" size={24} color={MidasColors.textPrimary} />
        </View>
        <Text style={styles.headerTitle}>Financial Products</Text>
        <View style={styles.headerIconSlot}>
          <IconSymbol name="bell.fill" size={22} color={MidasColors.textPrimary} />
        </View>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statAmount}>{formatCurrency(total)}</Text>
          <View style={styles.statLabelRow}>
            <IconSymbol name="chart.bar.fill" size={11} color={MidasColors.textSecondary} />
            <Text style={styles.statLabel}> Total Net Worth</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statAmount}>{count}</Text>
          <View style={styles.statLabelRow}>
            <IconSymbol name="checkmark.circle.fill" size={11} color={MidasColors.gold} />
            <Text style={styles.statLabel}> Active Accounts</Text>
          </View>
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Your Accounts</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={productos}
        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
        renderItem={({ item }) => (
          <ProductoItem
            producto={item}
            onEdit={openEdit}
            onDelete={removeProducto}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <TouchableOpacity style={styles.footerBtn} onPress={openAdd} activeOpacity={0.7}>
            <Text style={styles.footerText}>Tap to add another account manually</Text>
          </TouchableOpacity>
        }
        ListFooterComponent={
          productos.length > 0 ? (
            <TouchableOpacity style={styles.footerBtn} onPress={openAdd} activeOpacity={0.7}>
              <Text style={styles.footerText}>Tap to add another account manually</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ProductoForm
        visible={showForm}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialData={editing ?? undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MidasColors.appBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerIconSlot: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: MidasColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  statsCard: {
    marginHorizontal: 20,
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 16,
  },
  statAmount: {
    color: MidasColors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 5,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    color: MidasColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: MidasColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: MidasColors.gold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#0F0F0F',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  footerBtn: {
    marginTop: 8,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  footerText: {
    color: MidasColors.textSecondary,
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MidasColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: MidasColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: '#0F0F0F',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 34,
  },
});
