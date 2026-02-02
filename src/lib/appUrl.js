/**
 * Base URL for the app (used for Discord links so they point to the real deployed URL).
 * Set VITE_APP_URL at build time to your deployed URL, e.g. https://yourdomain.com/controlcentre
 */
function getAppBaseUrl() {
  const envUrl = (import.meta.env.VITE_APP_URL ?? '').trim()
  if (envUrl) return envUrl.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    return (window.location.origin + (import.meta.env.BASE_URL || '/')).replace(/\/$/, '')
  }
  return ''
}

/**
 * Build the full URL to a project board (for Discord links etc).
 * Uses VITE_APP_URL when set (build/deploy) so links work from Discord; otherwise current origin.
 */
export function getBoardUrl(projectId) {
  if (!projectId) return ''
  const base = getAppBaseUrl()
  if (!base) return ''
  return `${base}/board/${projectId}`
}
