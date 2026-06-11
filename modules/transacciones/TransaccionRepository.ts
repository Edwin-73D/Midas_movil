import sqlite from '@/db/client';
import { getCurrentUserId } from '@/modules/auth/data/session';

export type TransaccionTipo = 'income' | 'expense' | 'saving';

export type TransaccionRow = {
  ID: number;
  nombre: string | null;
  valor_transaccion: number;
  fecha_hora: string;
  categoria_id: number | null;
  meta_id: number | null;
  producto_financiero_id: number | null;
  tipo: TransaccionTipo | null;
  descripcion: string | null;
  meta_nombre: string | null;
  producto_nombre: string | null;
};

export const TransaccionRepository = {
  insertar: (t: {
    nombre: string;
    valor_transaccion: number;
    categoria_id: number | null;
    descripcion: string;
  }) => {
    try {
      sqlite.runSync(
        `INSERT INTO transaccion (nombre, valor_transaccion, categoria_id, descripcion)
         VALUES (?, ?, ?, ?)`,
        [t.nombre, t.valor_transaccion, t.categoria_id, t.descripcion]
      );
    } catch (error) {
      console.log("Error insertando transaccion:", error);
    }
  },

  getById: (id: number): TransaccionRow | null => {
    try {
      return sqlite.getFirstSync(
        'SELECT * FROM transaccion WHERE ID = ?',
        [id]
      ) as TransaccionRow | null;
    } catch (error) {
      console.log('Error obteniendo transaccion por id:', error);
      return null;
    }
  },

  getRecientes: (limit = 20): TransaccionRow[] => {
    try {
      const uid = getCurrentUserId();
      return sqlite.getAllSync(
        `SELECT
           t.ID,
           t.nombre,
           t.valor_transaccion,
           t.fecha_hora,
           t.categoria_id,
           t.meta_id,
           t.producto_financiero_id,
           t.tipo,
           t.descripcion,
           m.nombre AS meta_nombre,
           p.nombre AS producto_nombre
         FROM transaccion t
         LEFT JOIN Meta m ON t.meta_id = m.ID
         LEFT JOIN Producto_financiero p ON t.producto_financiero_id = p.ID
         WHERE t.usuario_id = ? OR t.usuario_id IS NULL
         ORDER BY t.fecha_hora DESC
         LIMIT ?`,
        [uid, limit]
      ) as TransaccionRow[];
    } catch (error) {
      console.log("Error obteniendo transacciones:", error);
      return [];
    }
  },
};
