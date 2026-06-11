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

// HU-16: tipo explícito de transacción ('income' | 'expense' | 'saving')
try {
  expo.execSync('ALTER TABLE transaccion ADD COLUMN tipo TEXT');
} catch {
  // columna ya existe
}

// HU-16: producto financiero destino de un ahorro
try {
  expo.execSync(
    'ALTER TABLE transaccion ADD COLUMN producto_financiero_id INTEGER REFERENCES Producto_financiero(ID)'
  );
} catch {
  // columna ya existe
}

// Backfill del tipo para filas previas a HU-16:
// las que tenían meta_id eran ahorros; sin categoría eran ingresos; el resto, gastos.
expo.execSync(`
  UPDATE transaccion SET tipo = CASE
    WHEN meta_id IS NOT NULL THEN 'saving'
    WHEN categoria_id IS NULL THEN 'income'
    ELSE 'expense'
  END
  WHERE tipo IS NULL
`);

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

// ─── Transacciones recurrentes ───────────────────────────────────────────────

expo.execSync(`
  CREATE TABLE IF NOT EXISTS transaccion_recurrente (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT,
    valor_transaccion REAL NOT NULL,
    tipo        TEXT NOT NULL,
    categoria_id INTEGER,
    meta_id     INTEGER,
    descripcion TEXT,
    frecuencia  TEXT NOT NULL,
    proxima_fecha TEXT NOT NULL,
    activa      INTEGER DEFAULT 1
  )
`);

// ─── Migraciones incrementales (idempotentes) ────────────────────────────────

// HU-04: soporte de producto financiero en plantillas recurrentes
try { expo.execSync('ALTER TABLE transaccion_recurrente ADD COLUMN producto_financiero_id INTEGER'); } catch {}
// HU-06: día de ejecución configurable en plantillas recurrentes
try { expo.execSync('ALTER TABLE transaccion_recurrente ADD COLUMN dia_ejecucion INTEGER'); } catch {}

// HU-02: columna usuario_id en tablas financieras
try { expo.execSync('ALTER TABLE transaccion ADD COLUMN usuario_id INTEGER'); } catch {}
try { expo.execSync('ALTER TABLE Categoria ADD COLUMN usuario_id INTEGER'); } catch {}
try { expo.execSync('ALTER TABLE Meta ADD COLUMN usuario_id INTEGER'); } catch {}
try { expo.execSync('ALTER TABLE Producto_financiero ADD COLUMN usuario_id INTEGER'); } catch {}
try { expo.execSync('ALTER TABLE transaccion_recurrente ADD COLUMN usuario_id INTEGER'); } catch {}

// Backfill: asigna el usuario activo a los datos previos (migración no destructiva)
try {
  expo.execSync(`
    UPDATE transaccion SET usuario_id = (SELECT usuario_id FROM sesion_activa WHERE id = 1)
    WHERE usuario_id IS NULL
  `);
  expo.execSync(`
    UPDATE Categoria SET usuario_id = (SELECT usuario_id FROM sesion_activa WHERE id = 1)
    WHERE usuario_id IS NULL
  `);
  expo.execSync(`
    UPDATE Meta SET usuario_id = (SELECT usuario_id FROM sesion_activa WHERE id = 1)
    WHERE usuario_id IS NULL
  `);
  expo.execSync(`
    UPDATE Producto_financiero SET usuario_id = (SELECT usuario_id FROM sesion_activa WHERE id = 1)
    WHERE usuario_id IS NULL
  `);
  expo.execSync(`
    UPDATE transaccion_recurrente SET usuario_id = (SELECT usuario_id FROM sesion_activa WHERE id = 1)
    WHERE usuario_id IS NULL
  `);
} catch {}

// ─── Limpiar categorías duplicadas de generaciones anteriores.
// Primero anula las FK en transacciones que apunten a los duplicados, luego borra.
try {
  expo.execSync(`
    UPDATE transaccion SET categoria_id = NULL
    WHERE categoria_id IN (
      SELECT ID FROM Categoria WHERE ID NOT IN (
        SELECT MAX(ID) FROM Categoria GROUP BY nombre
      )
    )
  `);
  expo.execSync(`
    DELETE FROM Categoria WHERE ID NOT IN (
      SELECT MAX(ID) FROM Categoria GROUP BY nombre
    )
  `);
} catch {
  // Si falla (tabla vacía u otro motivo), no bloquear el arranque
}

/** Drizzle ORM instance (metas module, typed queries). */
export const db: ExpoSQLiteDatabase<typeof schema> = drizzle(expo, { schema });

/** Raw expo-sqlite sync API (legacy repositories). */
export default expo;
