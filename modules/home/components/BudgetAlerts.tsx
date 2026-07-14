import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CLAVE_AHORROS, PresupuestoRepository } from '@/modules/presupuesto/PresupuestoRepository';
import { presupuestoEvents } from '@/modules/presupuesto/presupuestoEvents';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

export function BudgetAlerts() {
  const [categorias, setCategorias] = useState<any[]>([]);

  const load = useCallback(() => {
    setCategorias(PresupuestoRepository.getCategorias() as any[]);
  }, []);

  useEffect(() => {
    load();
    const unsubTx   = transactionEvents.subscribe(load);
    const unsubPres = presupuestoEvents.subscribe(load);
    return () => { unsubTx(); unsubPres(); };
  }, [load]);

  const alertas = categorias.filter((c) => {
    if (c.monto_esperado <= 0) return false;
    if (c.clave === CLAVE_AHORROS) return false;
    return c.monto_real / c.monto_esperado >= 0.95;
  });

  if (alertas.length === 0) return null;

  return (
    <View style={styles.container}>
      {alertas.map((c) => {
        const pct = c.monto_real / c.monto_esperado;
        const exceeded = pct >= 1;
        return (
          <View
            key={c.ID}
            style={[styles.chip, exceeded ? styles.chipRed : styles.chipYellow]}
          >
            <Text style={[styles.chipText, exceeded ? styles.chipTextRed : styles.chipTextYellow]}>
              {exceeded ? '⚠ ' : '• '}
              {c.nombre}: {Math.round(pct * 100)}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipYellow: {
    backgroundColor: '#F5A62318',
    borderColor: '#F5A62340',
  },
  chipRed: {
    backgroundColor: '#E74C3C18',
    borderColor: '#E74C3C40',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextYellow: {
    color: '#F5A623',
  },
  chipTextRed: {
    color: '#E74C3C',
  },
});
