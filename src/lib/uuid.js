/**
 * Generate a UUID v4. Uses crypto.randomUUID() in secure contexts (HTTPS),
 * otherwise falls back so the app works on HTTP and older browsers.
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: UUID v4-like string (crypto.getRandomValues or Math.random)
  const hex = '0123456789abcdef'
  let bytes
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    bytes = crypto.getRandomValues(new Uint8Array(16))
  } else {
    bytes = new Uint8Array(16)
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  let s = ''
  for (let i = 0; i < 16; i++) {
    s += hex[bytes[i] >> 4] + hex[bytes[i] & 15]
    if (i === 3 || i === 5 || i === 7 || i === 9) s += '-'
  }
  return s
}
