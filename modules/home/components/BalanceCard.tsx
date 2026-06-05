import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MidasColors } from '@/constants/theme';
import { useBalance } from '@/modules/home/hooks/useBalance';

export function BalanceCard() {
  const { formatted } = useBalance();

  return (
    <View style={styles.card}>
      <View style={styles.decorCircle} />

      <View style={styles.labelRow}>
        <IconSymbol name="dollarsign.circle" size={14} color={MidasColors.textSecondary} />
        <Text style={styles.label}>Balance disponible</Text>
      </View>

      <Text style={styles.amount}>{formatted}</Text>
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
  },
});
