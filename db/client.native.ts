import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

const expo = SQLite.openDatabaseSync('midas.db');

// WAL mode: lecturas concurrentes sin bloquear escrituras
expo.execSync('PRAGMA journal_mode = WAL');
// Forzar integridad referencial (FK) — SQLite la desactiva por defecto
expo.execSync('PRAGMA foreign_keys = ON');

expo.execSync(`
  CREATE TABLE IF NOT EXISTS Categoria (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    monto_esperado REAL DEFAULT 0,
    monto_real REAL DEFAULT 0,
    porcentaje REAL DEFAULT 0,
    descripcion TEXT
  )
`);

expo.execSync(`
  CREATE TABLE IF NOT EXISTS Meta (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    meta_total REAL NOT NULL,
    monto REAL DEFAULT 0,
    porcentaje_actual REAL DEFAULT 0,
    descripcion TEXT,
    fecha_finalizar TEXT
  )
`);

expo.execSync(`
  CREATE TABLE IF NOT EXISTS transaccion (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100),
    valor_transaccion REAL NOT NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    categoria_id INTEGER,
    descripcion TEXT,
    FOREIGN KEY (categoria_id) REFERENCES Categoria(ID)
  )
`);

expo.execSync(`
  CREATE TABLE IF NOT EXISTS Balance (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    monto_esperado REAL DEFAULT 0
  )
`);

expo.execSync(`
  CREATE TABLE IF NOT EXISTS Producto_financiero (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(255),
    monto_neto REAL,
    monto_total FLOAT,
    interes FLOAT,
    entidad_financiera VARCHAR(255),
    tipo TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    meta_id INTEGER UNIQUE,
    FOREIGN KEY(meta_id)
      REFERENCES Meta(ID)
      ON DELETE SET NULL
      ON UPDATE CASCADE
  )
`);

try {
  expo.execSync(
    'ALTER TABLE transaccion ADD COLUMN meta_id INTEGER REFERENCES Meta(ID)'
  );
} catch {
  // columna ya existe
}

expo.execSync(`
  CREATE TABLE IF NOT EXISTS meta_aporte (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    meta_id INTEGER NOT NULL,
    monto REAL NOT NULL,
    fecha_hora TEXT DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT,
    transaccion_id INTEGER,
    FOREIGN KEY (meta_id) REFERENCES Meta(ID) ON DELETE CASCADE,
    FOREIGN KEY (transaccion_id) REFERENCES transaccion(ID) ON DELETE SET NULL
  )
`);

// ─── Autenticación local ─────────────────────────────────────────────────────

expo.execSync(`
  CREATE TABLE IF NOT EXISTS usuario (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL,
    password_hash TEXT    NOT NULL,
    email         TEXT    NOT NULL,
    created_at    TEXT    DEFAULT CURRENT_TIMESTAMP
  )
`);

// Singleton: una sola fila con id = 1 representa la sesión activa.
// Se inserta con INSERT OR REPLACE para actualizar sesión al re-login.
expo.execSync(`
  CREATE TABLE IF NOT EXISTS sesion_activa (
    id         INTEGER PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    created_at TEXT    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
  )
`);

/** Drizzle ORM instance (metas module, typed queries). */
export const db: ExpoSQLiteDatabase<typeof schema> = drizzle(expo, { schema });

/** Raw expo-sqlite sync API (legacy repositories). */
export default expo;
