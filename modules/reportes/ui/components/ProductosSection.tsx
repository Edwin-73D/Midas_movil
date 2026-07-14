import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import type { ProductoReporte } from '../../domain/report.model';
import { fmtMoney } from '../format';

export function ProductosSection({ productos }: { productos: ProductoReporte[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  if (productos.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('reports.financialProducts')}</Text>
      <View style={styles.card}>
        {productos.map((p) => (
          <View key={p.nombre} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.nombre}>{p.nombre}</Text>
              <Text style={styles.saldo}>{fmtMoney(p.saldo)}</Text>
            </View>
            <Text style={styles.detalle}>
              {t('reports.contributed')}: {fmtMoney(p.aportadoPeriodo)}
            </Text>
            <Text style={styles.detalle}>
              {t('reports.estimatedInterest')}: {fmtMoney(p.interesEstimado)}
              {p.sinTasa ? `  ${t('reports.noRate')}` : ''}
            </Text>
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
    row: { gap: 4 },
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
    saldo: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    detalle: {
      color: c.textSecondary,
      fontSize: 12,
    },
  });
