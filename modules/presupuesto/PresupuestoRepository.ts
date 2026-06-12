import sqlite from '@/db/client';
import { getCurrentUserId } from '@/modules/auth/data/session';

export const PresupuestoRepository = {
  limpiarCategorias: () => {
    try {
      const uid = getCurrentUserId();
      sqlite.withTransactionSync(() => {
        if (uid != null) {
          sqlite.runSync(
            `UPDATE transaccion SET categoria_id = NULL
             WHERE categoria_id IS NOT NULL AND usuario_id = ?`,
            [uid]
          );
        } else {
          sqlite.runSync("UPDATE transaccion SET categoria_id = NULL WHERE categoria_id IS NOT NULL");
        }
        if (uid != null) {
          sqlite.runSync("DELETE FROM Categoria WHERE usuario_id = ? OR usuario_id IS NULL", [uid]);
        } else {
          sqlite.runSync("DELETE FROM Categoria");
        }
      });
    } catch (error) {
      console.log("Error limpiando categorias:", error);
    }
  },

  getCategorias: () => {
    try {
      const uid = getCurrentUserId();
      if (uid != null) {
        return sqlite.getAllSync(
          "SELECT * FROM Categoria WHERE usuario_id = ? OR usuario_id IS NULL",
          [uid]
        );
      }
      return sqlite.getAllSync("SELECT * FROM Categoria");
    } catch (error) {
      console.log("Error obteniendo categorias:", error);
      return [];
    }
  },

  insertarCategoria: (cat: any) => {
    try {
      const uid = getCurrentUserId();
      sqlite.runSync(
        `INSERT INTO Categoria
        (nombre, monto_esperado, monto_real, porcentaje, descripcion, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [cat.nombre, cat.monto_esperado, cat.monto_real, cat.porcentaje, cat.descripcion, uid]
      );
    } catch (error) {
      console.log("Error insertando categoria:", error);
    }
  },

  existeData: () => {
    try {
      const uid = getCurrentUserId();
      const result = uid != null
        ? sqlite.getFirstSync(
            "SELECT COUNT(*) as count FROM Categoria WHERE usuario_id = ? OR usuario_id IS NULL",
            [uid]
          ) as { count: number }
        : sqlite.getFirstSync("SELECT COUNT(*) as count FROM Categoria") as { count: number };
      return (result?.count ?? 0) > 0;
    } catch {
      return false;
    }
  },
};

export const actualizarMontoReal = async (categoriaId: number, monto: number) => {
  try {
    await sqlite.runAsync(
      `UPDATE Categoria SET monto_real = monto_real + ? WHERE ID = ?`,
      [monto, categoriaId]
    );
  } catch (error) {
    console.log("Error actualizando monto_real:", error);
  }
};
