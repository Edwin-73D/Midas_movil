import { useCallback, useEffect, useState } from 'react';

import type { Meta, MetaFormInput } from '@/modules/metas/domain/meta.model';
import {
  getAllMetas,
  getResumen,
  insertMeta,
  updateMeta,
  deleteMeta,
} from '@/modules/metas/data/meta.service';
import { metaEvents } from '@/modules/metas/metaEvents';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

export const useMetas = () => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);

  const loadData = useCallback(() => {
    getAllMetas(setMetas);
    getResumen((t, c) => {
      setTotal(t);
      setCount(c);
    });
  }, []);

  useEffect(() => {
    loadData();
    const unsubMeta = metaEvents.subscribe(loadData);
    const unsubTx = transactionEvents.subscribe(loadData);
    return () => {
      unsubMeta();
      unsubTx();
    };
  }, [loadData]);

  const addMeta = (metaInput: MetaFormInput) => {
    try {
      insertMeta(metaInput);
      loadData();
    } catch (e) {
      console.error('addMeta:', e);
    }
  };

  const editMeta = (metaInput: MetaFormInput) => {
    try {
      updateMeta(metaInput);
      loadData();
    } catch (e) {
      console.error('editMeta:', e);
    }
  };

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
    removeMeta,
  };
};
