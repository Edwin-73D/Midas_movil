import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MidasColors } from '@/constants/theme';
import type { ComparativaPresupuesto } from '../../domain/report.model';
import { fmtMoney } from '../format';

export function PresupuestoVsRealSection({ comparativa }: { comparativa: ComparativaPresupuesto }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Presupuesto vs real</Text>

      {!comparativa.tienePresupuesto ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>
            Aún no tienes un presupuesto configurado. Créalo para comparar lo planeado con lo gastado.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/(tabs)/presupuesto')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Crear presupuesto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          {comparativa.items.map((c) => {
            const excedido = c.diferencia < 0;
            const color = excedido ? '#E74C3C' : MidasColors.positive;
            return (
              <View key={c.nombre} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.nombre}>{c.nombre}</Text>
                  <Text style={[styles.diff, { color }]}>
                    {excedido
                      ? `Excedido ${fmtMoney(Math.abs(c.diferencia))}`
                      : `Sobrante ${fmtMoney(c.diferencia)}`}
                  </Text>
                </View>
                <Text style={styles.detalle}>
                  Presupuestado: {fmtMoney(c.presupuestado)}   ·   Gastado: {fmtMoney(c.gastado)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
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
  diff: {
    fontSize: 13,
    fontWeight: '600',
  },
  detalle: {
    color: MidasColors.textSecondary,
    fontSize: 12,
  },
  emptyText: {
    color: MidasColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    backgroundColor: MidasColors.gold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0F0F0F',
    fontSize: 14,
    fontWeight: '700',
  },
});
