import React, { useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';

import type { Meta, MetaFormInput } from '@/modules/metas/domain/meta.model';
import MetaForm from '@/modules/metas/ui/components/MetaForm';
import MetaItem from '@/modules/metas/ui/components/MetaItem';
import { useMetas } from '@/modules/metas/ui/hooks/useMetas';

export default function FinancialGoalsScreen() {
  const { metas, total, count, addMeta, editMeta, removeMeta } = useMetas();

  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (meta: MetaFormInput) => {
    if (editingMeta) {
      editMeta(meta);
    } else {
      addMeta(meta);
    }

    setShowForm(false);
    setEditingMeta(null);
  };

  return (
    <View style={styles.container}>
      <Button
        title="+ Create New Goal"
        onPress={() => {
          setEditingMeta(null);
          setShowForm(true);
        }}
      />

      {showForm && (
        <MetaForm
          onSubmit={handleSubmit}
          initialData={editingMeta || undefined}
        />
      )}

      <View style={styles.summary}>
        <Text style={styles.total}>Total: ${total}</Text>
        <Text style={styles.count}>{count} metas</Text>
      </View>

      <FlatList
        data={metas}
        keyExtractor={(item) =>
          item.id?.toString() || Math.random().toString()
        }
        renderItem={({ item }) => (
          <MetaItem
            meta={item}
            onDelete={removeMeta}
            onEdit={(m) => {
              setEditingMeta(m);
              setShowForm(true);
            }}
          />
        )}
      />
    </View>
  );
}

// ✅ estilos correctamente definidos fuera del componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  summary: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  total: {
    color: '#FFD600',
    fontSize: 18,
  },
  count: {
    color: '#FFF',
  },
});