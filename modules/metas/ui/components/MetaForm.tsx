import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import type { Meta } from '@/modules/metas/domain/meta.model';

export default function MetaForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (meta: Meta) => void;
  initialData?: Meta;
}) {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [metaTotal, setMetaTotal] = useState(
    initialData?.metaTotal?.toString() || ''
  );
  const [monto, setMonto] = useState(
    initialData?.monto?.toString() || ''
  );
  const [fecha, setFecha] = useState(
    initialData?.fechaFinalizar || ''
  );

  const handleSubmit = () => {
    const trimmedNombre = nombre.trim();
    const trimmedFecha = fecha.trim();
    if (!trimmedNombre || !metaTotal || !monto || !trimmedFecha) return;

    const parsedMetaTotal = Number(metaTotal);
    const parsedMonto = Number(monto);

    if (Number.isNaN(parsedMetaTotal) || parsedMetaTotal <= 0) return;
    if (Number.isNaN(parsedMonto) || parsedMonto < 0) return;

    onSubmit({
      id: initialData?.id,
      nombre: trimmedNombre,
      metaTotal: parsedMetaTotal,
      monto: parsedMonto,
      porcentajeActual: initialData?.porcentajeActual ?? 0,
      fechaFinalizar: trimmedFecha,
    });
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Nombre" value={nombre} onChangeText={setNombre} style={styles.input} />
      <TextInput placeholder="Meta Total" value={metaTotal} onChangeText={setMetaTotal} keyboardType="numeric" style={styles.input} />
      <TextInput placeholder="Monto" value={monto} onChangeText={setMonto} keyboardType="numeric" style={styles.input} />
      <TextInput placeholder="Fecha (YYYY-MM-DD)" value={fecha} onChangeText={setFecha} style={styles.input} />

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
});