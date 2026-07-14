import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import type { ResumenFinanciero } from '../../domain/report.model';
import { fmtMoney } from '../format';

export function ResumenCard({ resumen }: { resumen: ResumenFinanciero }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (!resumen.hayDatos) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>{t('reports.noData')}</Text>
      </View>
    );
  }

  const balanceColor = resumen.balanceNeto >= 0 ? colors.positive : colors.danger;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Cifra label={t('reports.income')} valor={resumen.ingresos} color={colors.positive} />
        <Cifra label={t('reports.expenses')} valor={resumen.gastos} color={colors.danger} />
      </View>
      <View style={styles.row}>
        <Cifra label={t('reports.savings')} valor={resumen.ahorros} color={colors.gold} />
        <Cifra label={t('reports.netBalance')} valor={resumen.balanceNeto} color={balanceColor} />
      </View>
    </View>
  );
}

function Cifra({ label, valor, color }: { label: string; valor: number; color: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.cifra}>
      <Text style={styles.cifraLabel}>{label}</Text>
      <Text style={[styles.cifraValor, { color }]}>{fmtMoney(valor)}</Text>
    </View>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.cardBackground,
      borderRadius: 16,
      padding: 16,
      gap: 16,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    cifra: {
      flex: 1,
      gap: 4,
    },
    cifraLabel: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },
    cifraValor: {
      fontSize: 20,
      fontWeight: '700',
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      paddingVertical: 12,
    },
  });
