import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Meta } from '@/modules/metas/domain/meta.model';

export default function MetaItem({
  meta,
  onDelete,
  onEdit,
}: {
  meta: Meta;
  onDelete: (id: number) => void;
  onEdit: (meta: Meta) => void;
}) {
  const handleDelete = () => {
    Alert.alert('Eliminar', '¿Seguro que quieres eliminar esta meta?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', onPress: () => meta.id && onDelete(meta.id) },
    ]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{meta.nombre}</Text>

      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <TouchableOpacity onPress={() => onEdit(meta)}>
          <Text style={{ color: '#FFD600', marginRight: 16 }}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDelete}>
          <Text style={{ color: 'red' }}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
