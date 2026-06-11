import { registrarTransaccion } from '@/modules/finanzas/registrar-transaccion.service';
import {
  crearPlantillaRecurrente,
  procesarRecurrentes,
} from '@/modules/finanzas/transaccion-recurrente.service';
import { getMetasSync } from '@/modules/metas/data/meta.service';
import { getProductosSync } from '@/modules/productos/data/producto.service';
import { usePresupuestoViewModel } from '@/modules/presupuesto/PresupuestoViewModel';
import type { ExpenseCategory } from '@/modules/shared/finance/categories';
import { DB_CATEGORY_NAMES } from '@/modules/shared/finance/categories';
import { Tabs, router, useSegments } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MidasColors } from '@/constants/theme';
import {
  AddTransactionModal,
  type MetaPickerItem,
  type ProductoPickerItem,
} from '@/modules/home/components/AddTransactionModal';

type CategoriaRow = { ID: number; nombre: string };

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const [modalVisible, setModalVisible] = useState(false);
  const [metasPicker, setMetasPicker] = useState<MetaPickerItem[]>([]);
  const [productosPicker, setProductosPicker] = useState<ProductoPickerItem[]>([]);
  const [fabOpen, setFabOpen] = useState(false);
  const isProductosTab = segments[segments.length - 1] === 'productos';

  const menuAnim = useRef(new Animated.Value(0)).current;

  const { agregarGasto, categorias } = usePresupuestoViewModel();

  // Al montar el layout (cada apertura de la app), genera las transacciones vencidas
  useEffect(() => {
    procesarRecurrentes({ onPresupuestoGasto: agregarGasto });
  }, []);

  function toggleFab() {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(menuAnim, { toValue, useNativeDriver: true, friction: 7 }).start();
    setFabOpen(!fabOpen);
  }

  function closeFab() {
    Animated.spring(menuAnim, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
    setFabOpen(false);
  }

  function openTransactionModal() {
    closeFab();
    setMetasPicker(
      getMetasSync()
        .filter((m) => m.id != null)
        .map((m) => ({ id: m.id!, nombre: m.nombre }))
    );
    setProductosPicker(
      getProductosSync()
        .filter((p) => p.id != null)
        .map((p) => ({ id: p.id!, nombre: p.nombre ?? 'Producto' }))
    );
    setModalVisible(true);
  }

  function openCreateProducto() {
    router.push('/productos?new=1');
  }

  function openScanner() {
    closeFab();
    router.push('/factura-scanner');
  }

  function openVoz() {
    closeFab();
    router.push('/voz-recorder');
  }

  const menuItemStyle = (offsetY: number) => ({
    opacity: menuAnim,
    transform: [
      {
        translateY: menuAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [offsetY, 0],
        }),
      },
    ],
  });

  const fabBottom = insets.bottom + 48;

  return (
    <View style={styles.wrapper}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: MidasColors.gold,
          tabBarInactiveTintColor: MidasColors.tabBarInactive,
          tabBarLabelStyle: { fontSize: 11 },
          tabBarStyle: {
            backgroundColor: MidasColors.tabBarBackground,
            borderTopColor: '#222222',
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom || 8,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="metas"
          options={{
            title: 'Metas',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="target" color={color} />,
          }}
        />
        <Tabs.Screen
          name="presupuesto"
          options={{
            title: 'Presupuesto',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="creditcard.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="productos"
          options={{
            title: 'Productos',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="wallet.fill" color={color} />,
          }}
        />
      </Tabs>

      {/* Backdrop que cierra el menú */}
      {fabOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeFab} />
      )}

      {!isProductosTab && (
        <>
          {/* Opción 3: Registrar por voz */}
          <Animated.View
            style={[
              styles.menuItem,
              { bottom: fabBottom + 188 },
              menuItemStyle(60),
            ]}
            pointerEvents={fabOpen ? 'auto' : 'none'}
          >
            <TouchableOpacity style={styles.menuLabel} onPress={openVoz} activeOpacity={0.8}>
              <Text style={styles.menuLabelText}>Registrar por voz</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuDot} onPress={openVoz} activeOpacity={0.8}>
              <IconSymbol name="mic.fill" size={22} color="#0F0F0F" />
            </TouchableOpacity>
          </Animated.View>

          {/* Opción 2: Escanear factura */}
          <Animated.View
            style={[
              styles.menuItem,
              { bottom: fabBottom + 130 },
              menuItemStyle(40),
            ]}
            pointerEvents={fabOpen ? 'auto' : 'none'}
          >
            <TouchableOpacity style={styles.menuLabel} onPress={openScanner} activeOpacity={0.8}>
              <Text style={styles.menuLabelText}>Escanear factura</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuDot} onPress={openScanner} activeOpacity={0.8}>
              <IconSymbol name="camera.fill" size={22} color="#0F0F0F" />
            </TouchableOpacity>
          </Animated.View>

          {/* Opción 1: Nueva transacción */}
          <Animated.View
            style={[
              styles.menuItem,
              { bottom: fabBottom + 72 },
              menuItemStyle(20),
            ]}
            pointerEvents={fabOpen ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={styles.menuLabel}
              onPress={openTransactionModal}
              activeOpacity={0.8}
            >
              <Text style={styles.menuLabelText}>Nueva transacción</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuDot}
              onPress={openTransactionModal}
              activeOpacity={0.8}
            >
              <IconSymbol name="plus" size={20} color="#0F0F0F" />
            </TouchableOpacity>
          </Animated.View>

          {/* FAB principal */}
          <TouchableOpacity
            style={[styles.fab, { bottom: fabBottom }]}
            activeOpacity={0.85}
            onPress={toggleFab}
          >
            <Text style={[styles.fabIcon, fabOpen && styles.fabIconOpen]}>
              {fabOpen ? '×' : '+'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <AddTransactionModal
        visible={modalVisible}
        metas={metasPicker}
        productos={productosPicker}
        onCreateProducto={openCreateProducto}
        onClose={() => setModalVisible(false)}
        onSubmit={(tx) => {
          // Resolver categoriaId aquí para reutilizarlo en la plantilla recurrente
          const resolvedCategoriaId =
            tx.type === 'expense' && tx.category
              ? ((categorias as CategoriaRow[]).find(
                  (c) => c.nombre === DB_CATEGORY_NAMES[tx.category as ExpenseCategory]
                )?.ID ?? null)
              : null;

          registrarTransaccion(
            {
              type: tx.type,
              amount: tx.amount,
              category: tx.category as ExpenseCategory | null,
              description: tx.description,
              metaId: tx.metaId,
              productoFinancieroId: tx.productoFinancieroId,
            },
            {
              resolveCategoriaId: () => resolvedCategoriaId,
              onPresupuestoGasto: agregarGasto,
            }
          );

          // Si el usuario marcó la transacción como recurrente, guardar la plantilla
          if (tx.recurrente && tx.frecuencia) {
            const tipoRec =
              tx.type === 'income'
                ? 'income'
                : tx.metaId
                  ? 'saving'
                  : 'expense';
            crearPlantillaRecurrente({
              nombre: tx.description || null,
              valor_transaccion: tx.amount,
              tipo: tipoRec,
              categoria_id: resolvedCategoriaId,
              meta_id: tx.metaId ?? null,
              descripcion: tx.description || null,
              frecuencia: tx.frecuencia,
            });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 24,
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
    zIndex: 10,
  },
  fabIcon: {
    color: '#0F0F0F',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 34,
  },
  fabIconOpen: {
    fontSize: 36,
    lineHeight: 36,
  },
  menuItem: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 9,
  },
  menuLabel: {
    backgroundColor: MidasColors.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  menuLabelText: {
    color: MidasColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  menuDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: MidasColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
