import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categoria = sqliteTable('Categoria', {
  id: integer('ID').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  montoEsperado: real('monto_esperado').default(0),
  montoReal: real('monto_real').default(0),
  porcentaje: real('porcentaje').default(0),
  descripcion: text('descripcion'),
});

export const meta = sqliteTable('Meta', {
  id: integer('ID').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  metaTotal: real('meta_total').notNull(),
  monto: real('monto').default(0),
  porcentajeActual: real('porcentaje_actual').default(0),
  descripcion: text('descripcion'),
  fechaFinalizar: text('fecha_finalizar'),
});

export const transaccion = sqliteTable('transaccion', {
  id: integer('ID').primaryKey({ autoIncrement: true }),
  nombre: text('nombre'),
  valorTransaccion: real('valor_transaccion').notNull(),
  fechaHora: text('fecha_hora').default(sql`CURRENT_TIMESTAMP`),
  categoriaId: integer('categoria_id').references(() => categoria.id),
  metaId: integer('meta_id').references(() => meta.id),
  descripcion: text('descripcion'),
});

export const metaAporte = sqliteTable('meta_aporte', {
  id: integer('ID').primaryKey({ autoIncrement: true }),
  metaId: integer('meta_id')
    .notNull()
    .references(() => meta.id, { onDelete: 'cascade' }),
  monto: real('monto').notNull(),
  fechaHora: text('fecha_hora').default(sql`CURRENT_TIMESTAMP`),
  descripcion: text('descripcion'),
  transaccionId: integer('transaccion_id').references(() => transaccion.id, {
    onDelete: 'set null',
  }),
});

export const balance = sqliteTable('Balance', {
  id: integer('ID').primaryKey({ autoIncrement: true }),
  montoEsperado: real('monto_esperado').default(0),
});

export const metaRelations = relations(meta, ({ many }) => ({
  aportes: many(metaAporte),
  transacciones: many(transaccion),
}));

export const metaAporteRelations = relations(metaAporte, ({ one }) => ({
  meta: one(meta, { fields: [metaAporte.metaId], references: [meta.id] }),
  transaccion: one(transaccion, {
    fields: [metaAporte.transaccionId],
    references: [transaccion.id],
  }),
}));

export const transaccionRelations = relations(transaccion, ({ one }) => ({
  categoria: one(categoria, {
    fields: [transaccion.categoriaId],
    references: [categoria.id],
  }),
  meta: one(meta, { fields: [transaccion.metaId], references: [meta.id] }),
}));
