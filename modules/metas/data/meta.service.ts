import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { meta as metaTable } from '../../../db/schema';
import { Meta } from '../domain/meta.model';

export const insertMeta = (metaData: Meta) => {
  const porcentaje = (metaData.monto / metaData.metaTotal) * 100;
  db.insert(metaTable).values({
    nombre: metaData.nombre,
    metaTotal: metaData.metaTotal,
    monto: metaData.monto,
    porcentajeActual: porcentaje,
    descripcion: metaData.descripcion,
    fechaFinalizar: metaData.fechaFinalizar,
  }).run();
};

export const getAllMetas = (callback: (data: Meta[]) => void) => {
  const rows = db.select().from(metaTable).orderBy(desc(metaTable.id)).all();
  callback(rows.map(r => ({
    id: r.id ?? undefined,
    nombre: r.nombre,
    metaTotal: r.metaTotal ?? 0,
    monto: r.monto ?? 0,
    porcentajeActual: r.porcentajeActual ?? 0,
    descripcion: r.descripcion ?? undefined,
    fechaFinalizar: r.fechaFinalizar ?? '',
  })));
};

export const updateMonto = (id: number, monto: number) => {
  db.update(metaTable)
    .set({
      monto,
      porcentajeActual: sql`(${monto} * 100.0) / meta_total`,
    })
    .where(eq(metaTable.id, id))
    .run();
};

export const getResumen = (callback: (total: number, count: number) => void) => {
  const row = db.select({
    total: sql<number>`SUM(${metaTable.monto})`,
    count: sql<number>`COUNT(*)`,
  }).from(metaTable).get();
  callback(row?.total || 0, row?.count ?? 0);
};
