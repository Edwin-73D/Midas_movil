import { StyleSheet, Text, View } from 'react-native';

import { MidasColors } from '@/constants/theme';
import type { ProductoReporte } from '../../domain/report.model';
import { fmtMoney } from '../format';

export function ProductosSection({ productos }: { productos: ProductoReporte[] }) {
  if (productos.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Productos financieros</Text>
      <View style={styles.card}>
        {productos.map((p) => (
          <View key={p.nombre} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.nombre}>{p.nombre}</Text>
              <Text style={styles.saldo}>{fmtMoney(p.saldo)}</Text>
            </View>
            <Text style={styles.detalle}>
              Aportado en período: {fmtMoney(p.aportadoPeriodo)}
            </Text>
            <Text style={styles.detalle}>
              Interés estimado: {fmtMoney(p.interesEstimado)}
              {p.sinTasa ? '  (sin tasa configurada)' : ''}
            </Text>
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
  row: { gap: 4 },
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
  saldo: {
    color: MidasColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  detalle: {
    color: MidasColors.textSecondary,
    fontSize: 12,
  },
});
