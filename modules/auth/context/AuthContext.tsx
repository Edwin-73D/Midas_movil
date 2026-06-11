import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { AuthRepository, type Usuario } from '@/modules/auth/data/auth.repository';

type AuthResult = { error?: string };

type AuthContextValue = {
  user: Usuario | null;
  login: (username: string, password: string) => AuthResult;
  register: (data: { username: string; email: string; password: string }) => AuthResult;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

function validateRegister(data: {
  username: string;
  email: string;
  password: string;
}): string | null {
  if (!data.username.trim()) return 'Ingresa un nombre de usuario.';
  if (data.username.trim().length < 3) return 'El usuario debe tener al menos 3 caracteres.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return 'Ingresa un correo válido.';
  if (data.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // expo-sqlite es síncrono: la sesión se resuelve en el primer render (sin parpadeo).
  const [user, setUser] = useState<Usuario | null>(() => AuthRepository.getUsuarioSesion());

  useEffect(() => {
    AuthRepository.seedUsuarioPrueba();
  }, []);

  function login(username: string, password: string): AuthResult {
    if (!username.trim() || !password) return { error: 'Completa usuario y contraseña.' };
    const usuario = AuthRepository.validarCredenciales(username, password);
    if (!usuario) return { error: 'Usuario o contraseña incorrectos.' };
    AuthRepository.setSesion(usuario.id);
    setUser(usuario);
    return {};
  }

  function register(data: {
    username: string;
    email: string;
    password: string;
  }): AuthResult {
    const validationError = validateRegister(data);
    if (validationError) return { error: validationError };

    const { usuario, error } = AuthRepository.crearUsuario(data);
    if (error || !usuario) return { error: error ?? 'No se pudo registrar.' };

    AuthRepository.setSesion(usuario.id);
    setUser(usuario);
    return {};
  }

  function logout(): void {
    AuthRepository.cerrarSesion();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
