import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { meta } from '@/db/schema';
import type { Meta } from '@/modules/metas/domain/meta.model';

function assertValidMetaForWrite(metaData: Meta): void {
  if (!metaData.nombre?.trim()) {
    throw new Error('Invalid nombre');
  }
  const { metaTotal, monto, fechaFinalizar } = metaData;
  if (
    metaTotal == null ||
    typeof metaTotal !== 'number' ||
    !Number.isFinite(metaTotal) ||
    metaTotal <= 0
  ) {
    throw new Error('Invalid metaTotal');
  }
  if (
    monto == null ||
    typeof monto !== 'number' ||
    !Number.isFinite(monto) ||
    monto < 0
  ) {
    throw new Error('Invalid monto');
  }
  if (!fechaFinalizar?.trim()) {
    throw new Error('Invalid fechaFinalizar');
  }
}

// 🔹 GET ALL
export const getAllMetas = (setMetas: (metas: Meta[]) => void) => {
  if (!db) {
    setMetas([]);
    return;
  }
  const result = db.select().from(meta).all();
  setMetas(result as Meta[]);
};

// 🔹 RESUMEN
export const getResumen = (callback: (total: number, count: number) => void) => {
  if (!db) {
    callback(0, 0);
    return;
  }
  const metas = db.select().from(meta).all();

  const total = metas.reduce((acc, m) => acc + m.metaTotal, 0);
  const count = metas.length;

  callback(total, count);
};

// 🔹 CREATE
export const insertMeta = (metaData: Meta) => {
  if (!db) return;

  assertValidMetaForWrite(metaData);

  const porcentaje = (metaData.monto / metaData.metaTotal) * 100;

  db.insert(meta)
    .values({
      nombre: metaData.nombre,
      metaTotal: metaData.metaTotal,
      monto: metaData.monto,
      porcentajeActual: porcentaje,
      descripcion: metaData.descripcion,
      fechaFinalizar: metaData.fechaFinalizar,
    })
    .run();
};

// 🔹 UPDATE
export const updateMeta = (metaData: Meta) => {
  if (!db || !metaData.id) return;

  assertValidMetaForWrite(metaData);

  const porcentaje = (metaData.monto / metaData.metaTotal) * 100;

  db.update(meta)
    .set({
      nombre: metaData.nombre,
      metaTotal: metaData.metaTotal,
      monto: metaData.monto,
      porcentajeActual: porcentaje,
      descripcion: metaData.descripcion,
      fechaFinalizar: metaData.fechaFinalizar,
    })
    .where(eq(meta.id, metaData.id))
    .run();
};

// 🔹 DELETE
export const deleteMeta = (id: number) => {
  if (!db) return;

  db.delete(meta)
    .where(eq(meta.id, id))
    .run();
};
