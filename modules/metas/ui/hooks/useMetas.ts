import { useEffect, useState } from 'react';
import { Meta } from '../../domain/meta.model';
import {
  getAllMetas,
  getResumen,
  insertMeta,
} from '../../data/meta.service';

export const useMetas = () => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);

  const loadData = () => {
    getAllMetas(setMetas);
    getResumen((t, c) => {
      setTotal(t);
      setCount(c);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const addMeta = () => {
    insertMeta({
      nombre: 'Nueva Meta',
      metaTotal: 1000,
      monto: 100,
      porcentajeActual: 0,
      fechaFinalizar: '2026-12-31'
    });

    loadData();
  };

  return {
    metas,
    total,
    count,
    addMeta
  };
};