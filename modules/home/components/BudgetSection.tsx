import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { MidasColors } from '@/constants/theme';
import { PresupuestoRepository } from '@/modules/presupuesto/PresupuestoRepository';
import { presupuestoEvents } from '@/modules/presupuesto/presupuestoEvents';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

const CATEGORY_COLORS: Record<string, string> = {
  needs:            MidasColors.needsColor,
  wants:            MidasColors.wantsColor,
  savings:          MidasColors.savingsColor,
  'savings & debt': MidasColors.savingsColor,
};

const FALLBACK_PALETTE = [
  MidasColors.gold, '#3498DB', '#E74C3C', '#1ABC9C',
  '#9B59B6', '#F39C12', '#16A085',
];

function resolveColor(nombre: string, id: number): string {
  const key = nombre.toLowerCase();
  return CATEGORY_COLORS[key] ?? FALLBACK_PALETTE[id % FALLBACK_PALETTE.length];
}

export function BudgetSection() {
  const [categorias, setCategorias] = useState<any[]>([]);

  const load = useCallback(() => {
    const data = PresupuestoRepository.getCategorias() as any[];
    setCategorias(data);
  }, []);

  useEffect(() => {
    load();
    const unsubTx   = transactionEvents.subscribe(load);
    const unsubPres = presupuestoEvents.subscribe(load);
    return () => {
      unsubTx();
      unsubPres();
    };
  }, [load]);

  const totalPresupuestado = categorias.reduce((s, c) => s + (c.monto_esperado ?? 0), 0);
  const totalGastado       = categorias.reduce((s, c) => s + (c.monto_real     ?? 0), 0);
  const disponible         = totalPresupuestado - totalGastado;
  const isOver             = disponible < 0;

  const goToPresupuesto = () => router.push('/(tabs)/presupuesto');

  // ── Estado vacío ─────────────────────────────────────────────────────────────
  if (categorias.length === 0) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Presupuesto</Text>
        <TouchableOpacity
          style={styles.emptyCard}
          onPress={goToPresupuesto}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyText}>
            Aún no tienes un presupuesto configurado
          </Text>
          <Text style={styles.emptyAction}>Crear Presupuesto →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Widget con datos ──────────────────────────────────────────────────────────
  return (
    <TouchableOpacity onPress={goToPresupuesto} activeOpacity={0.95}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Presupuesto</Text>
        <Text style={styles.seeDetails}>Ver detalle →</Text>
      </View>

      {/* Indicador de sobrepresupuesto global */}
      {isOver && (
        <View style={styles.overBanner}>
          <Text style={styles.overBannerText}>
            ⚠ Presupuesto excedido en ${Math.round(Math.abs(disponible)).toLocaleString('es-CO')}
          </Text>
        </View>
      )}

      {/* Categorías */}
      <View style={styles.card}>
        {categorias.map((cat, index) => {
          const progreso = cat.monto_esperado > 0
            ? Math.min(cat.monto_real / cat.monto_esperado, 1)
            : 0;
          const catOver  = cat.monto_esperado > 0 && cat.monto_real > cat.monto_esperado;
          const color    = resolveColor(cat.nombre, cat.ID ?? index);
          const pctLabel = cat.porcentaje > 0
            ? ` (${Math.round(cat.porcentaje * 10) / 10}%)`
            : '';

          return (
            <View
              key={cat.ID}
              style={[
                styles.itemWrapper,
                index < categorias.length - 1 && styles.itemBorder,
              ]}
            >
              <View style={styles.itemRow}>
                <View style={styles.labelGroup}>
                  <View style={[styles.dot, { backgroundColor: catOver ? '#E74C3C' : color }]} />
                  <Text style={styles.itemLabel}>{cat.nombre}{pctLabel}</Text>
                </View>
                <Text style={[styles.amounts, catOver && styles.amountsOver]}>
                  ${Math.round(cat.monto_real).toLocaleString('es-CO')} /{' '}
                  ${Math.round(cat.monto_esperado).toLocaleString('es-CO')}
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${progreso * 100}%` as any,
                      backgroundColor: catOver ? '#E74C3C' : color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: MidasColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  seeDetails: {
    color: MidasColors.gold,
    fontSize: 13,
  },
  // ── Estado vacío ─────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: MidasColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyAction: {
    color: MidasColors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Banner de exceso ──────────────────────────────────────────────────────
  overBanner: {
    backgroundColor: '#E74C3C18',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E74C3C40',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
  },
  overBannerText: {
    color: '#E74C3C',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  // ── Categorías ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  itemWrapper: {
    paddingVertical: 14,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  itemLabel: {
    color: MidasColors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  amounts: {
    color: MidasColors.textSecondary,
    fontSize: 12,
  },
  amountsOver: {
    color: '#E74C3C',
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});
