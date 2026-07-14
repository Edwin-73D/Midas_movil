import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { type MidasPalette } from '@/constants/theme';
import { useBalance } from '@/modules/home/hooks/useBalance';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';

export function BalanceCard() {
  const { formatted } = useBalance();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.card}>
      <View style={styles.decorCircle} />

      <View style={styles.labelRow}>
        <IconSymbol name="dollarsign.circle" size={14} color={colors.textSecondary} />
        <Text style={styles.label}>Balance disponible</Text>
      </View>

      <Text style={styles.amount}>{formatted}</Text>
    </View>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.cardBackground,
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
      backgroundColor: c.gold,
      opacity: 0.2,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    label: {
      color: c.textSecondary,
      fontSize: 13,
    },
    amount: {
      color: c.textPrimary,
      fontSize: 36,
      fontWeight: '700',
    },
  });
