import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MidasColors } from '@/constants/theme';

export function BalanceCard() {
  return (
    <View style={styles.card}>
      <View style={styles.decorCircle} />

      <View style={styles.labelRow}>
        <IconSymbol name="dollarsign.circle" size={14} color={MidasColors.textSecondary} />
        <Text style={styles.label}>Total Balance</Text>
      </View>

      <Text style={styles.amount}>$12,450.00</Text>

      <View style={styles.badge}>
        <IconSymbol name="arrow.up.right" size={12} color={MidasColors.positive} />
        <Text style={styles.badgeText}>+5.2%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: MidasColors.gold,
    opacity: 0.2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    color: MidasColors.textSecondary,
    fontSize: 13,
  },
  amount: {
    color: MidasColors.textPrimary,
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#1E3A1E',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: MidasColors.positive,
    fontSize: 13,
    fontWeight: '600',
  },
});
