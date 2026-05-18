import { registrarTransaccion } from '@/modules/finanzas/registrar-transaccion.service';
import { getMetasSync } from '@/modules/metas/data/meta.service';
import { usePresupuestoViewModel } from '@/modules/presupuesto/PresupuestoViewModel';
import type { ExpenseCategory } from '@/modules/shared/finance/categories';
import { DB_CATEGORY_NAMES } from '@/modules/shared/finance/categories';
import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MidasColors } from '@/constants/theme';
import {
  AddTransactionModal,
  type MetaPickerItem,
} from '@/modules/home/components/AddTransactionModal';

type CategoriaRow = { ID: number; nombre: string };

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [metasPicker, setMetasPicker] = useState<MetaPickerItem[]>([]);

  const { agregarGasto, categorias } = usePresupuestoViewModel();

  function openTransactionModal() {
    setMetasPicker(
      getMetasSync()
        .filter((m) => m.id != null)
        .map((m) => ({ id: m.id!, nombre: m.nombre }))
    );
    setModalVisible(true);
  }

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
      </Tabs>

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 48 }]}
        activeOpacity={0.85}
        onPress={openTransactionModal}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddTransactionModal
        visible={modalVisible}
        metas={metasPicker}
        onClose={() => setModalVisible(false)}
        onSubmit={(tx) => {
          try {
            registrarTransaccion(
              {
                type: tx.type,
                amount: tx.amount,
                category: tx.category as ExpenseCategory | null,
                description: tx.description,
                metaId: tx.metaId,
              },
              {
                resolveCategoriaId: (category) => {
                  const dbName = DB_CATEGORY_NAMES[category];
                  const found = (categorias as CategoriaRow[]).find(
                    (c) => c.nombre === dbName
                  );
                  return found?.ID ?? null;
                },
                onPresupuestoGasto: agregarGasto,
              }
            );
          } catch (e) {
            const message = e instanceof Error ? e.message : 'No se pudo guardar';
            Alert.alert('Error', message);
            return;
          }
          setModalVisible(false);
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
  },
  fabIcon: {
    color: '#0F0F0F',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 34,
  },
});
