import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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


export function TransactionList() {
  const [transactions, setTransactions] = useState<TransaccionRow[]>([]);

  function load() {
    setTransactions(TransaccionRepository.getRecientes());
  }

  useEffect(() => {
    load();
    return transactionEvents.subscribe(load);
  }, []);

  return (
    <View>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      <View style={styles.card}>
        {transactions.length === 0 ? (
          <Text style={[styles.txDate, { paddingVertical: 14 }]}>No hay transacciones aún.</Text>
        ) : (
          transactions.map((tx, index) => {
            const displayName = tx.nombre || tx.descripcion || 'Transacción';
            return (
              <View
                key={tx.ID}
                style={[styles.row, index < transactions.length - 1 && styles.rowBorder]}
              >
                <View style={styles.info}>
                  <Text style={styles.txName}>{displayName}</Text>
                  <Text style={styles.txDate}>{formatDateTime(tx.fecha_hora)}</Text>
                </View>

                <Text style={[styles.amount, tx.valor_transaccion >= 0 && styles.positive]}>
                  {formatAmount(tx.valor_transaccion)}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

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
});
