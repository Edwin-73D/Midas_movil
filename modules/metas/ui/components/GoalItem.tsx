import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Meta } from '../../domain/meta.model';

export default function GoalItem({ meta }: { meta: Meta }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{meta.nombre}</Text>
      <Text style={styles.date}>{meta.fechaFinalizar}</Text>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progress,
            { width: `${meta.porcentajeActual}%` }
          ]}
        />
      </View>

      <Text style={styles.percent}>
        {meta.porcentajeActual.toFixed(1)}%
      </Text>

      <Text style={styles.amount}>
        ${meta.monto} / ${meta.metaTotal}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    color: '#AAAAAA',
    fontSize: 12,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progress: {
    height: '100%',
    backgroundColor: '#FFD600',
    borderRadius: 4,
  },
  percent: {
    color: '#FFD600',
    fontSize: 13,
    marginBottom: 4,
  },
  amount: {
    color: '#CCCCCC',
    fontSize: 13,
  },
});