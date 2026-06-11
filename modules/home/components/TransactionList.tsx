import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { MidasColors } from '@/constants/theme';
import { amountDisplay, transactionTitle } from '@/modules/transacciones/transaccion.display';
import { TransaccionRepository, type TransaccionRow } from '@/modules/transacciones/TransaccionRepository';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';
import { useTransactionActions } from '@/modules/transacciones/hooks/useTransactionActions';
import { AddTransactionModal } from './AddTransactionModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(raw: string): string {
  const date = new Date(raw.replace(' ', 'T'));
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function TransactionList() {
  const [transactions, setTransactions] = useState<TransaccionRow[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const {
    editTx, setEditTx, metasPicker, cargarCategorias,
    handleEdit: baseHandleEdit, handleDelete, handleEditSubmit, buildInitialData,
  } = useTransactionActions();

  function load() {
    setTransactions(TransaccionRepository.getRecientes(4));
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

  return (
    <View style={{ overflow: 'visible' }}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      {openMenuId !== null && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
      )}

      <View style={[styles.card, { overflow: 'visible' }]}>
        {transactions.length === 0 ? (
          <Text style={[styles.txDate, { paddingVertical: 14 }]}>
            No hay transacciones aún.
          </Text>
        ) : (
          transactions.map((tx, index) => {
            const displayName = transactionTitle(tx);
            const { text, color } = amountDisplay(tx.tipo, tx.valor_transaccion);
            const menuOpen = openMenuId === tx.ID;

            return (
              <View
                key={tx.ID}
                style={[
                  styles.row,
                  index < transactions.length - 1 && styles.rowBorder,
                  { overflow: 'visible', zIndex: menuOpen ? 10 : 1 },
                ]}
              >
                <View style={styles.info}>
                  <Text style={styles.txName}>{displayName}</Text>
                  <Text style={styles.txDate}>{formatDateTime(tx.fecha_hora)}</Text>
                </View>

                <Text style={[styles.amount, { color }]}>{text}</Text>

                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => (menuOpen ? closeMenu() : openMenu(tx.ID))}
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuDots}>⋮</Text>
                </TouchableOpacity>

                {menuOpen && (
                  <View style={styles.dropdown}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleEdit(tx)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.dropdownText}>Editar</Text>
                    </TouchableOpacity>
                    <View style={styles.dropdownDivider} />
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleDeleteWithClose(tx)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dropdownText, styles.dropdownTextDanger]}>
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        {transactions.length > 0 && (
          <TouchableOpacity
            style={styles.verMasButton}
            onPress={() => router.push('/transaction-history')}
            activeOpacity={0.7}
          >
            <Text style={styles.verMasLabel}>Ver más</Text>
          </TouchableOpacity>
        )}
      </View>

      <AddTransactionModal
        visible={editTx !== null}
        metas={metasPicker}
        isEditing
        initialData={editTx ? buildInitialData(editTx) : undefined}
        onClose={() => setEditTx(null)}
        onSubmit={handleEditSubmit}
      />
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sectionTitle: {
    color: MidasColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  info: {
    flex: 1,
  },
  txName: {
    color: MidasColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  txDate: {
    color: MidasColors.textSecondary,
    fontSize: 12,
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
    color: MidasColors.textSecondary,
    fontSize: 20,
    lineHeight: 22,
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: 36,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
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
    backgroundColor: '#3A3A3A',
  },
  dropdownText: {
    color: MidasColors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownTextDanger: {
    color: '#E74C3C',
  },
  verMasButton: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingVertical: 14,
    alignItems: 'center',
  },
  verMasLabel: {
    color: MidasColors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
});
