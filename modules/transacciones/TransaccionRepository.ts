import sqlite from '@/db/client';

export type TransaccionRow = {
  ID: number;
  nombre: string | null;
  valor_transaccion: number;
  fecha_hora: string;
  categoria_id: number | null;
  meta_id: number | null;
  tipo: string | null;
  descripcion: string | null;
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
      return sqlite.getAllSync(
        "SELECT * FROM transaccion ORDER BY fecha_hora DESC LIMIT ?",
        [limit]
      ) as TransaccionRow[];
    } catch (error) {
      console.log("Error obteniendo transacciones:", error);
      return [];
    }
  },
};
