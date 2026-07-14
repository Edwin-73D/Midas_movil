import sqlite from '@/db/client';
import { getCurrentUserId } from '@/modules/auth/data/session';

/** HU-01: clave estable de la categoría fija de ahorros. */
export const CLAVE_AHORROS = 'ahorros';

export const PresupuestoRepository = {
  // HU-01: garantiza que el usuario activo tenga su categoría fija "Ahorros".
  ensureCategoriaAhorros: () => {
    try {
      const uid = getCurrentUserId();
      if (uid == null) return;
      const row = sqlite.getFirstSync(
        "SELECT ID FROM Categoria WHERE clave = ? AND usuario_id = ?",
        [CLAVE_AHORROS, uid]
      );
      if (!row) {
        sqlite.runSync(
          `INSERT INTO Categoria
            (nombre, monto_esperado, monto_real, porcentaje, descripcion, usuario_id, clave)
           VALUES ('Ahorros', 0, 0, 0, '', ?, ?)`,
          [uid, CLAVE_AHORROS]
        );
      }
    } catch (error) {
      console.log("Error asegurando categoria Ahorros:", error);
    }
  },

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
        // HU-01: nunca borrar la categoría fija de ahorros (se preserva su monto_real).
        if (uid != null) {
          sqlite.runSync(
            `DELETE FROM Categoria
             WHERE (usuario_id = ? OR usuario_id IS NULL)
               AND (clave IS NULL OR clave <> ?)`,
            [uid, CLAVE_AHORROS]
          );
        } else {
          sqlite.runSync(
            "DELETE FROM Categoria WHERE clave IS NULL OR clave <> ?",
            [CLAVE_AHORROS]
          );
        }
      });
    } catch (error) {
      console.log("Error limpiando categorias:", error);
    }
  },

  getCategorias: () => {
    try {
      const uid = getCurrentUserId();
      // HU-01: la categoría fija de ahorros siempre debe existir y aparecer.
      PresupuestoRepository.ensureCategoriaAhorros();
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
        (nombre, monto_esperado, monto_real, porcentaje, descripcion, usuario_id, clave)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [cat.nombre, cat.monto_esperado, cat.monto_real, cat.porcentaje, cat.descripcion, uid, cat.clave ?? null]
      );
    } catch (error) {
      console.log("Error insertando categoria:", error);
    }
  },

  // HU-01: actualiza solo el presupuesto (monto_esperado/porcentaje) de la
  // categoría fija de ahorros, sin tocar su monto_real acumulado.
  actualizarPresupuestoAhorros: (montoEsperado: number, porcentaje: number) => {
    try {
      const uid = getCurrentUserId();
      if (uid == null) return;
      sqlite.runSync(
        `UPDATE Categoria SET monto_esperado = ?, porcentaje = ?
         WHERE clave = ? AND usuario_id = ?`,
        [montoEsperado, porcentaje, CLAVE_AHORROS, uid]
      );
    } catch (error) {
      console.log("Error actualizando presupuesto de Ahorros:", error);
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
