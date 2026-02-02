import { useState, useEffect } from 'react'
import { getSettings, saveSettings } from '../settings/useSettings'
import { fetchLatestCommit } from '../services/discord'
import { hashPassword } from '../lib/auth'
import './Settings.css'

function notifySettingsSaved() {
  window.dispatchEvent(new CustomEvent('settingsSaved'))
}

export default function Settings() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [userName, setUserName] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [discordEnabled, setDiscordEnabled] = useState(false)
  const [githubEnabled, setGithubEnabled] = useState(false)
  const [saved, setSaved] = useState(false)
  const [commitPreview, setCommitPreview] = useState(null)
  const [commitLoading, setCommitLoading] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberUsername, setNewMemberUsername] = useState('')
  const [newMemberPassword, setNewMemberPassword] = useState('')
  const [addMemberLoading, setAddMemberLoading] = useState(false)
  const [addMemberError, setAddMemberError] = useState('')

  useEffect(() => {
    const s = getSettings()
    setWebhookUrl(s.discordWebhookUrl ?? '')
    setUserName(s.userName ?? '')
    setGithubRepo(s.githubRepo ?? '')
    setDiscordEnabled(s.discordEnabled ?? false)
    setGithubEnabled(s.githubEnabled ?? false)
    setTeamMembers(s.teamMembers ?? [])
    setCurrentUserId(s.currentUserId ?? null)
  }, [])

  const saveAll = (overrides = {}) => {
    const next = {
      discordWebhookUrl: webhookUrl.trim(),
      userName: userName.trim(),
      githubRepo: githubRepo.trim(),
      discordEnabled,
      githubEnabled,
      teamMembers,
      currentUserId,
      ...overrides,
    }
    saveSettings(next)
    if (overrides.currentUserId !== undefined) setCurrentUserId(overrides.currentUserId)
    if (overrides.teamMembers !== undefined) setTeamMembers(overrides.teamMembers)
    setSaved(true)
    notifySettingsSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveAll()
  }

  const handleAddMember = async () => {
    const name = newMemberName.trim()
    const username = newMemberUsername.trim()
    const password = newMemberPassword
    setAddMemberError('')
    if (!name) {
      setAddMemberError('Name is required.')
      return
    }
    if (!username) {
      setAddMemberError('Username is required.')
      return
    }
    if (!password) {
      setAddMemberError('Password is required.')
      return
    }
    const existing = teamMembers.some((m) => (m.username || '').toLowerCase() === username.toLowerCase())
    if (existing) {
      setAddMemberError('That username is already in use.')
      return
    }
    setAddMemberLoading(true)
    try {
      const passwordHash = await hashPassword(password)
      const next = [
        ...teamMembers,
        { id: crypto.randomUUID(), name, username, passwordHash },
      ]
      setTeamMembers(next)
      setNewMemberName('')
      setNewMemberUsername('')
      setNewMemberPassword('')
      saveAll({ teamMembers: next, currentUserId: currentUserId || (next[0]?.id ?? null) })
    } catch {
      setAddMemberError('Failed to add member.')
    } finally {
      setAddMemberLoading(false)
    }
  }

  const handleRemoveMember = (id) => {
    const next = teamMembers.filter((m) => m.id !== id)
    setTeamMembers(next)
    setCurrentUserId(currentUserId === id ? (next[0]?.id ?? null) : currentUserId)
    saveAll({ teamMembers: next, currentUserId: currentUserId === id ? (next[0]?.id ?? null) : currentUserId })
  }

  const handleCurrentUserChange = (id) => {
    const value = id === '' ? null : id
    setCurrentUserId(value)
    saveAll({ currentUserId: value })
  }

  return (
    <div className="settings">
      <h1 className="settings-title">SETTINGS</h1>
      <p className="settings-subtitle">Discord updates &amp; GitHub connection</p>

      <div className="settings-status panel">
        <div className="panel-header">STATUS</div>
        <div className="settings-status-body">
          <div className="settings-status-row">
            <span className="settings-status-label">Discord</span>
            <span className={`settings-status-badge ${discordEnabled && webhookUrl.trim() ? 'on' : 'off'}`}>
              {discordEnabled && webhookUrl.trim() ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="settings-status-row">
            <span className="settings-status-label">GitHub (commit hash)</span>
            <span className={`settings-status-badge ${githubEnabled && githubRepo.trim() ? 'on' : 'off'}`}>
              {githubEnabled && githubRepo.trim() ? 'CONNECTED' : 'OFF'}
            </span>
          </div>
          {commitPreview !== null && (
            <div className="settings-status-row">
              <span className="settings-status-label">Latest commit</span>
              <span className={`settings-status-value ${commitPreview.error ? 'error' : ''}`}>
                {commitPreview.error ? commitPreview.error : commitPreview.sha}
              </span>
            </div>
          )}
          <div className="settings-status-row">
            <span className="settings-status-label">Current user</span>
            <span className="settings-status-value">
              {teamMembers.length > 0
                ? (teamMembers.find((m) => m.id === currentUserId)?.name ?? (userName.trim() || 'Not set'))
                : (userName.trim() || 'Not set')}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-forms">
        <div className="panel settings-panel">
          <div className="panel-header settings-panel-header">
            <span>DISCORD</span>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={discordEnabled}
                onChange={(e) => setDiscordEnabled(e.target.checked)}
                className="settings-toggle-input"
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
          <div className="settings-form-body">
            <label className="settings-field">
              <span className="settings-label">Webhook URL</span>
              <input
                type="url"
                className="input settings-input-discord"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <span className="settings-hint">Channel → Edit → Integrations → Webhooks. Messages show task status, commit (e.g. Elsi repo), and longer descriptions.</span>
            </label>
            <label className="settings-field">
              <span className="settings-label">Fallback name (if no team member selected)</span>
              <input
                type="text"
                className="input"
                placeholder="e.g. Alex"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="panel settings-panel">
          <div className="panel-header">TEAM MEMBERS</div>
          <div className="settings-form-body">
            <p className="settings-hint settings-hint-block">
              Add team members with username and password. You control the login credentials. Everyone shares the same boards and tasks; users sign in to identify themselves.
            </p>
            <label className="settings-field">
              <span className="settings-label">Current user (who is using this device)</span>
              <select
                className="input"
                value={currentUserId ?? ''}
                onChange={(e) => handleCurrentUserChange(e.target.value)}
              >
                <option value="">— Select —</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} {m.username ? `(@${m.username})` : ''}</option>
                ))}
              </select>
            </label>
            <label className="settings-field">
              <span className="settings-label">Add member (you set their login)</span>
              <div className="settings-add-member">
                <input
                  type="text"
                  className="input"
                  placeholder="Display name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Username (login)"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                />
                <input
                  type="password"
                  className="input"
                  placeholder="Password"
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddMember}
                  disabled={addMemberLoading}
                >
                  {addMemberLoading ? '…' : 'Add'}
                </button>
              </div>
              {addMemberError && <p className="settings-member-error">{addMemberError}</p>}
              <span className="settings-hint">Password is stored hashed; you control who can sign in.</span>
            </label>
            {teamMembers.length > 0 && (
              <ul className="settings-members-list">
                {teamMembers.map((m) => (
                  <li key={m.id} className="settings-members-item">
                    <span>{m.name} {m.username ? <em className="settings-member-username">@{m.username}</em> : <em className="settings-member-legacy">(no login)</em>}</span>
                    <button type="button" className="btn btn-danger settings-members-remove" onClick={() => handleRemoveMember(m.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="panel settings-panel">
          <div className="panel-header settings-panel-header">
            <span>GITHUB</span>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={githubEnabled}
                onChange={(e) => setGithubEnabled(e.target.checked)}
                className="settings-toggle-input"
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
          <div className="settings-form-body">
            <label className="settings-field">
              <span className="settings-label">Repo (for commit hash in Discord)</span>
              <div className="settings-repo-row">
                <input
                  type="text"
                  className="input"
                  placeholder="owner/repo or https://github.com/owner/repo"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                />
                <button
                  type="button"
                  className="btn"
                  disabled={!githubRepo.trim() || commitLoading}
                  onClick={async () => {
                    setCommitLoading(true)
                    setCommitPreview(null)
                    try {
                      const sha = await fetchLatestCommit(githubRepo.trim())
                      setCommitPreview(sha ? { sha } : { error: 'Could not fetch commit' })
                    } catch {
                      setCommitPreview({ error: 'Request failed' })
                    } finally {
                      setCommitLoading(false)
                    }
                  }}
                >
                  {commitLoading ? '…' : 'Test'}
                </button>
              </div>
              <span className="settings-hint">Latest commit on default branch is sent with each update. For the Elsi repo use e.g. <code>owner/elsi</code> or set <code>VITE_ELSI_REPO=owner/elsi</code> in <code>.env</code>. Use Test to verify.</span>
            </label>
          </div>
        </div>

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary">
            {saved ? 'Saved' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
