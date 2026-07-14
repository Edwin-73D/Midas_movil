import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import type { AporteMeta } from '../../domain/report.model';
import { fmtMoney } from '../format';

export function AportesMetasSection({ aportes }: { aportes: AporteMeta[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  if (aportes.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('reports.goalsContributions')}</Text>
      <View style={styles.card}>
        {aportes.map((a) => (
          <View key={a.nombre} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.nombre}>{a.nombre}</Text>
              <Text style={styles.aporte}>+{fmtMoney(a.aportePeriodo)}</Text>
            </View>
            <View style={styles.barBackground}>
              <View style={[styles.barFill, { width: `${Math.min(a.progresoTotal, 100)}%` }]} />
            </View>
            <Text style={styles.progreso}>{a.progresoTotal.toFixed(0)}{t('reports.ofGoal')}</Text>
          </View>
        ))}
      </View>
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
    row: { gap: 6 },
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
    aporte: {
      color: c.positive,
      fontSize: 14,
      fontWeight: '600',
    },
    barBackground: {
      height: 6,
      backgroundColor: c.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.gold,
    },
    progreso: {
      color: c.textSecondary,
      fontSize: 12,
      alignSelf: 'flex-end',
    },
  });
