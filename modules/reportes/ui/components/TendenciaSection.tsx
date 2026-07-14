import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import type { Tendencia } from '../../domain/report.model';

const BAR_AREA = 90; // altura máxima de las barras en px

export function TendenciaSection({ tendencia }: { tendencia: Tendencia }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // HU-R05: con un solo mes de datos no hay tendencia que mostrar.
  if (tendencia.mesesConDatos <= 1) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('reports.trend')}</Text>
        <View style={styles.card}>
          <Text style={styles.emptyText}>{t('reports.trendMinData')}</Text>
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
      <Text style={styles.sectionTitle}>{t('reports.trend')}</Text>

      <View style={styles.card}>
        {/* Leyenda */}
        <View style={styles.legend}>
          <LegendItem styles={styles} color={colors.positive} label={t('reports.income')} />
          <LegendItem styles={styles} color={colors.danger} label={t('reports.expenses')} />
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
                      backgroundColor: colors.positive,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max((p.gastos / maxValor) * BAR_AREA, p.gastos > 0 ? 3 : 0),
                      backgroundColor: colors.danger,
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

function LegendItem({
  color,
  label,
  styles,
}: {
  color: string;
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
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
      color: c.textSecondary,
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
      color: c.textSecondary,
      fontSize: 11,
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
  });
