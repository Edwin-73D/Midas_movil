import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MidasColors } from '@/constants/theme';

type BudgetItem = {
  label: string;
  percentage: string;
  color: string;
  spent: number;
  total: number;
  progress: number;
};

const BUDGET_ITEMS: BudgetItem[] = [
  { label: 'Needs',   percentage: '50%', color: MidasColors.needsColor,   spent: 1625, total: 2500, progress: 0.65 },
  { label: 'Wants',   percentage: '30%', color: MidasColors.wantsColor,   spent: 850,  total: 1500, progress: 0.57 },
  { label: 'Savings', percentage: '20%', color: MidasColors.savingsColor, spent: 900,  total: 1000, progress: 0.90 },
];

export function BudgetSection() {
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Budget (50/30/20 Rule)</Text>
        <TouchableOpacity>
          <Text style={styles.seeDetails}>See Details</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {BUDGET_ITEMS.map((item, index) => (
          <View key={item.label} style={[styles.itemWrapper, index < BUDGET_ITEMS.length - 1 && styles.itemBorder]}>
            <View style={styles.itemRow}>
              <View style={styles.labelGroup}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.itemLabel}>{item.label} ({item.percentage})</Text>
              </View>
              <Text style={styles.amounts}>
                ${item.spent.toLocaleString()} / ${item.total.toLocaleString()}
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${item.progress * 100}%` as any, backgroundColor: item.color }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: MidasColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  seeDetails: {
    color: MidasColors.gold,
    fontSize: 13,
  },
  card: {
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  itemWrapper: {
    paddingVertical: 14,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemLabel: {
    color: MidasColors.textPrimary,
    fontSize: 14,
  },
  amounts: {
    color: MidasColors.textSecondary,
    fontSize: 13,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A2A',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});
