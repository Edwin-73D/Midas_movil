import { StyleSheet, Text, View } from 'react-native';

import { MidasColors } from '@/constants/theme';
import type { AporteMeta } from '../../domain/report.model';
import { fmtMoney } from '../format';

export function AportesMetasSection({ aportes }: { aportes: AporteMeta[] }) {
  if (aportes.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Aportes a metas</Text>
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
            <Text style={styles.progreso}>{a.progresoTotal.toFixed(0)}% del objetivo</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  sectionTitle: {
    color: MidasColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  card: {
    backgroundColor: MidasColors.cardBackground,
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
    color: MidasColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  aporte: {
    color: MidasColors.positive,
    fontSize: 14,
    fontWeight: '600',
  },
  barBackground: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: MidasColors.gold,
  },
  progreso: {
    color: MidasColors.textSecondary,
    fontSize: 12,
    alignSelf: 'flex-end',
  },
});
