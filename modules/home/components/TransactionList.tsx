import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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


export function TransactionList() {
  const [transactions, setTransactions] = useState<TransaccionRow[]>([]);

  function load() {
    setTransactions(TransaccionRepository.getRecientes(4));
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
            const displayName = transactionTitle(tx);
            const { text, color } = amountDisplay(tx.tipo, tx.valor_transaccion);
            return (
              <View
                key={tx.ID}
                style={[styles.row, index < transactions.length - 1 && styles.rowBorder]}
              >
                <View style={styles.info}>
                  <Text style={styles.txName}>{displayName}</Text>
                  <Text style={styles.txDate}>{formatDateTime(tx.fecha_hora)}</Text>
                </View>

                <Text style={[styles.amount, { color }]}>{text}</Text>
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
