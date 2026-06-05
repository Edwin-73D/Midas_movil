import { useEffect, useState } from 'react';

import type { Producto } from '@/modules/productos/domain/producto.model';
import {
  getAllProductos,
  getResumenProductos,
  insertProducto,
  updateProducto,
  deleteProducto,
} from '@/modules/productos/data/producto.service';

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

  useEffect(() => { loadData(); }, []);

  const addProducto = (p: Producto) => {
    try { insertProducto(p); loadData(); } catch (e) { console.error('addProducto:', e); }
  };

  const editProducto = (p: Producto) => {
    try { updateProducto(p); loadData(); } catch (e) { console.error('editProducto:', e); }
  };

  const removeProducto = (id: number) => {
    deleteProducto(id);
    loadData();
  };

  return { productos, total, count, addProducto, editProducto, removeProducto };
};
