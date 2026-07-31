import sqlite from '@/db/client';
import { getCurrentUserId } from '@/modules/auth/data/session';
import { getFrecuenciaPresupuesto } from '@/modules/presupuesto/data/presupuesto-config';
import { getRangoPeriodoActual } from '@/modules/presupuesto/periodo';

/** HU-01: clave estable de la categoría fija de ahorros. */
export const CLAVE_AHORROS = 'ahorros';

/**
 * Columnas explícitas (no `SELECT *`) porque `monto_real` se sobreescribe con
 * un cálculo dinámico por fila — evita el nombre de columna duplicado que
 * resultaría de `SELECT c.*, ... AS monto_real`.
 *
 * HU: sin reset destructivo. `monto_real` ya no se lee del acumulado
 * histórico de la tabla: se recalcula en cada consulta sumando las
 * transacciones del período vigente (mensual/quincenal, configurable). Para
 * "Ahorros" se suman las `saving` (no llevan categoria_id — ver
 * registrar-transaccion.service.ts); para el resto, las `expense` vinculadas
 * a la categoría. Los acumuladores (`actualizarMontoReal`,
 * `ajustarMontoRealAhorros`, `ajustarMontoRealIntereses`) se dejan intactos
 * y siguen escribiendo, pero ya no se leen para mostrar datos.
 */
function selectCategoriasConGastoPeriodo(whereUsuario: string): { sql: string; buildParams: (uid: number | null) => any[] } {
  const sqlText = `
    SELECT c.ID, c.nombre, c.monto_esperado, c.porcentaje, c.descripcion, c.usuario_id, c.clave,
      CASE WHEN c.clave = ? THEN COALESCE((
        SELECT SUM(t.valor_transaccion) FROM transaccion t
        WHERE t.tipo = 'saving'
          AND (t.usuario_id = ? OR t.usuario_id IS NULL)
          AND strftime('%Y-%m-%d', t.fecha_hora) BETWEEN ? AND ?
      ), 0) ELSE COALESCE((
        SELECT SUM(t.valor_transaccion) FROM transaccion t
        WHERE t.categoria_id = c.ID AND t.tipo = 'expense'
          AND (t.usuario_id = ? OR t.usuario_id IS NULL)
          AND strftime('%Y-%m-%d', t.fecha_hora) BETWEEN ? AND ?
      ), 0) END AS monto_real
    FROM Categoria c
    ${whereUsuario}
  `;
  return {
    sql: sqlText,
    buildParams: (uid) => {
      const { inicio, fin } = getRangoPeriodoActual(getFrecuenciaPresupuesto());
      return [CLAVE_AHORROS, uid, inicio, fin, uid, inicio, fin];
    },
  };
}

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
        const { sql, buildParams } = selectCategoriasConGastoPeriodo(
          "WHERE c.usuario_id = ? OR c.usuario_id IS NULL"
        );
        return sqlite.getAllSync(sql, [...buildParams(uid), uid]);
      }
      const { sql, buildParams } = selectCategoriasConGastoPeriodo("");
      return sqlite.getAllSync(sql, buildParams(null));
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
