import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import {
  getDistribucionPorProducto,
  type DistribucionProducto,
} from '@/modules/finanzas/ahorro.service';
import type { Meta } from '@/modules/metas/domain/meta.model';
import { getProgressColor } from '@/modules/metas/ui/meta.progress';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';

function formatCurrency(value: number): string {
  return '$ ' + Math.round(value).toLocaleString('es-CO');
}

interface Props {
  visible: boolean;
  meta: Meta | null;
  onClose: () => void;
}

export function MetaDetailModal({ visible, meta, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [distribucion, setDistribucion] = useState<DistribucionProducto[]>([]);

  useEffect(() => {
    if (visible && meta?.id != null) {
      setDistribucion(getDistribucionPorProducto(meta.id));
    } else {
      setDistribucion([]);
    }
  }, [visible, meta?.id]);

  if (!meta) return null;

  const progressColor = getProgressColor(meta.porcentajeActual, colors);
  const pct = Math.min(meta.porcentajeActual, 100);
  const totalDistribuido = distribucion.reduce((s, d) => s + d.monto, 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: 36 + insets.bottom }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>{meta.nombre}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeIcon}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {!!meta.descripcion && (
              <Text style={styles.description}>{meta.descripcion}</Text>
            )}

            {/* Resumen */}
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>{t('goals.saved').toUpperCase()}</Text>
                <Text style={[styles.summaryValue, { color: progressColor }]}>
                  {formatCurrency(meta.monto)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summaryLabel}>{t('goals.target').toUpperCase()}</Text>
                <Text style={styles.summaryTotal}>{formatCurrency(meta.metaTotal)}</Text>
              </View>
            </View>

            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: progressColor }]} />
            </View>
            <Text style={[styles.pctText, { color: progressColor }]}>
              {meta.porcentajeActual.toFixed(0)}%
            </Text>

            {/* Distribución por producto */}
            <Text style={styles.sectionTitle}>{t('goals.distribution')}</Text>

            {distribucion.length === 0 ? (
              <Text style={styles.emptyText}>{t('goals.noDistribution')}</Text>
            ) : (
              distribucion.map((d, i) => {
                const porc = totalDistribuido > 0 ? (d.monto / totalDistribuido) * 100 : 0;
                return (
                  <View key={d.productoId ?? `sin-${i}`} style={styles.distRow}>
                    <View style={styles.distInfo}>
                      <Text style={styles.distName} numberOfLines={1}>
                        {d.productoNombre ?? t('goals.noProduct')}
                      </Text>
                      <Text style={styles.distPct}>{porc.toFixed(0)}%</Text>
                    </View>
                    <Text style={styles.distMonto}>{formatCurrency(d.monto)}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    sheetWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 20,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginRight: 12,
    },
    closeIcon: {
      color: c.textSecondary,
      fontSize: 28,
      lineHeight: 28,
    },
    scrollContent: {
      paddingTop: 16,
      gap: 10,
    },
    description: {
      color: c.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    summaryLabel: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
    },
    summaryTotal: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: '600',
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.border,
      overflow: 'hidden',
      marginTop: 4,
    },
    fill: {
      height: 6,
      borderRadius: 3,
    },
    pctText: {
      fontSize: 12,
      fontWeight: '600',
    },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 4,
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 13,
      fontStyle: 'italic',
      paddingVertical: 8,
    },
    distRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    distInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginRight: 10,
    },
    distName: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      flexShrink: 1,
    },
    distPct: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    distMonto: {
      color: c.gold,
      fontSize: 14,
      fontWeight: '700',
    },
  });
