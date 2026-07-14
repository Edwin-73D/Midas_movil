import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type MidasPalette } from '@/constants/theme';
import { useThemedStyles } from '@/modules/shared/theme/ThemeContext';

import { BalanceCard } from './components/BalanceCard';
import { BudgetAlerts } from './components/BudgetAlerts';
import { BudgetSection } from './components/BudgetSection';
import { GoalsWidget } from './components/GoalsWidget';
import { HomeHeader } from './components/HomeHeader';
import { TransactionList } from './components/TransactionList';

export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <BalanceCard />
        <BudgetAlerts />
        <BudgetSection />
        <GoalsWidget />
        <TransactionList />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    scroll: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 110,
      gap: 20,
    },
  });
