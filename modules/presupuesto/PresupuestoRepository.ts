import db from "../database/database";

export const PresupuestoRepository = {
  limpiarCategorias: () => {
  try {
    db.runSync("DELETE FROM Categoria");
  } catch (error) {
    console.log("Error limpiando categorias:", error);
  }
},  
  getCategorias: () => {
    try {
      return db.getAllSync("SELECT * FROM Categoria");
    } catch (error) {
      console.log("Error obteniendo categorias:", error);
      return [];
    }
    
  },

  insertarCategoria: (cat: any) => {
    try {
      db.runSync(
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
      const result = db.getFirstSync(
        "SELECT COUNT(*) as count FROM Categoria"
    ) as { count: number };

    return result.count > 0;
    } catch {
      return false;
    }
  },
};