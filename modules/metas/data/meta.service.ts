import db from '../../../db/client';
import { Meta } from '../domain/meta.model';

export const createTable = () => {
  db.transaction(tx => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS Meta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        meta_total REAL,
        monto REAL,
        porcentaje_actual REAL,
        descripcion TEXT,
        fecha_finalizar TEXT
      );
    `);
  });
};

export const insertMeta = (meta: Meta) => {
  const porcentaje = (meta.monto / meta.metaTotal) * 100;

  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO Meta
      (nombre, meta_total, monto, porcentaje_actual, descripcion, fecha_finalizar)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        meta.nombre,
        meta.metaTotal,
        meta.monto,
        porcentaje,
        meta.descripcion,
        meta.fechaFinalizar
      ]
    );
  });
};

export const getAllMetas = (callback: (data: Meta[]) => void) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM Meta ORDER BY id DESC`,
      [],
      (_, results) => {
        const rows = results.rows;
        let metas: Meta[] = [];

        for (let i = 0; i < rows.length; i++) {
          metas.push(rows.item(i));
        }

        callback(metas);
      }
    );
  });
};

export const updateMonto = (id: number, monto: number) => {
  db.transaction(tx => {
    tx.executeSql(
      `UPDATE Meta
       SET monto = ?,
           porcentaje_actual = ( ? * 100.0 ) / meta_total
       WHERE id = ?`,
      [monto, monto, id]
    );
  });
};

export const getResumen = (callback: (total: number, count: number) => void) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT SUM(monto) as total, COUNT(*) as count FROM Meta`,
      [],
      (_, res) => {
        const row = res.rows.item(0);
        callback(row.total || 0, row.count);
      }
    );
  });
};