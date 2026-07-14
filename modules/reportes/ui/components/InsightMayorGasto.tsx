import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import type { GastoCategoria, Periodo } from '../../domain/report.model';
import { fmtMoney } from '../format';

interface Props {
  gastosCategoria: GastoCategoria[];
  periodo: Periodo;
}

export function InsightMayorGasto({ gastosCategoria, periodo }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const top = gastosCategoria[0];
  if (!top || top.total <= 0) return null;

  const texto =
    periodo.tipo === 'general'
      ? t('reports.insightHistorical', { name: top.nombre, amount: fmtMoney(top.total) })
      : t('reports.insightMonthly',    { name: top.nombre, amount: fmtMoney(top.total) });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <IconSymbol name="sparkles" size={16} color={colors.gold} />
        <Text style={styles.title}>Midas Insight</Text>
      </View>
      <Text style={styles.body}>{texto}</Text>
    </View>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.insightBackground,
      borderRadius: 16,
      padding: 16,
      gap: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      color: c.gold,
      fontSize: 13,
      fontWeight: '700',
    },
    body: {
      color: c.textPrimary,
      fontSize: 15,
      lineHeight: 21,
    },
  });
