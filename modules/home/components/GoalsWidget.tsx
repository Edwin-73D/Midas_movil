import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MidasColors } from '@/constants/theme';
import { getMetasSync } from '@/modules/metas/data/meta.service';
import type { Meta } from '@/modules/metas/domain/meta.model';
import { metaEvents } from '@/modules/metas/metaEvents';
import { getProgressColor } from '@/modules/metas/ui/meta.progress';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

/** Monto compacto: $650, $7.8k, $16k. */
function formatCompact(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `$${Math.round(value)}`;
}

type WidgetState = { hasAny: boolean; activas: Meta[] };

function computeState(): WidgetState {
  const all = getMetasSync();
  return {
    hasAny: all.length > 0,
    activas: all
      .filter((m) => m.porcentajeActual < 100)
      .sort((a, b) => b.porcentajeActual - a.porcentajeActual),
  };
}

export function GoalsWidget() {
  const [state, setState] = useState<WidgetState>(computeState);

  useEffect(() => {
    const reload = () => setState(computeState());
    reload();
    // metaEvents: alta/edición/borrado. transactionEvents: un ahorro (HU-16)
    // actualiza el progreso de la meta pero no emite metaEvents.
    const unsubMeta = metaEvents.subscribe(reload);
    const unsubTx = transactionEvents.subscribe(reload);
    return () => {
      unsubMeta();
      unsubTx();
    };
  }, []);

  const goMetas = () => router.push('/metas');
  const { hasAny, activas } = state;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Metas</Text>
        <TouchableOpacity onPress={goMetas} hitSlop={8} activeOpacity={0.7}>
          <Text style={styles.seeAll}>Ver todas ›</Text>
        </TouchableOpacity>
      </View>

      {activas.length === 0 ? (
        <TouchableOpacity style={styles.emptyCard} onPress={goMetas} activeOpacity={0.85}>
          <Text style={styles.emptyTitle}>
            {hasAny ? '¡Completaste tus metas! 🎉' : 'Crea tu primera meta 🎯'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {hasAny
              ? 'Toca para ver tus metas o crear una nueva.'
              : 'Fija un objetivo y sigue tu progreso desde aquí.'}
          </Text>
        </TouchableOpacity>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {activas.map((m) => {
            const pct = Math.min(m.porcentajeActual, 100);
            const color = getProgressColor(m.porcentajeActual);
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.card}
                onPress={goMetas}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {m.nombre}
                  </Text>
                </View>

                <Text style={[styles.pct, { color }]}>{pct.toFixed(0)}%</Text>

                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>

                <Text style={styles.amounts}>
                  {formatCompact(m.monto)} <Text style={styles.amountsTotal}>/ {formatCompact(m.metaTotal)}</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: MidasColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  seeAll: {
    color: MidasColors.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    gap: 12,
    paddingRight: 4,
  },
  card: {
    width: 170,
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    flex: 1,
    color: MidasColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  pct: {
    fontSize: 22,
    fontWeight: '700',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  amounts: {
    color: MidasColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  amountsTotal: {
    color: MidasColors.textSecondary,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  emptyTitle: {
    color: MidasColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: MidasColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
