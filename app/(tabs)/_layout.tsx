import { registrarTransaccion } from '@/modules/finanzas/registrar-transaccion.service';
import {
  crearPlantillaRecurrente,
  procesarRecurrentes,
} from '@/modules/finanzas/transaccion-recurrente.service';
import { getMetasSync } from '@/modules/metas/data/meta.service';
import { getProductosSync } from '@/modules/productos/data/producto.service';
import { usePresupuestoViewModel } from '@/modules/presupuesto/PresupuestoViewModel';
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

import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { type MidasPalette } from '@/constants/theme';
import {
  AddTransactionModal,
  type MetaPickerItem,
  type ProductoPickerItem,
  type PresupuestoCategoriaItem,
} from '@/modules/home/components/AddTransactionModal';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [modalVisible, setModalVisible] = useState(false);
  const [metasPicker, setMetasPicker] = useState<MetaPickerItem[]>([]);
  const [productosPicker, setProductosPicker] = useState<ProductoPickerItem[]>([]);
  const [fabOpen, setFabOpen] = useState(false);
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
          tabBarActiveTintColor: colors.gold,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarLabelStyle: { fontSize: 11 },
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom || 8,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.home'),
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="metas"
          options={{
            title: t('nav.goals'),
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="target" color={color} />,
          }}
        />
        {/* HU-02: el presupuesto solo se accede desde el widget de inicio.
            href: null mantiene la ruta viva pero la oculta de la barra. */}
        <Tabs.Screen
          name="presupuesto"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="productos"
          options={{
            title: t('nav.products'),
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="wallet.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="reportes"
          options={{
            title: t('nav.reports'),
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
          }}
        />
      </Tabs>

      {/* Backdrop que cierra el menú */}
      {fabOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeFab} />
      )}

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
              <Text style={styles.menuLabelText}>{t('fab.voice')}</Text>
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
              <Text style={styles.menuLabelText}>{t('fab.receipt')}</Text>
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
              <Text style={styles.menuLabelText}>{t('fab.transaction')}</Text>
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

      <AddTransactionModal
        visible={modalVisible}
        metas={metasPicker}
        productos={productosPicker}
        presupuestoCategorias={(categorias as PresupuestoCategoriaItem[]).filter(c => (c as any).clave !== 'ahorros')}
        onCreateProducto={openCreateProducto}
        onGoToBudget={() => { setModalVisible(false); router.push('/presupuesto'); }}
        onClose={() => setModalVisible(false)}
        onSubmit={async (tx) => {
          const resolvedCategoriaId =
            tx.type === 'expense' && tx.category != null ? tx.category : null;

          await registrarTransaccion(
            {
              type: tx.type,
              amount: tx.amount,
              category: tx.category,
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
                : tx.type === 'saving'
                  ? 'saving'
                  : 'expense';
            crearPlantillaRecurrente({
              nombre: tx.description || null,
              valor_transaccion: tx.amount,
              tipo: tipoRec,
              categoria_id: resolvedCategoriaId,
              meta_id: tx.metaId ?? null,
              producto_financiero_id: tx.productoFinancieroId ?? null,
              descripcion: tx.description || null,
              frecuencia: tx.frecuencia,
              dia_ejecucion: tx.diaEjecucion ?? null,
            });
          }
        }}
      />
    </View>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
    },
    fab: {
      position: 'absolute',
      left: '50%',
      marginLeft: -28,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.gold,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 10,
    },
    fabIcon: {
      color: c.onGold,
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
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 9,
    },
    menuLabel: {
      position: 'absolute',
      right: '50%',
      marginRight: 32,
      backgroundColor: c.cardBackground,
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
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    menuDot: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.gold,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
  });
