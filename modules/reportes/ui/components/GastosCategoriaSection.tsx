import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import type { GastoCategoria } from '../../domain/report.model';
import { colorParaCategoria, fmtMoney } from '../format';

export function GastosCategoriaSection({ gastos }: { gastos: GastoCategoria[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  if (gastos.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('reports.spendingByCategory')}</Text>
      <View style={styles.card}>
        {gastos.map((g, i) => {
          const color = colorParaCategoria(g.nombre, i);
          return (
            <View key={g.nombre} style={styles.row}>
              <View style={styles.rowHeader}>
                <View style={styles.nameRow}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={styles.nombre}>{g.nombre}</Text>
                </View>
                <Text style={styles.monto}>{fmtMoney(g.total)}</Text>
              </View>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.max(g.porcentaje, 2)}%`, backgroundColor: color },
                  ]}
                />
              </View>
              <Text style={styles.porcentaje}>{g.porcentaje.toFixed(1)}%</Text>
            </View>
          );
        })}
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
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    nombre: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    monto: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    barBackground: {
      height: 6,
      backgroundColor: c.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barFill: { height: 6, borderRadius: 3 },
    porcentaje: {
      color: c.textSecondary,
      fontSize: 12,
      alignSelf: 'flex-end',
    },
  });
