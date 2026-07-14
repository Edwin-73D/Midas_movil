import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import { AddTransactionModal } from '@/modules/home/components/AddTransactionModal';
import { amountDisplay, transactionTitle } from '@/modules/transacciones/transaccion.display';
import { TransaccionRepository, type TransaccionRow } from '@/modules/transacciones/TransaccionRepository';
import { useTransactionActions } from '@/modules/transacciones/hooks/useTransactionActions';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

function formatDateTime(raw: string, todayLabel: string, yesterdayLabel: string): string {
  const date = new Date(raw.replace(' ', 'T'));
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `${todayLabel}, ${time}`;
  if (diffDays === 1) return `${yesterdayLabel}, ${time}`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

type Section = { title: string; data: TransaccionRow[] };

export default function TransactionHistoryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [transactions, setTransactions] = useState<TransaccionRow[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const {
    editTx, setEditTx, metasPicker, categorias, cargarCategorias,
    handleEdit: baseHandleEdit, handleDelete, handleEditSubmit, buildInitialData,
  } = useTransactionActions();

  function load() {
    setTransactions(TransaccionRepository.getRecientes(1000));
  }

  useEffect(() => {
    load();
    cargarCategorias();
    return transactionEvents.subscribe(load);
  }, []);

  function openMenu(id: number) { setOpenMenuId(id); }
  function closeMenu() { setOpenMenuId(null); }

  function handleEdit(tx: TransaccionRow) {
    closeMenu();
    baseHandleEdit(tx);
  }

  function handleDeleteWithClose(tx: TransaccionRow) {
    closeMenu();
    handleDelete(tx);
  }

  const sections = useMemo<Section[]>(() => {
    const ahorros = transactions.filter((tx) => tx.tipo === 'saving');
    const movimientos = transactions.filter((tx) => tx.tipo !== 'saving');
    const result: Section[] = [];
    if (movimientos.length) result.push({ title: t('history.sectionMovements'), data: movimientos });
    if (ahorros.length) result.push({ title: t('history.sectionSavings'), data: ahorros });
    return result;
  }, [transactions, t]);

  return (
    <View style={styles.container}>
      {openMenuId !== null && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.ID.toString()}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={<Text style={styles.empty}>{t('history.empty')}</Text>}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const displayName = transactionTitle(item);
          const { text, color } = amountDisplay(item.tipo, item.valor_transaccion, colors);
          const todayLabel = t('common.today');
          const yesterdayLabel = t('common.yesterday');
          const savingDestino =
            item.tipo === 'saving' && item.meta_nombre
              ? `→ ${item.producto_nombre ?? 'Producto'}`
              : null;
          const menuOpen = openMenuId === item.ID;

          return (
            <View
              style={[
                styles.row,
                { overflow: 'visible', zIndex: menuOpen ? 10 : 1 },
              ]}
            >
              <View style={styles.info}>
                <Text style={styles.txName}>{displayName}</Text>
                <Text style={styles.txDate}>{formatDateTime(item.fecha_hora, todayLabel, yesterdayLabel)}</Text>
                {savingDestino && <Text style={styles.txDestino}>{savingDestino}</Text>}
              </View>

              <Text style={[styles.amount, { color }]}>{text}</Text>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => (menuOpen ? closeMenu() : openMenu(item.ID))}
                hitSlop={8}
                activeOpacity={0.7}
              >
                <Text style={styles.menuDots}>⋮</Text>
              </TouchableOpacity>

              {menuOpen && (
                <View style={styles.dropdown}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleEdit(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownText}>{t('common.edit')}</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleDeleteWithClose(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dropdownText, styles.dropdownTextDanger]}>
                      {t('common.delete')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      <AddTransactionModal
        visible={editTx !== null}
        metas={metasPicker}
        presupuestoCategorias={(categorias as any[]).filter((c) => c.clave !== 'ahorros')}
        isEditing
        initialData={editTx ? buildInitialData(editTx) : undefined}
        onClose={() => setEditTx(null)}
        onSubmit={handleEditSubmit}
      />
    </View>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    empty: {
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 40,
      fontSize: 14,
    },
    sectionHeader: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 18,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
      backgroundColor: c.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    info: {
      flex: 1,
    },
    txName: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    txDate: {
      color: c.textSecondary,
      fontSize: 12,
    },
    txDestino: {
      color: c.gold,
      fontSize: 12,
      marginTop: 2,
    },
    amount: {
      fontSize: 14,
      fontWeight: '600',
    },
    menuButton: {
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    menuDots: {
      color: c.textSecondary,
      fontSize: 20,
      lineHeight: 22,
    },
    dropdown: {
      position: 'absolute',
      right: 0,
      top: 36,
      backgroundColor: c.cardBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      minWidth: 130,
      zIndex: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dropdownDivider: {
      height: 1,
      backgroundColor: c.border,
    },
    dropdownText: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '500',
    },
    dropdownTextDanger: {
      color: c.danger,
    },
  });
