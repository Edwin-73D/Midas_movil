import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MidasColors } from '@/constants/theme';

type Transaction = {
  id: string;
  name: string;
  datetime: string;
  amount: number;
  iconName: 'fork.knife' | 'cart.fill' | 'laptopcomputer' | 'play.rectangle.fill';
  iconBg: string;
};

const TRANSACTIONS: Transaction[] = [
  { id: '1', name: 'Chipotle Mexican Grill', datetime: 'Today, 12:45 PM',    amount: -18.45,  iconName: 'fork.knife',          iconBg: '#2A1A0F' },
  { id: '2', name: 'Whole Foods Market',     datetime: 'Yesterday, 6:30 PM', amount: -84.20,  iconName: 'cart.fill',           iconBg: '#0F2A1A' },
  { id: '3', name: 'Upwork Earnings',        datetime: 'Yesterday, 9:00 AM', amount: +350.00, iconName: 'laptopcomputer',      iconBg: '#0F1A2A' },
  { id: '4', name: 'Netflix Subscription',   datetime: 'Nov 15, 2023',       amount: -15.99,  iconName: 'play.rectangle.fill', iconBg: '#2A0F0F' },
];

function formatAmount(amount: number): string {
  const abs = Math.abs(amount).toFixed(2);
  return amount >= 0 ? `+$${abs}` : `-$${abs}`;
}

export function TransactionList() {
  return (
    <View>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      <View style={styles.card}>
        {TRANSACTIONS.map((tx, index) => (
          <View key={tx.id} style={[styles.row, index < TRANSACTIONS.length - 1 && styles.rowBorder]}>
            <View style={[styles.iconBox, { backgroundColor: tx.iconBg }]}>
              <IconSymbol name={tx.iconName} size={22} color={MidasColors.textSecondary} />
            </View>

            <View style={styles.info}>
              <Text style={styles.txName}>{tx.name}</Text>
              <Text style={styles.txDate}>{tx.datetime}</Text>
            </View>

            <Text style={[styles.amount, tx.amount >= 0 && styles.positive]}>
              {formatAmount(tx.amount)}
            </Text>
          </View>
        ))}
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
