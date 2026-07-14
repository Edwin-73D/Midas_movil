import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import type { Meta } from '@/modules/metas/domain/meta.model';
import { MetaDetailModal } from '@/modules/metas/ui/components/MetaDetailModal';
import { getProgressColor } from '@/modules/metas/ui/meta.progress';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';

function formatCurrency(value: number): string {
  return '$ ' + Math.round(value).toLocaleString('es-CO');
}

function formatDate(iso: string): string {
  try {
    const [y, m, d] = iso.split('-');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  } catch {
    return iso;
  }
}

export default function MetaItem({
  meta,
  onDelete,
  onEdit,
}: {
  meta: Meta;
  onDelete: (id: number) => void;
  onEdit: (meta: Meta) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const pct = Math.min(meta.porcentajeActual, 100);
  const progressColor = getProgressColor(meta.porcentajeActual, colors);
  const isComplete = meta.porcentajeActual >= 100;
  const [showDetail, setShowDetail] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      t('goals.deleteTitle'),
      t('goals.deleteConfirm', { name: meta.nombre }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => meta.id && onDelete(meta.id) },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => setShowDetail(true)}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={[styles.dot, { backgroundColor: progressColor }]} />
        <Text style={styles.title} numberOfLines={1}>{meta.nombre}</Text>
        <View style={[styles.badge, { backgroundColor: progressColor + '22', borderColor: progressColor + '55' }]}>
          <Text style={[styles.badgeText, { color: progressColor }]}>
            {isComplete ? '✓' : `${meta.porcentajeActual.toFixed(0)}%`}
          </Text>
        </View>
      </View>

      {/* Description */}
      {!!meta.descripcion && (
        <Text style={styles.description} numberOfLines={2}>{meta.descripcion}</Text>
      )}

      {/* Progress bar */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: progressColor }]} />
      </View>

      {/* Amounts row */}
      <View style={styles.amountsRow}>
        <View>
          <Text style={styles.amountLabel}>{t('goals.saved')}</Text>
          <Text style={[styles.amountValue, { color: progressColor }]}>
            {formatCurrency(meta.monto)}
          </Text>
        </View>
        <View style={styles.amountSeparator} />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amountLabel}>{t('goals.target')}</Text>
          <Text style={styles.amountTotal}>{formatCurrency(meta.metaTotal)}</Text>
        </View>
      </View>

      {/* Footer row */}
      <View style={styles.footerRow}>
        <Text style={styles.dateText}>
          🏁 {formatDate(meta.fechaFinalizar)}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onEdit(meta)}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Text style={styles.editText}>{t('common.edit')}</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDelete}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Text style={styles.deleteText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <MetaDetailModal
        visible={showDetail}
        meta={meta}
        onClose={() => setShowDetail(false)}
      />
    </TouchableOpacity>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      gap: 10,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    title: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    description: {
      color: c.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.border,
      overflow: 'hidden',
    },
    fill: {
      height: 6,
      borderRadius: 3,
    },
    amountsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    amountSeparator: {
      flex: 1,
    },
    amountLabel: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 2,
    },
    amountValue: {
      fontSize: 15,
      fontWeight: '700',
    },
    amountTotal: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 10,
      marginTop: 2,
    },
    dateText: {
      color: c.textSecondary,
      fontSize: 12,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    editText: {
      color: c.gold,
      fontSize: 13,
      fontWeight: '600',
    },
    deleteText: {
      color: c.danger,
      fontSize: 13,
      fontWeight: '600',
    },
    actionDivider: {
      width: 1,
      height: 14,
      backgroundColor: c.border,
    },
  });
