import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { CLAVE_AHORROS, PresupuestoRepository } from '@/modules/presupuesto/PresupuestoRepository';
import { presupuestoEvents } from '@/modules/presupuesto/presupuestoEvents';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

function resolveColor(nombre: string, id: number, c: MidasPalette): string {
  const map: Record<string, string> = {
    needs:            c.needsColor,
    wants:            c.wantsColor,
    savings:          c.savingsColor,
    'savings & debt': c.savingsColor,
  };
  const key = nombre.toLowerCase();
  const FALLBACK = [c.gold, '#3498DB', c.danger, '#1ABC9C', '#9B59B6', '#F39C12', '#16A085'];
  return map[key] ?? FALLBACK[id % FALLBACK.length];
}

export function BudgetSection() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
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
        <Text style={styles.sectionTitle}>{t('budget.title')}</Text>
        <TouchableOpacity
          style={styles.emptyCard}
          onPress={goToPresupuesto}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyText}>{t('budget.empty')}</Text>
          <Text style={styles.emptyAction}>{t('budget.create')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Widget con datos ──────────────────────────────────────────────────────────
  return (
    <TouchableOpacity onPress={goToPresupuesto} activeOpacity={0.95}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t('budget.title')}</Text>
        <Text style={styles.seeDetails}>{t('budget.viewDetails')}</Text>
      </View>

      {/* Indicador de sobrepresupuesto global */}
      {isOver && (
        <View style={styles.overBanner}>
          <Text style={styles.overBannerText}>
            {t('budget.overBudget', { amount: Math.round(Math.abs(disponible)).toLocaleString() })}
          </Text>
        </View>
      )}

      {/* Categorías */}
      <View style={styles.card}>
        {categorias.map((cat, index) => {
          const progreso = cat.monto_esperado > 0
            ? Math.min(cat.monto_real / cat.monto_esperado, 1)
            : 0;
          const catOver  = cat.monto_esperado > 0 && cat.monto_real > cat.monto_esperado && cat.clave !== CLAVE_AHORROS;
          const color    = resolveColor(cat.nombre, cat.ID ?? index, colors);
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
                  <View style={[styles.dot, { backgroundColor: catOver ? colors.danger : color }]} />
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
                      backgroundColor: catOver ? colors.danger : color,
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

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    seeDetails: {
      color: c.gold,
      fontSize: 13,
    },
    // ── Estado vacío ─────────────────────────────────────────────────────────
    emptyCard: {
      backgroundColor: c.cardBackground,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: 'dashed',
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },
    emptyAction: {
      color: c.gold,
      fontSize: 14,
      fontWeight: '700',
    },
    // ── Banner de exceso ──────────────────────────────────────────────────────
    overBanner: {
      backgroundColor: c.danger + '18',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.danger + '40',
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginBottom: 10,
    },
    overBannerText: {
      color: c.danger,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    // ── Categorías ────────────────────────────────────────────────────────────
    card: {
      backgroundColor: c.cardBackground,
      borderRadius: 16,
      paddingHorizontal: 16,
    },
    itemWrapper: {
      paddingVertical: 14,
    },
    itemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: c.border,
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
      color: c.textPrimary,
      fontSize: 14,
      flex: 1,
    },
    amounts: {
      color: c.textSecondary,
      fontSize: 12,
    },
    amountsOver: {
      color: c.danger,
      fontWeight: '600',
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.border,
      overflow: 'hidden',
    },
    fill: {
      height: 6,
      borderRadius: 3,
    },
  });
