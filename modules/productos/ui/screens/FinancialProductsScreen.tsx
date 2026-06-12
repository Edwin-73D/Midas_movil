import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { ProductoAhorrosModal } from '../components/ProductoAhorrosModal';
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
  // Producto cuyo historial de ahorros se está viendo (se re-deriva de la lista
  // para que el saldo del encabezado se refresque al editar/eliminar un ahorro).
  const [historialId, setHistorialId] = useState<number | null>(null);
  const historialProducto = productos.find((p) => p.id === historialId) ?? null;

  // Acceso directo desde el modal de ahorro (?new=1): abre el formulario de alta.
  const params = useLocalSearchParams<{ new?: string }>();
  useEffect(() => {
    if (params.new === '1') {
      setEditing(null);
      setShowForm(true);
      router.setParams({ new: '' });
    }
  }, [params.new]);

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
        keyExtractor={(item) => String(item.id ?? item.nombre ?? '')}
        renderItem={({ item }) => (
          <ProductoItem
            producto={item}
            onEdit={openEdit}
            onDelete={removeProducto}
            onPress={(p) => p.id != null && setHistorialId(p.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aún no tienes productos financieros. Usa el botón + para agregar uno.
          </Text>
        }
      />

      <ProductoForm
        visible={showForm}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialData={editing ?? undefined}
      />

      <ProductoAhorrosModal
        visible={historialProducto != null}
        producto={historialProducto}
        onClose={() => setHistorialId(null)}
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
  emptyText: {
    color: MidasColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
  },
});
