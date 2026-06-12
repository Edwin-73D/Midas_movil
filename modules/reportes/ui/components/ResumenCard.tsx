import { StyleSheet, Text, View } from 'react-native';

import { MidasColors } from '@/constants/theme';
import type { ResumenFinanciero } from '../../domain/report.model';
import { fmtMoney } from '../format';

export function ResumenCard({ resumen }: { resumen: ResumenFinanciero }) {
  if (!resumen.hayDatos) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>Sin datos en este período</Text>
      </View>
    );
  }

  const balanceColor = resumen.balanceNeto >= 0 ? MidasColors.positive : '#E74C3C';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Cifra label="Ingresos" valor={resumen.ingresos} color={MidasColors.positive} />
        <Cifra label="Gastos" valor={resumen.gastos} color="#E74C3C" />
      </View>
      <View style={styles.row}>
        <Cifra label="Ahorros" valor={resumen.ahorros} color={MidasColors.gold} />
        <Cifra label="Balance neto" valor={resumen.balanceNeto} color={balanceColor} />
      </View>
    </View>
  );
}

function Cifra({ label, valor, color }: { label: string; valor: number; color: string }) {
  return (
    <View style={styles.cifra}>
      <Text style={styles.cifraLabel}>{label}</Text>
      <Text style={[styles.cifraValor, { color }]}>{fmtMoney(valor)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MidasColors.cardBackground,
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
    color: MidasColors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  cifraValor: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    color: MidasColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
