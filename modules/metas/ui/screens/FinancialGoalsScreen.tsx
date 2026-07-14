import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import type { Meta, MetaFormInput } from '@/modules/metas/domain/meta.model';
import MetaForm from '@/modules/metas/ui/components/MetaForm';
import MetaItem from '@/modules/metas/ui/components/MetaItem';
import { useMetas } from '@/modules/metas/ui/hooks/useMetas';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';

function EmptyState({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎯</Text>
      <Text style={styles.emptyTitle}>{t('goals.empty')}</Text>
      <Text style={styles.emptySubtitle}>{t('goals.emptySubtitle')}</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onPress} activeOpacity={0.85}>
        <Text style={styles.emptyButtonLabel}>{t('goals.createFirst')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FinancialGoalsScreen() {
  const { t } = useTranslation();
  const { metas, total, totalGoal, count, addMeta, editMeta, removeMeta } = useMetas();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (meta: MetaFormInput) => {
    if (editingMeta) {
      editMeta(meta);
    } else {
      addMeta(meta);
    }
    setShowForm(false);
    setEditingMeta(null);
  };

  const openCreate = () => {
    setEditingMeta(null);
    setShowForm(true);
  };

  const openEdit = (m: Meta) => {
    setEditingMeta(m);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingMeta(null);
  };

  const overallPct = totalGoal > 0 ? Math.min((total / totalGoal) * 100, 100) : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>{t('goals.title')}</Text>
          <Text style={styles.screenSubtitle}>
            {count > 0 ? t('goals.active', { count }) : t('goals.none')}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreate} activeOpacity={0.85}>
          <Text style={styles.addButtonLabel}>{t('goals.new')}</Text>
        </TouchableOpacity>
      </View>

      {/* Summary card (only when there are metas) */}
      {count > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>{t('goals.totalSaved')}</Text>
              <Text style={styles.summaryValue}>
                $ {Math.round(total).toLocaleString('es-CO')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summaryLabel}>{t('goals.overallProgress')}</Text>
              <Text style={[styles.summaryValue, { color: colors.gold }]}>
                {overallPct.toFixed(0)}%
              </Text>
            </View>
          </View>
          <View style={styles.overallTrack}>
            <View
              style={[
                styles.overallFill,
                { width: `${overallPct}%` },
              ]}
            />
          </View>
          <Text style={styles.overallCaption}>
            {t('goals.ofTotal', { amount: Math.round(totalGoal).toLocaleString() })}
          </Text>
        </View>
      )}

      {/* List */}
      {count === 0 ? (
        <EmptyState onPress={openCreate} />
      ) : (
        <FlatList
          data={metas}
          keyExtractor={(item) => String(item.id ?? item.nombre ?? '')}
          renderItem={({ item }) => (
            <MetaItem
              meta={item}
              onDelete={removeMeta}
              onEdit={openEdit}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Form modal */}
      <MetaForm
        visible={showForm}
        onSubmit={handleSubmit}
        onClose={handleClose}
        initialData={editingMeta || undefined}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    screenTitle: {
      color: c.textPrimary,
      fontSize: 26,
      fontWeight: '700',
    },
    screenSubtitle: {
      color: c.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    addButton: {
      backgroundColor: c.gold,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 20,
    },
    addButtonLabel: {
      color: c.onGold,
      fontSize: 14,
      fontWeight: '700',
    },
    summaryCard: {
      backgroundColor: c.cardBackground,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 16,
      padding: 16,
      gap: 10,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    summaryLabel: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 3,
    },
    summaryValue: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    overallTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.border,
      overflow: 'hidden',
    },
    overallFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.gold,
    },
    overallCaption: {
      color: c.textSecondary,
      fontSize: 12,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      gap: 12,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 4,
    },
    emptyTitle: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: '600',
      textAlign: 'center',
    },
    emptySubtitle: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    emptyButton: {
      backgroundColor: c.gold,
      paddingHorizontal: 28,
      paddingVertical: 13,
      borderRadius: 14,
      marginTop: 8,
    },
    emptyButtonLabel: {
      color: c.onGold,
      fontSize: 15,
      fontWeight: '700',
    },
  });
