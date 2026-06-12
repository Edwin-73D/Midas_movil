import { StyleSheet, Text, View } from 'react-native';

import { MidasColors } from '@/constants/theme';
import type { Tendencia } from '../../domain/report.model';

const BAR_AREA = 90; // altura máxima de las barras en px

export function TendenciaSection({ tendencia }: { tendencia: Tendencia }) {
  // HU-R05: con un solo mes de datos no hay tendencia que mostrar.
  if (tendencia.mesesConDatos <= 1) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tendencia (últimos 6 meses)</Text>
        <View style={styles.card}>
          <Text style={styles.emptyText}>
            Necesitas datos de al menos dos meses para ver la tendencia.
          </Text>
        </View>
      </View>
    );
  }

  const maxValor = Math.max(
    1,
    ...tendencia.puntos.flatMap((p) => [p.ingresos, p.gastos])
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tendencia (últimos 6 meses)</Text>

      <View style={styles.card}>
        {/* Leyenda */}
        <View style={styles.legend}>
          <LegendItem color={MidasColors.positive} label="Ingresos" />
          <LegendItem color="#E74C3C" label="Gastos" />
        </View>

        {/* Gráfico de barras */}
        <View style={styles.chart}>
          {tendencia.puntos.map((p) => (
            <View key={p.ym} style={styles.column}>
              <View style={styles.bars}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max((p.ingresos / maxValor) * BAR_AREA, p.ingresos > 0 ? 3 : 0),
                      backgroundColor: MidasColors.positive,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max((p.gastos / maxValor) * BAR_AREA, p.gastos > 0 ? 3 : 0),
                      backgroundColor: '#E74C3C',
                    },
                  ]}
                />
              </View>
              <Text style={styles.colLabel}>{p.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
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
    gap: 16,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: {
    color: MidasColors.textSecondary,
    fontSize: 12,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: BAR_AREA + 24,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: BAR_AREA,
  },
  bar: {
    width: 9,
    borderRadius: 2,
  },
  colLabel: {
    color: MidasColors.textSecondary,
    fontSize: 11,
  },
  emptyText: {
    color: MidasColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
