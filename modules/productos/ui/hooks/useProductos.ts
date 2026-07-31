import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import type { Producto } from '@/modules/productos/domain/producto.model';
import {
  CLAVE_LIBRE,
  getAllProductos,
  getResumenProductos,
  insertProducto,
  updateProducto,
  deleteProductoYDesvincular,
} from '@/modules/productos/data/producto.service';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);

  const loadData = () => {
    getAllProductos(setProductos);
    getResumenProductos((t, c) => {
      setTotal(t);
      setCount(c);
    });
  };

  useEffect(() => {
    loadData();
    // Reflejar cambios de saldo al registrar/editar/eliminar ahorros.
    return transactionEvents.subscribe(loadData);
  }, []);

  const addProducto = (p: Producto) => {
    try { insertProducto(p); loadData(); } catch (e) { console.error('addProducto:', e); }
  };

  const editProducto = (p: Producto) => {
    if (p.clave === CLAVE_LIBRE) {
      Alert.alert('Cuenta protegida', 'La cuenta "Libre" no se puede editar.');
      return;
    }
    try { updateProducto(p); loadData(); } catch (e) { console.error('editProducto:', e); }
  };

  const removeProducto = (id: number) => {
    const producto = productos.find((p) => p.id === id);
    if (producto?.clave === CLAVE_LIBRE) {
      Alert.alert('Cuenta protegida', 'La cuenta "Libre" no se puede eliminar.');
      return;
    }
    Alert.alert(
      'Eliminar producto',
      '¿Eliminar este producto? Los ahorros asociados quedarán desvinculados pero no se eliminarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteProductoYDesvincular(id);
            transactionEvents.emit();
            loadData();
          },
        },
      ]
    );
  };

  return { productos, total, count, addProducto, editProducto, removeProducto };
};
