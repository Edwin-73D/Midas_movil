import sqlite from '@/db/client';

import { hashPassword, verifyPassword } from './password';

export type Usuario = {
  id: number;
  username: string;
  email: string;
};

type UsuarioRow = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
};

function rowToUsuario(row: UsuarioRow): Usuario {
  return { id: row.id, username: row.username, email: row.email };
}

export const AuthRepository = {
  buscarPorUsername(username: string): UsuarioRow | null {
    try {
      return (
        (sqlite.getFirstSync(
          'SELECT * FROM usuario WHERE LOWER(username) = LOWER(?) LIMIT 1',
          [username.trim()]
        ) as UsuarioRow | null) ?? null
      );
    } catch (e) {
      console.log('Error buscarPorUsername:', e);
      return null;
    }
  },

  /** Crea un usuario. Devuelve el usuario o un mensaje de error de validación. */
  crearUsuario(input: {
    username: string;
    email: string;
    password: string;
  }): { usuario?: Usuario; error?: string } {
    const username = input.username.trim();
    const email = input.email.trim();

    if (AuthRepository.buscarPorUsername(username)) {
      return { error: 'Ese nombre de usuario ya existe.' };
    }

    try {
      const result = sqlite.runSync(
        `INSERT INTO usuario (username, password_hash, email) VALUES (?, ?, ?)`,
        [username, hashPassword(input.password), email]
      );
      return {
        usuario: { id: Number(result.lastInsertRowId), username, email },
      };
    } catch (e) {
      console.log('Error crearUsuario:', e);
      return { error: 'No se pudo crear el usuario.' };
    }
  },

  /** Devuelve el usuario si las credenciales son correctas, o null. */
  validarCredenciales(username: string, password: string): Usuario | null {
    const row = AuthRepository.buscarPorUsername(username);
    if (!row) return null;
    if (!verifyPassword(password, row.password_hash)) return null;
    return rowToUsuario(row);
  },

  /** Usuario de la sesión activa (singleton id=1), o null. */
  getUsuarioSesion(): Usuario | null {
    try {
      const row = sqlite.getFirstSync(
        `SELECT u.id, u.username, u.email, u.password_hash
         FROM sesion_activa s
         JOIN usuario u ON u.id = s.usuario_id
         WHERE s.id = 1
         LIMIT 1`
      ) as UsuarioRow | null;
      return row ? rowToUsuario(row) : null;
    } catch (e) {
      console.log('Error getUsuarioSesion:', e);
      return null;
    }
  },

  setSesion(usuarioId: number): void {
    try {
      sqlite.runSync(
        'INSERT OR REPLACE INTO sesion_activa (id, usuario_id) VALUES (1, ?)',
        [usuarioId]
      );
    } catch (e) {
      console.log('Error setSesion:', e);
    }
  },

  cerrarSesion(): void {
    try {
      sqlite.runSync('DELETE FROM sesion_activa WHERE id = 1');
    } catch (e) {
      console.log('Error cerrarSesion:', e);
    }
  },

  /** Siembra un usuario de prueba (test / test123) si no existe ninguno. */
  seedUsuarioPrueba(): void {
    try {
      const row = sqlite.getFirstSync(
        'SELECT COUNT(*) as count FROM usuario'
      ) as { count: number } | null;
      if ((row?.count ?? 0) > 0) return;
      AuthRepository.crearUsuario({
        username: 'test',
        email: 'test@midas.app',
        password: 'test123',
      });
    } catch (e) {
      console.log('Error seedUsuarioPrueba:', e);
    }
  },
};
