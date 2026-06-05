import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { MidasColors } from '@/constants/theme';
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

function formatAmount(amount: number): string {
  const abs = Math.abs(amount).toFixed(2);
  return amount >= 0 ? `+$${abs}` : `-$${abs}`;
}

export default function TransactionHistoryScreen() {
  const [transactions, setTransactions] = useState<TransaccionRow[]>([]);

  function load() {
    setTransactions(TransaccionRepository.getRecientes(1000));
  }

  useEffect(() => {
    load();
    return transactionEvents.subscribe(load);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.ID.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay transacciones aún.</Text>
        }
        renderItem={({ item, index }) => {
          const displayName = item.nombre || item.descripcion || 'Transacción';
          const isLast = index === transactions.length - 1;
          return (
            <View style={[styles.row, !isLast && styles.rowBorder]}>
              <View style={styles.info}>
                <Text style={styles.txName}>{displayName}</Text>
                <Text style={styles.txDate}>{formatDateTime(item.fecha_hora)}</Text>
              </View>
              <Text style={[styles.amount, item.valor_transaccion >= 0 && styles.positive]}>
                {formatAmount(item.valor_transaccion)}
              </Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: MidasColors.cardBackground,
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
});
