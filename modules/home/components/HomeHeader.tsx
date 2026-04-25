import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MidasColors } from '@/constants/theme';

export function HomeHeader() {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>AM</Text>
        </View>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.name}>Alex Midas</Text>
        </View>
      </View>
      <IconSymbol name="house.fill" size={26} color={MidasColors.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: MidasColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#0F0F0F',
    fontSize: 16,
    fontWeight: '700',
  },
  greeting: {
    color: MidasColors.textSecondary,
    fontSize: 13,
  },
  name: {
    color: MidasColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
