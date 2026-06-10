import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { MidasColors } from '@/constants/theme';
import { editarTransaccion } from '@/modules/finanzas/editar-transaccion.service';
import { eliminarTransaccion } from '@/modules/finanzas/eliminar-transaccion.service';
import { getMetasSync } from '@/modules/metas/data/meta.service';
import { usePresupuestoViewModel } from '@/modules/presupuesto/PresupuestoViewModel';
import type { ExpenseCategory } from '@/modules/shared/finance/categories';
import { DB_CATEGORY_NAMES } from '@/modules/shared/finance/categories';
import {
  TransaccionRepository,
  type TransaccionRow,
} from '@/modules/transacciones/TransaccionRepository';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';
import {
  AddTransactionModal,
  type InitialTransactionData,
  type MetaPickerItem,
} from './AddTransactionModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

type Category = 'Needs' | 'Wants' | 'Savings';

/** Nombre de categoría en DB → label del formulario */
const DB_NAME_TO_CATEGORY: Record<string, Category> = {
  Needs: 'Needs',
  Wants: 'Wants',
  'Savings & Debt': 'Savings',
};

type CategoriaRow = { ID: number; nombre: string };

function resolveCategory(
  categoriaId: number | null,
  categorias: CategoriaRow[]
): Category | null {
  if (categoriaId === null) return null;
  const row = categorias.find((c) => c.ID === categoriaId);
  if (!row) return null;
  return DB_NAME_TO_CATEGORY[row.nombre] ?? null;
}

function buildInitialData(
  tx: TransaccionRow,
  categorias: CategoriaRow[]
): InitialTransactionData {
  const category = resolveCategory(tx.categoria_id, categorias);
  const isIncome = tx.categoria_id === null && tx.meta_id === null;
  return {
    type: isIncome ? 'income' : 'expense',
    amount: Math.abs(tx.valor_transaccion).toString(),
    category,
    description: tx.nombre || tx.descripcion || '',
    metaId: tx.meta_id ?? undefined,
  };
}

function formatDateTime(raw: string): string {
  const date = new Date(raw.replace(' ', 'T'));
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount).toFixed(2);
  return amount >= 0 ? `+$${abs}` : `-$${abs}`;
}

// ─── Componente ─────────────────────────────────────────────────────────────

export function TransactionList() {
  const [transactions, setTransactions] = useState<TransaccionRow[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTxId, setEditingTxId] = useState<number | null>(null);
  const [editInitialData, setEditInitialData] = useState<InitialTransactionData | undefined>();
  const [metasPicker, setMetasPicker] = useState<MetaPickerItem[]>([]);

  const { categorias, agregarGasto } = usePresupuestoViewModel();

  function load() {
    setTransactions(TransaccionRepository.getRecientes(4));
  }

  useEffect(() => {
    load();
    return transactionEvents.subscribe(load);
  }, []);

  // ── Menú contextual ────────────────────────────────────────────────────────

  function toggleMenu(id: number) {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }

  function closeMenu() {
    setOpenMenuId(null);
  }

  // ── Editar ─────────────────────────────────────────────────────────────────

  function handleEdit(tx: TransaccionRow) {
    closeMenu();
    const initial = buildInitialData(tx, categorias as CategoriaRow[]);
    const metas = getMetasSync()
      .filter((m) => m.id != null)
      .map((m) => ({ id: m.id!, nombre: m.nombre }));

    setEditingTxId(tx.ID);
    setEditInitialData(initial);
    setMetasPicker(metas);
    setEditModalVisible(true);
  }

  function handleEditSubmit(tx: {
    type: 'income' | 'expense';
    amount: number;
    category: Category | null;
    description: string;
    metaId?: number;
  }) {
    if (editingTxId === null) return;

    editarTransaccion(
      editingTxId,
      {
        type: tx.type,
        amount: tx.amount,
        category: tx.category as ExpenseCategory | null,
        description: tx.description,
        metaId: tx.metaId,
      },
      {
        resolveCategoriaId: (category) => {
          const dbName = DB_CATEGORY_NAMES[category];
          const found = (categorias as CategoriaRow[]).find((c) => c.nombre === dbName);
          return found?.ID ?? null;
        },
        onPresupuestoGasto: agregarGasto,
      }
    );

    setEditModalVisible(false);
    setEditingTxId(null);
    setEditInitialData(undefined);
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────

  function handleDelete(tx: TransaccionRow) {
    closeMenu();
    const displayName = tx.nombre || tx.descripcion || 'esta transacción';

    Alert.alert(
      'Eliminar transacción',
      `¿Seguro que quieres eliminar "${displayName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            eliminarTransaccion(tx.ID, { onPresupuestoGasto: agregarGasto }),
        },
      ]
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View>
      {/* Backdrop que cierra el menú al tocar fuera */}
      {openMenuId !== null && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
      )}

      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      <View style={styles.card}>
        {transactions.length === 0 ? (
          <Text style={[styles.txDate, { paddingVertical: 14 }]}>
            No hay transacciones aún.
          </Text>
        ) : (
          transactions.map((tx, index) => {
            const displayName = tx.nombre || tx.descripcion || 'Transacción';
            const isMenuOpen = openMenuId === tx.ID;

            return (
              <View
                key={tx.ID}
                style={[
                  styles.row,
                  index < transactions.length - 1 && styles.rowBorder,
                ]}
              >
                {/* Info */}
                <View style={styles.info}>
                  <Text style={styles.txName}>{displayName}</Text>
                  <Text style={styles.txDate}>{formatDateTime(tx.fecha_hora)}</Text>
                </View>

                {/* Monto */}
                <Text
                  style={[
                    styles.amount,
                    tx.valor_transaccion >= 0 && styles.positive,
                  ]}
                >
                  {formatAmount(tx.valor_transaccion)}
                </Text>

                {/* Botón ⋮ */}
                <TouchableOpacity
                  onPress={() => toggleMenu(tx.ID)}
                  hitSlop={10}
                  activeOpacity={0.6}
                  style={styles.menuButton}
                >
                  <Text style={styles.menuButtonText}>⋮</Text>
                </TouchableOpacity>

                {/* Menú desplegable */}
                {isMenuOpen && (
                  <View style={styles.menu}>
                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => handleEdit(tx)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.menuOptionEdit}>Editar</Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => handleDelete(tx)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.menuOptionDelete}>Eliminar</Text>
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

      {/* Modal de edición */}
      <AddTransactionModal
        visible={editModalVisible}
        metas={metasPicker}
        initialData={editInitialData}
        onClose={() => {
          setEditModalVisible(false);
          setEditingTxId(null);
          setEditInitialData(undefined);
        }}
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
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
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
    color: MidasColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  positive: {
    color: MidasColors.positive,
  },
  // ── Botón ⋮ ──────────────────────────────────────────────────────────────
  menuButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menuButtonText: {
    color: MidasColors.textSecondary,
    fontSize: 18,
    lineHeight: 20,
    letterSpacing: 0,
  },
  // ── Menú desplegable ──────────────────────────────────────────────────────
  menu: {
    position: 'absolute',
    right: 0,
    top: 42,
    backgroundColor: '#252525',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
    minWidth: 130,
    overflow: 'hidden',
  },
  menuOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuOptionEdit: {
    color: MidasColors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  menuOptionDelete: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
  },
  // ── Ver más ───────────────────────────────────────────────────────────────
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
