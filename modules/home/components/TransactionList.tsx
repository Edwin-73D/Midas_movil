import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { MidasColors } from '@/constants/theme';
import { eliminarTransaccion } from '@/modules/finanzas/eliminar-transaccion.service';
import { editarTransaccion } from '@/modules/finanzas/editar-transaccion.service';
import { getMetasSync } from '@/modules/metas/data/meta.service';
import { usePresupuestoViewModel } from '@/modules/presupuesto/PresupuestoViewModel';
import { DB_CATEGORY_NAMES } from '@/modules/shared/finance/categories';
import type { ExpenseCategory } from '@/modules/shared/finance/categories';
import { amountDisplay, transactionTitle } from '@/modules/transacciones/transaccion.display';
import { TransaccionRepository, type TransaccionRow } from '@/modules/transacciones/TransaccionRepository';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';
import {
  AddTransactionModal,
  type InitialTransactionData,
  type MetaPickerItem,
  type NewTransaction,
} from './AddTransactionModal';

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

type Category = 'Needs' | 'Wants';

function buildInitialData(tx: TransaccionRow, categorias: any[]): InitialTransactionData {
  const isIncome = tx.tipo === 'income';

  let category: Category | null = null;
  if (!isIncome && tx.categoria_id != null) {
    const cat = categorias.find((c: any) => c.ID === tx.categoria_id);
    const nombre = (cat?.nombre ?? '').toLowerCase();
    if (nombre === 'needs') category = 'Needs';
    else if (nombre === 'wants') category = 'Wants';
  }

  return {
    type: isIncome ? 'income' : 'expense',
    amount: String(tx.valor_transaccion),
    category,
    description: tx.descripcion ?? tx.nombre ?? '',
    metaId: tx.meta_id ?? undefined,
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function TransactionList() {
  const [transactions, setTransactions] = useState<TransaccionRow[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editTx, setEditTx] = useState<TransaccionRow | null>(null);
  const [metasPicker, setMetasPicker] = useState<MetaPickerItem[]>([]);

  const { agregarGasto, categorias, cargarCategorias } = usePresupuestoViewModel();

  function load() {
    setTransactions(TransaccionRepository.getRecientes(4));
  }

  useEffect(() => {
    load();
    cargarCategorias();
    return transactionEvents.subscribe(load);
  }, []);

  function openMenu(id: number) {
    setOpenMenuId(id);
  }

  function closeMenu() {
    setOpenMenuId(null);
  }

  function handleEdit(tx: TransaccionRow) {
    if (tx.tipo === 'saving') {
      Alert.alert('Ahorro', 'Para editar este ahorro ve a la pantalla de Productos financieros.');
      closeMenu();
      return;
    }
    closeMenu();
    setMetasPicker(
      getMetasSync()
        .filter((m) => m.id != null)
        .map((m) => ({ id: m.id!, nombre: m.nombre }))
    );
    setEditTx(tx);
  }

  function handleDelete(tx: TransaccionRow) {
    closeMenu();
    Alert.alert(
      'Eliminar transacción',
      '¿Seguro que quieres eliminar esta transacción? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            eliminarTransaccion(tx.ID, { onPresupuestoGasto: agregarGasto });
          },
        },
      ]
    );
  }

  function handleEditSubmit(newTx: NewTransaction) {
    if (!editTx) return;
    editarTransaccion(
      editTx.ID,
      {
        type: newTx.type,
        amount: newTx.amount,
        category: newTx.category as ExpenseCategory | null,
        description: newTx.description,
        metaId: newTx.metaId,
      },
      {
        resolveCategoriaId: (cat) => {
          const dbName = DB_CATEGORY_NAMES[cat];
          const found = (categorias as any[]).find((c) => c.nombre === dbName);
          return found?.ID ?? null;
        },
        onPresupuestoGasto: agregarGasto,
      }
    );
    setEditTx(null);
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
                      onPress={() => handleDelete(tx)}
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
        initialData={editTx ? buildInitialData(editTx, categorias) : undefined}
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
