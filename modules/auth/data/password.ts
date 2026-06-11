/**
 * Hash de contraseña simple, SIN dependencias nativas.
 *
 * ⚠️ No es criptográficamente seguro (no usa salt ni un algoritmo resistente).
 * Es suficiente para una app local de aprendizaje: evita guardar la contraseña
 * en texto plano. Si en el futuro se requiere seguridad real, reemplazar por
 * `expo-crypto` (SHA-256 + salt).
 */

const PREFIX = 'midas1$';

/** Hash determinista basado en djb2, codificado en base36. */
function djb2(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  // >>> 0 para tratarlo como entero sin signo de 32 bits
  return (hash >>> 0).toString(36);
}

export function hashPassword(password: string): string {
  // Doble pase con la longitud mezclada para reducir colisiones triviales.
  const mixed = `${password}|${password.length}|midas`;
  return `${PREFIX}${djb2(mixed)}${djb2(mixed.split('').reverse().join(''))}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
