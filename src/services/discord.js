import { getSettings, parseGithubRepo } from '../settings/useSettings'
import { auth } from '../lib/firebase'

// App theme: --accent #00d4aa, --accent-warm #ffb347
const COLOR_MISSION = 0x00d4aa   // teal (accent)
const COLOR_EMERGENCY = 0xffb347 // warm (accent-warm)

/** Elsi repo (main branch) — used for "Pull latest commit" on tasks */
export const ELSI_REPO = 'RG-GitUser/elsiadminmain'

function formatDayDate(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const day = days[date.getDay()]
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return { day, date: dateStr }
}

const GITHUB_HEADERS = {
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'ControlCentre-Tracker (https://github.com)',
}

export async function fetchLatestCommit(repo) {
  const parsed = parseGithubRepo(repo)
  if (!parsed) return null
  try {
    const res = await fetch(`https://api.github.com/repos/${parsed}/commits?per_page=1`, {
      headers: GITHUB_HEADERS,
    })
    if (!res.ok) return null
    const data = await res.json()
    const commit = Array.isArray(data) ? data[0] : data
    return commit?.sha ? String(commit.sha).slice(0, 7) : null
  } catch {
    return null
  }
}

const DESC_MAX = 800

function buildMissionEmbed(type, payload, meta) {
  const { user, day, date, commitDisplay } = meta
  const titles = {
    project_created: 'NEW BOARD DEPLOYED',
    project_edited: 'BOARD RENAMED',
    project_deleted: 'BOARD DECOMMISSIONED',
    task_added: 'TASK ADDED',
    task_edited: 'TASK UPDATED',
    task_deleted: 'TASK REMOVED',
  }
  const descriptions = {
    project_created: `**${payload.name}** is now live. Ready for tasks.`,
    project_edited: `Board is now called **${payload.name}**${payload.oldName ? ` (was ${payload.oldName})` : ''}.`,
    project_deleted: `**${payload.name}** has been decommissioned.`,
    task_added: `**${payload.title}**\n\n${payload.description ? `_${payload.description.slice(0, DESC_MAX)}${payload.description.length > DESC_MAX ? '…' : ''}_` : '_No description._'}`,
    task_edited: `**${payload.title}**\n\n${payload.statusChange ? `Status: **${payload.oldStatus}** → **${payload.newStatus}**` : ''}${payload.details ? `\n${payload.details}` : ''}`,
    task_deleted: `**${payload.title}** removed from **${payload.projectName}**.`,
  }
  const taskTypes = ['task_added', 'task_edited', 'task_deleted']
  const baseFields = [
    { name: 'OPERATOR', value: user, inline: false },
    { name: 'DAY', value: day, inline: false },
    { name: 'DATE', value: date, inline: false },
    { name: 'COMMIT', value: commitDisplay, inline: false },
  ]
  if (taskTypes.includes(type) && payload.projectName) {
    baseFields.splice(1, 0, { name: 'BOARD', value: payload.projectName, inline: false })
  }
  const statusValue = type === 'task_added' ? (payload.status || 'Pending')
    : type === 'task_edited' ? (payload.newStatus ?? payload.status ?? '—')
    : type === 'task_deleted' ? 'Removed'
    : null
  if (taskTypes.includes(type) && statusValue) {
    baseFields.splice(taskTypes.includes(type) && payload.projectName ? 2 : 1, 0, { name: 'TASK STATUS', value: statusValue, inline: false })
  }
  return {
    title: titles[type] ?? 'CONTROL CENTRE UPDATE',
    description: descriptions[type] ?? 'Something changed.',
    color: COLOR_MISSION,
    fields: baseFields,
    footer: { text: 'THE CONTROL CENTRE • MISSION TRACKER' },
    timestamp: meta.now.toISOString(),
  }
}

const PROTOCOL_DESC_MAX = 600

function buildProtocolEmbed(payload, meta) {
  const { user, day, date } = meta
  const descPreview = (payload.description || '').slice(0, PROTOCOL_DESC_MAX)
  const description = (descPreview ? `_${descPreview}${payload.description?.length > PROTOCOL_DESC_MAX ? '…' : ''}_` : '_No description._')
  const tagged = (payload.taggedNames || []).length
    ? (payload.taggedNames || []).join(', ')
    : null
  const fileInfo = (payload.fileCount || 0) > 0
    ? `${payload.fileCount} file(s): ${(payload.fileNames || []).slice(0, 5).join(', ')}${(payload.fileNames?.length || 0) > 5 ? '…' : ''}`
    : null

  const fields = [
    { name: 'OPERATOR', value: user, inline: false },
    { name: 'DAY', value: day, inline: false },
    { name: 'DATE', value: date, inline: false },
  ]
  if (tagged) fields.push({ name: 'CREW TAGGED', value: tagged, inline: false })
  if (fileInfo) fields.push({ name: 'ATTACHMENTS', value: fileInfo, inline: false })

  return {
    title: 'EMERGENCY PROTOCOL POSTED',
    description,
    color: COLOR_EMERGENCY,
    fields,
    footer: { text: 'THE CONTROL CENTRE • EMERGENCY PROTOCOLS' },
    timestamp: meta.now.toISOString(),
  }
}

const MISSION_TYPES = ['project_created', 'project_edited', 'project_deleted', 'task_added', 'task_edited', 'task_deleted']
const PROTOCOL_TYPES = ['protocol_added']

/**
 * Send an update to Discord (if enabled and webhook configured).
 * @param {string} type - project_* | task_* | protocol_added
 * @param {object} payload - Depends on type
 */
export async function sendDiscordUpdate(type, payload = {}) {
  const settings = getSettings()
  if (!settings.discordEnabled || !settings.discordWebhookUrl?.trim()) return

  const webhookUrl = settings.discordWebhookUrl.trim()
  const fbUser = auth.currentUser
  const members = settings.teamMembers ?? []
  const currentId = settings.currentUserId
  const currentMember = currentId ? members.find((m) => m.id === currentId) : null
  const user = fbUser
    ? (fbUser.displayName?.trim() || fbUser.email || 'Crew')
    : (currentMember?.name?.trim() || settings.userName?.trim() || 'Crew')
  const now = new Date()
  const { day, date } = formatDayDate(now)

  let embed

  if (PROTOCOL_TYPES.includes(type)) {
    embed = buildProtocolEmbed(payload, { user, day, date, now })
  } else {
    let commitHash = (payload.overrideCommit && String(payload.overrideCommit).trim()) || null
    if (commitHash === null) {
      const boardRepo = payload.projectRepo?.trim()
      if (boardRepo) commitHash = await fetchLatestCommit(boardRepo)
      if (commitHash === null && settings.githubEnabled && settings.githubRepo?.trim()) {
        commitHash = await fetchLatestCommit(settings.githubRepo.trim())
      }
      if (commitHash === null && typeof import.meta.env?.VITE_GIT_COMMIT === 'string') {
        commitHash = import.meta.env.VITE_GIT_COMMIT
      }
      if (commitHash === null && typeof import.meta.env?.VITE_ELSI_REPO === 'string' && import.meta.env.VITE_ELSI_REPO.trim()) {
        commitHash = await fetchLatestCommit(import.meta.env.VITE_ELSI_REPO.trim())
      }
    }
    const commitDisplay = commitHash ? `\`${commitHash}\`` : '—'
    embed = buildMissionEmbed(type, payload, { user, day, date, commitDisplay, now })
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch (e) {
    console.warn('Discord webhook failed', e)
  }
}
