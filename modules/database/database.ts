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

    db.execSync(`
      CREATE TABLE IF NOT EXISTS transaccion (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        valor_transaccion REAL NOT NULL,
        fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
        categoria_id INTEGER,
        descripcion TEXT,
        FOREIGN KEY (categoria_id) REFERENCES Categoria(ID)
      );
    `);

    console.log("✅ Base de datos lista");
  } catch (error) {
    console.log("❌ Error creando DB:", error);
  }
};

initDB();

export default db;