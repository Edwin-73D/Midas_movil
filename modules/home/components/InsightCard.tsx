import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MidasColors } from '@/constants/theme';

type Props = {
  tip: string;
};

export function InsightCard({ tip }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <IconSymbol name="sparkles" size={18} color={MidasColors.gold} />
        <Text style={styles.title}>Midas Insight</Text>
      </View>
      <Text style={styles.body}>{tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MidasColors.insightBackground,
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
    color: MidasColors.gold,
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    color: MidasColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
