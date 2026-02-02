const SETTINGS_KEY = 'controlcentre-settings'

const defaultSettings = {
  discordWebhookUrl: '',
  userName: '',
  githubRepo: '', // "owner/repo" or full GitHub URL (global fallback)
  discordEnabled: false,
  githubEnabled: false,
  teamMembers: [], // { id, name }
  currentUserId: null, // id of who is using this browser
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...defaultSettings }
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('Failed to save settings', e)
  }
}

// Parse "owner/repo" from user input (handles "https://github.com/owner/repo" or "owner/repo")
export function parseGithubRepo(input) {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null
  if (trimmed.includes('github.com')) {
    const m = trimmed.match(/github\.com[/]([^/]+[/][^/]+?)(?:\.git)?/i)
    return m ? m[1] : null
  }
  return /^[\w.-]+\/[\w.-]+$/.test(trimmed) ? trimmed : null
}
