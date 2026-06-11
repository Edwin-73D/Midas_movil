import { useState } from 'react';
import { Alert } from 'react-native';

import { editarTransaccion } from '@/modules/finanzas/editar-transaccion.service';
import { eliminarTransaccion } from '@/modules/finanzas/eliminar-transaccion.service';
import { getMetasSync } from '@/modules/metas/data/meta.service';
import { usePresupuestoViewModel } from '@/modules/presupuesto/PresupuestoViewModel';
import { DB_CATEGORY_NAMES } from '@/modules/shared/finance/categories';
import type { ExpenseCategory } from '@/modules/shared/finance/categories';
import type { InitialTransactionData, MetaPickerItem, NewTransaction } from '@/modules/home/components/AddTransactionModal';
import type { TransaccionRow } from '@/modules/transacciones/TransaccionRepository';

type Category = 'Needs' | 'Wants';

export function buildInitialData(tx: TransaccionRow, categorias: any[]): InitialTransactionData {
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

export function useTransactionActions() {
  const [editTx, setEditTx] = useState<TransaccionRow | null>(null);
  const [metasPicker, setMetasPicker] = useState<MetaPickerItem[]>([]);
  const { agregarGasto, categorias, cargarCategorias } = usePresupuestoViewModel();

  function handleEdit(tx: TransaccionRow) {
    if (tx.tipo === 'saving') {
      Alert.alert('Ahorro', 'Para editar este ahorro ve a la pantalla de Productos financieros.');
      return;
    }
    setMetasPicker(
      getMetasSync()
        .filter((m) => m.id != null)
        .map((m) => ({ id: m.id!, nombre: m.nombre }))
    );
    setEditTx(tx);
  }

  function handleDelete(tx: TransaccionRow) {
    Alert.alert(
      'Eliminar transacción',
      '¿Seguro que quieres eliminar esta transacción? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarTransaccion(tx.ID, { onPresupuestoGasto: agregarGasto }),
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

  return {
    editTx,
    setEditTx,
    metasPicker,
    categorias,
    cargarCategorias,
    handleEdit,
    handleDelete,
    handleEditSubmit,
    buildInitialData: (tx: TransaccionRow) => buildInitialData(tx, categorias),
  };
}
