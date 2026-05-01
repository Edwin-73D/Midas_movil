import db from "../database/database";

export type TransaccionRow = {
  ID: number;
  nombre: string | null;
  valor_transaccion: number;
  fecha_hora: string;
  categoria_id: number | null;
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
      db.runSync(
        `INSERT INTO transaccion (nombre, valor_transaccion, categoria_id, descripcion)
         VALUES (?, ?, ?, ?)`,
        [t.nombre, t.valor_transaccion, t.categoria_id, t.descripcion]
      );
    } catch (error) {
      console.log("Error insertando transaccion:", error);
    }
  },

  getRecientes: (limit = 20): TransaccionRow[] => {
    try {
      return db.getAllSync(
        "SELECT * FROM transaccion ORDER BY fecha_hora DESC LIMIT ?",
        [limit]
      ) as TransaccionRow[];
    } catch (error) {
      console.log("Error obteniendo transacciones:", error);
      return [];
    }
  },
};
