import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';

type Props = {
  tip: string;
};

export function InsightCard({ tip }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <IconSymbol name="sparkles" size={18} color={colors.gold} />
        <Text style={styles.title}>Midas Insight</Text>
      </View>
      <Text style={styles.body}>{tip}</Text>
    </View>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.insightBackground,
      borderRadius: 16,
      padding: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    title: {
      color: c.gold,
      fontSize: 15,
      fontWeight: '600',
    },
    body: {
      color: c.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
  });
