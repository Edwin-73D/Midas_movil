import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categoria = sqliteTable('Categoria', {
  id: integer('ID').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  montoEsperado: real('monto_esperado').default(0),
  montoReal: real('monto_real').default(0),
  porcentaje: real('porcentaje').default(0),
  descripcion: text('descripcion'),
  usuarioId: integer('usuario_id'),
  // HU-01: clave estable de la categoría fija de ahorros ('ahorros'); null en el resto.
  clave: text('clave'),
});

export const meta = sqliteTable('Meta', {
  id: integer('ID').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  metaTotal: real('meta_total').notNull(),
  monto: real('monto').default(0),
  porcentajeActual: real('porcentaje_actual').default(0),
  descripcion: text('descripcion'),
  fechaFinalizar: text('fecha_finalizar'),
  usuarioId: integer('usuario_id'),
});

export const transaccion = sqliteTable('transaccion', {
  id: integer('ID').primaryKey({ autoIncrement: true }),
  nombre: text('nombre'),
  valorTransaccion: real('valor_transaccion').notNull(),
  fechaHora: text('fecha_hora').default(sql`CURRENT_TIMESTAMP`),
  categoriaId: integer('categoria_id').references(() => categoria.id),
  metaId: integer('meta_id').references(() => meta.id),
  // HU-16: 'income' | 'expense' | 'saving'
  tipo: text('tipo'),
  productoFinancieroId: integer('producto_financiero_id').references(
    () => productoFinanciero.id
  ),
  descripcion: text('descripcion'),
  usuarioId: integer('usuario_id'),
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

// De HEAD: tabla de productos financieros
export const productoFinanciero = sqliteTable('Producto_financiero', {
  id: integer('ID').primaryKey({ autoIncrement: true }),
  nombre: text('nombre'),
  montoNeto: real('monto_neto'),
  montoTotal: real('monto_total'),
  interes: real('interes'),
  entidadFinanciera: text('entidad_financiera'),
  tipo: text('tipo'), // 'asset' | 'debt'
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  metaId: integer('meta_id').unique().references(() => meta.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  usuarioId: integer('usuario_id'),
});

// De incoming: relaciones Drizzle
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
  productoFinanciero: one(productoFinanciero, {
    fields: [transaccion.productoFinancieroId],
    references: [productoFinanciero.id],
  }),
}));
