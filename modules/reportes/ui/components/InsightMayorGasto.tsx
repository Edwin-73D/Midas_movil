import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MidasColors } from '@/constants/theme';
import type { GastoCategoria, Periodo } from '../../domain/report.model';
import { fmtMoney } from '../format';

interface Props {
  gastosCategoria: GastoCategoria[];
  periodo: Periodo;
}

export function InsightMayorGasto({ gastosCategoria, periodo }: Props) {
  const top = gastosCategoria[0];
  if (!top || top.total <= 0) return null;

  const texto =
    periodo.tipo === 'general'
      ? `Históricamente gastas más en ${top.nombre}: ${fmtMoney(top.total)}`
      : `Este mes gastaste más en ${top.nombre}: ${fmtMoney(top.total)}`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <IconSymbol name="sparkles" size={16} color={MidasColors.gold} />
        <Text style={styles.title}>Midas Insight</Text>
      </View>
      <Text style={styles.body}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MidasColors.insightBackground,
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
    color: MidasColors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    color: MidasColors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
});
