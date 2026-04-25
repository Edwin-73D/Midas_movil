import { initDB } from "@/modules/database/database";
import { PresupuestoRepository } from "@/modules/presupuesto/PresupuestoRepository";
import { usePresupuestoViewModel } from "@/modules/presupuesto/PresupuestoViewModel";
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MidasColors } from '@/constants/theme';
import { AddTransactionModal } from '@/modules/home/components/AddTransactionModal';


export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const { agregarGasto, categorias } = usePresupuestoViewModel();

    useEffect(() => {
    initDB();

    PresupuestoRepository.limpiarCategorias();

    }, []);

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
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={async (tx) => {
          if (categorias.length > 0) {
            await agregarGasto(categorias[0].ID, tx.amount);
          }

          setModalVisible(false);

          // 🔥 fuerza re-render cambiando de tab (hack simple)
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
    alignSelf: 'center',
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
