import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import type { ComparativaPresupuesto } from '../../domain/report.model';
import { fmtMoney } from '../format';

export function PresupuestoVsRealSection({ comparativa }: { comparativa: ComparativaPresupuesto }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('reports.budgetVsActual')}</Text>

      {!comparativa.tienePresupuesto ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>{t('reports.noBudget')}</Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/(tabs)/presupuesto')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>{t('reports.createBudget')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          {comparativa.items.map((c) => {
            const excedido = c.diferencia < 0;
            const color = excedido ? colors.danger : colors.positive;
            return (
              <View key={c.nombre} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.nombre}>{c.nombre}</Text>
                  <Text style={[styles.diff, { color }]}>
                    {excedido
                      ? t('reports.exceeded', { amount: fmtMoney(Math.abs(c.diferencia)) })
                      : t('reports.surplus',  { amount: fmtMoney(c.diferencia) })}
                  </Text>
                </View>
                <Text style={styles.detalle}>
                  {t('reports.budgeted')}: {fmtMoney(c.presupuestado)}   ·   {t('reports.spent')}: {fmtMoney(c.gastado)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    section: { gap: 10 },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: '700',
    },
    card: {
      backgroundColor: c.cardBackground,
      borderRadius: 16,
      padding: 16,
      gap: 14,
    },
    row: { gap: 4 },
    rowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    nombre: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    diff: {
      fontSize: 13,
      fontWeight: '600',
    },
    detalle: {
      color: c.textSecondary,
      fontSize: 12,
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    cta: {
      backgroundColor: c.gold,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    ctaText: {
      color: c.onGold,
      fontSize: 14,
      fontWeight: '700',
    },
  });
