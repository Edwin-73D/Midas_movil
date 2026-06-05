import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';

import type { Meta, MetaFormInput } from '@/modules/metas/domain/meta.model';

export default function MetaForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (meta: MetaFormInput) => void;
  initialData?: Meta;
}) {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [metaTotal, setMetaTotal] = useState(
    initialData?.metaTotal?.toString() || ''
  );
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
  const [fecha, setFecha] = useState(initialData?.fechaFinalizar || '');

  const handleSubmit = () => {
    const trimmedNombre = nombre.trim();
    const trimmedFecha = fecha.trim();
    if (!trimmedNombre || !metaTotal || !trimmedFecha) return;

    const parsedMetaTotal = Number(metaTotal);
    if (Number.isNaN(parsedMetaTotal) || parsedMetaTotal <= 0) return;

    onSubmit({
      id: initialData?.id,
      nombre: trimmedNombre,
      metaTotal: parsedMetaTotal,
      descripcion: descripcion.trim() || undefined,
      fechaFinalizar: trimmedFecha,
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
        style={styles.input}
      />
      <TextInput
        placeholder="Meta Total"
        value={metaTotal}
        onChangeText={setMetaTotal}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="Descripción (opcional)"
        value={descripcion}
        onChangeText={setDescripcion}
        style={styles.input}
      />
      <TextInput
        placeholder="Fecha (YYYY-MM-DD)"
        value={fecha}
        onChangeText={setFecha}
        style={styles.input}
      />

      {initialData && (
        <Text style={styles.accumulated}>
          Ahorro acumulado: ${(initialData.monto ?? 0).toFixed(2)}
        </Text>
      )}

      <Button title="Guardar" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  accumulated: {
    color: '#AAA',
    marginBottom: 12,
    fontSize: 13,
  },
});
