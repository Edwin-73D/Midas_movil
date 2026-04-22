import { sql } from 'drizzle-orm';
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
  // SQLite no tiene tipo DATE nativo — se guarda como texto ISO 8601
  fechaFinalizar: text('fecha_finalizar'),
});

export const transaccion = sqliteTable('transaccion', {
  id: integer('ID').primaryKey({ autoIncrement: true }),
  nombre: text('nombre'),
  valorTransaccion: real('valor_transaccion').notNull(),
  // DEFAULT CURRENT_TIMESTAMP delegado a SQLite para consistencia
  fechaHora: text('fecha_hora').default(sql`CURRENT_TIMESTAMP`),
  categoriaId: integer('categoria_id').references(() => categoria.id),
  descripcion: text('descripcion'),
});

export const balance = sqliteTable('Balance', {
  id: integer('ID').primaryKey({ autoIncrement: true }),
  montoEsperado: real('monto_esperado').default(0),
});
