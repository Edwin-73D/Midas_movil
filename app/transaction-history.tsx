import { useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { MidasColors } from '@/constants/theme';
import { amountDisplay, transactionTitle } from '@/modules/transacciones/transaccion.display';
import { TransaccionRepository, TransaccionRow } from '@/modules/transacciones/TransaccionRepository';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

function formatDateTime(raw: string): string {
  const date = new Date(raw.replace(' ', 'T'));
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Section = { title: string; data: TransaccionRow[] };

export default function TransactionHistoryScreen() {
  const [transactions, setTransactions] = useState<TransaccionRow[]>([]);

  function load() {
    setTransactions(TransaccionRepository.getRecientes(1000));
  }

  useEffect(() => {
    load();
    return transactionEvents.subscribe(load);
  }, []);

  // HU-16: los ahorros se muestran en su propia sección.
  const sections = useMemo<Section[]>(() => {
    const ahorros = transactions.filter((t) => t.tipo === 'saving');
    const movimientos = transactions.filter((t) => t.tipo !== 'saving');
    const result: Section[] = [];
    if (movimientos.length) result.push({ title: 'Ingresos y gastos', data: movimientos });
    if (ahorros.length) result.push({ title: 'Ahorros', data: ahorros });
    return result;
  }, [transactions]);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.ID.toString()}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={<Text style={styles.empty}>No hay transacciones aún.</Text>}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const displayName = transactionTitle(item);
          const { text, color } = amountDisplay(item.tipo, item.valor_transaccion);
          // El título ya es la meta (si existe) o el producto; aquí mostramos el
          // producto destino solo cuando el título es la meta, para no repetirlo.
          const savingDestino =
            item.tipo === 'saving' && item.meta_nombre
              ? `→ ${item.producto_nombre ?? 'Producto'}`
              : null;
          return (
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.txName}>{displayName}</Text>
                <Text style={styles.txDate}>{formatDateTime(item.fecha_hora)}</Text>
                {savingDestino && <Text style={styles.txDestino}>{savingDestino}</Text>}
              </View>
              <Text style={[styles.amount, { color }]}>{text}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MidasColors.appBackground,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  empty: {
    color: MidasColors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  sectionHeader: {
    color: MidasColors.textSecondary,
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
    backgroundColor: MidasColors.cardBackground,
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
  txDestino: {
    color: MidasColors.gold,
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
});
