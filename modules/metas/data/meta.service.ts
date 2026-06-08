import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import expo from '@/db/client';
import { meta, metaAporte, transaccion } from '@/db/schema';
import type { Meta, MetaFormInput } from '@/modules/metas/domain/meta.model';
import { calcPorcentajeActual } from '@/modules/metas/domain/meta.utils';
import { metaEvents } from '@/modules/metas/metaEvents';

function mapRowToMeta(row: typeof meta.$inferSelect): Meta {
  const monto = row.monto ?? 0;
  const metaTotal = row.metaTotal;
  return {
    id: row.id,
    nombre: row.nombre,
    metaTotal,
    monto,
    porcentajeActual: calcPorcentajeActual(monto, metaTotal),
    descripcion: row.descripcion ?? undefined,
    fechaFinalizar: row.fechaFinalizar ?? '',
  };
}

function assertValidMetaFormInput(data: MetaFormInput): void {
  if (!data.nombre?.trim()) throw new Error('Invalid nombre');
  if (
    data.metaTotal == null ||
    !Number.isFinite(data.metaTotal) ||
    data.metaTotal <= 0
  ) {
    throw new Error('Invalid metaTotal');
  }
  if (!data.fechaFinalizar?.trim()) throw new Error('Invalid fechaFinalizar');
}

export const getAllMetas = (setMetas: (metas: Meta[]) => void) => {
  if (!db) {
    setMetas([]);
    return;
  }
  const result = db.select().from(meta).all();
  setMetas(result.map(mapRowToMeta));
};

export const getMetasSync = (): Meta[] => {
  if (!db) return [];
  return db.select().from(meta).all().map(mapRowToMeta);
};

export const getResumen = (callback: (total: number, count: number) => void) => {
  if (!db) {
    callback(0, 0);
    return;
  }
  const metas = db.select().from(meta).all();
  const total = metas.reduce((acc, m) => acc + m.metaTotal, 0);
  callback(total, metas.length);
};

export const insertMeta = (metaData: MetaFormInput) => {
  if (!db) return;
  assertValidMetaFormInput(metaData);

  db.insert(meta)
    .values({
      nombre: metaData.nombre.trim(),
      metaTotal: metaData.metaTotal,
      monto: 0,
      descripcion: metaData.descripcion,
      fechaFinalizar: metaData.fechaFinalizar,
    })
    .run();

  metaEvents.emit();
};

export const updateMeta = (metaData: MetaFormInput) => {
  if (!db || !metaData.id) return;
  assertValidMetaFormInput(metaData);

  const existing = db.select().from(meta).where(eq(meta.id, metaData.id)).get();
  if (!existing) return;

  db.update(meta)
    .set({
      nombre: metaData.nombre.trim(),
      metaTotal: metaData.metaTotal,
      descripcion: metaData.descripcion,
      fechaFinalizar: metaData.fechaFinalizar,
    })
    .where(eq(meta.id, metaData.id))
    .run();

  metaEvents.emit();
};

export const deleteMeta = (id: number) => {
  if (!db) return;

  // transaccion.meta_id no tiene onDelete definido en el esquema, por lo que
  // SQLite rechaza el DELETE con FOREIGN KEY constraint failed.
  // Se anula manualmente el vínculo antes de eliminar la meta (equivale a onDelete: 'set null').
  // meta_aporte.meta_id sí tiene onDelete: 'cascade' y se elimina automáticamente.
  expo.withTransactionSync(() => {
    db!.update(transaccion).set({ metaId: null }).where(eq(transaccion.metaId, id)).run();
    db!.delete(meta).where(eq(meta.id, id)).run();
  });

  metaEvents.emit();
};

type AddMontoParams = {
  metaId: number;
  amount: number;
  descripcion?: string;
  transaccionId?: number;
};

/** Aporte manual (fuera del flujo de transacciones). */
export function addMontoToMeta(params: AddMontoParams): void {
  if (!db || params.amount <= 0) return;

  expo.withTransactionSync(() => {
    addMontoToMetaInternal(params);
  });

  metaEvents.emit();
}

/** Solo dentro de withTransactionSync (registrar-transaccion). */
export function addMontoToMetaInternal(params: AddMontoParams): void {
  if (!db) return;

  const current = db.select().from(meta).where(eq(meta.id, params.metaId)).get();
  if (!current) throw new Error('Meta no encontrada');

  db.insert(metaAporte)
    .values({
      metaId: params.metaId,
      monto: params.amount,
      descripcion: params.descripcion,
      transaccionId: params.transaccionId ?? null,
    })
    .run();

  const newMonto = (current.monto ?? 0) + params.amount;

  db.update(meta)
    .set({ monto: newMonto })
    .where(eq(meta.id, params.metaId))
    .run();
}
