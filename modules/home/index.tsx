import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MidasColors } from '@/constants/theme';

import { BalanceCard } from './components/BalanceCard';
import { BudgetSection } from './components/BudgetSection';
import { HomeHeader } from './components/HomeHeader';
import { InsightCard } from './components/InsightCard';
import { TransactionList } from './components/TransactionList';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <BalanceCard />
        <InsightCard tip="You're spending 5% more on dining this month compared to your average. Consider cooking at home this weekend!" />
        <BudgetSection />
        <TransactionList />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: MidasColors.appBackground,
  },
  scroll: {
    flex: 1,
    backgroundColor: MidasColors.appBackground,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 20,
  },
});
