import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("midas.db");

// Inicializar DB
export const initDB = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS Categoria (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        monto_esperado REAL DEFAULT 0,
        monto_real REAL DEFAULT 0,
        porcentaje REAL DEFAULT 0,
        descripcion TEXT
      );
    `);

    console.log("✅ Base de datos lista");
  } catch (error) {
    console.log("❌ Error creando DB:", error);
  }
};

export default db;