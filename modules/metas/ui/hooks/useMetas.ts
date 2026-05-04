import { useEffect, useState } from 'react';

import type { Meta } from '@/modules/metas/domain/meta.model';
import {
  getAllMetas,
  getResumen,
  insertMeta,
  updateMeta,
  deleteMeta,
} from '@/modules/metas/data/meta.service';

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

  // 🔹 CREATE
  const addMeta = (meta: Meta) => {
    try {
      insertMeta(meta);
      loadData();
    } catch (e) {
      console.error('addMeta:', e);
    }
  };

  // 🔹 UPDATE
  const editMeta = (meta: Meta) => {
    try {
      updateMeta(meta);
      loadData();
    } catch (e) {
      console.error('editMeta:', e);
    }
  };

  // 🔹 DELETE
  const removeMeta = (id: number) => {
    deleteMeta(id);
    loadData();
  };

  return {
    metas,
    total,
    count,
    addMeta,
    editMeta,
    removeMeta
  };
};