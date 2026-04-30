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