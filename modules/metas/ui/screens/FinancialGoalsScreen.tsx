import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useMetas } from '../hooks/useMetas';
import GoalItem from '../components/GoalItem';

export default function FinancialGoalsScreen() {
  const { metas, total, count, addMeta } = useMetas();

  return (
    <View style={styles.container}>
      <Button title="+ Create New Goal" onPress={addMeta} />

      <View style={styles.summary}>
        <Text style={styles.total}>Total: ${total}</Text>
        <Text style={styles.count}>{count} metas</Text>
      </View>

      <FlatList
        data={metas}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => <GoalItem meta={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16
  },
  summary: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between'
  },
  total: {
    color: '#FFD600',
    fontSize: 18
  },
  count: {
    color: '#FFF'
  }
});