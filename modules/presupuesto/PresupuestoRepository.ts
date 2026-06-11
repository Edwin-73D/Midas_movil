import sqlite from '@/db/client';

export const PresupuestoRepository = {
  limpiarCategorias: () => {
    try {
      sqlite.withTransactionSync(() => {
        // Anular FK antes de borrar para evitar constraint violation
        sqlite.runSync("UPDATE transaccion SET categoria_id = NULL WHERE categoria_id IS NOT NULL");
        sqlite.runSync("DELETE FROM Categoria");
      });
    } catch (error) {
      console.log("Error limpiando categorias:", error);
    }
  },
  getCategorias: () => {
    try {
      return sqlite.getAllSync("SELECT * FROM Categoria");
    } catch (error) {
      console.log("Error obteniendo categorias:", error);
      return [];
    }
    
  },

  insertarCategoria: (cat: any) => {
    try {
      sqlite.runSync(
        `INSERT INTO Categoria 
        (nombre, monto_esperado, monto_real, porcentaje, descripcion)
        VALUES (?, ?, ?, ?, ?)`,
        [
          cat.nombre,
          cat.monto_esperado,
          cat.monto_real,
          cat.porcentaje,
          cat.descripcion,
        ]
      );
    } catch (error) {
      console.log("Error insertando categoria:", error);
    }
  },

  // 👇 evita duplicados (MUY importante)
  existeData: () => {
    try {
      const result = sqlite.getFirstSync(
        "SELECT COUNT(*) as count FROM Categoria"
    ) as { count: number };

    return result.count > 0;
    } catch {
      return false;
    }
  },
};

export const actualizarMontoReal = async (categoriaId: number, monto: number) => {
  try {
    await sqlite.runAsync(
      `UPDATE Categoria
       SET monto_real = monto_real + ?
       WHERE ID = ?`,
      [monto, categoriaId]
    );
  } catch (error) {
    console.log("Error actualizando monto_real:", error);
  }
};