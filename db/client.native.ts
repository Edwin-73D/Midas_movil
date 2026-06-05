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

/** Drizzle ORM instance (metas module, typed queries). */
export const db: ExpoSQLiteDatabase<typeof schema> = drizzle(expo, { schema });

/** Raw expo-sqlite sync API (legacy repositories). */
export default expo;
