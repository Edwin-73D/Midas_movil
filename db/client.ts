import { drizzle } from 'drizzle-orm/expo-sqlite';
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

export const db = drizzle(expo, { schema });
