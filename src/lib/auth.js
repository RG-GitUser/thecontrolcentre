/**
 * Hash a password with SHA-256 for storage. Never store plain passwords.
 */
export async function hashPassword(password) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password)
  )
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify a password against a stored hash.
 */
export async function verifyPassword(password, storedHash) {
  const hash = await hashPassword(password)
  return hash === storedHash
}

export const SESSION_KEY = 'controlcentre-loggedIn'

export function setSession(userId) {
  sessionStorage.setItem(SESSION_KEY, userId ?? '1')
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function hasSession() {
  return !!sessionStorage.getItem(SESSION_KEY)
}
