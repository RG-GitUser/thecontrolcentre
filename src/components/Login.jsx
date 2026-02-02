import { useState } from 'react'
import { getSettings, saveSettings } from '../settings/useSettings'
import { hashPassword, verifyPassword, setSession } from '../lib/auth'
import './Login.css'

function notifySettingsSaved() {
  window.dispatchEvent(new CustomEvent('settingsSaved'))
}

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const u = username.trim()
    const p = password
    if (!u || !p) {
      setError('Enter username and password.')
      return
    }
    setLoading(true)
    try {
      const settings = getSettings()
      const members = settings.teamMembers ?? []
      const member = members.find((m) => (m.username || '').toLowerCase() === u.toLowerCase())
      if (!member) {
        setError('Unknown user.')
        setLoading(false)
        return
      }
      if (!member.passwordHash) {
        setError('This user has no password set. Set one in Settings.')
        setLoading(false)
        return
      }
      const ok = await verifyPassword(p, member.passwordHash)
      if (!ok) {
        setError('Invalid password.')
        setLoading(false)
        return
      }
      saveSettings({ ...settings, currentUserId: member.id })
      setSession(member.id)
      notifySettingsSaved()
      onSuccess()
    } catch {
      setError('Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login-panel panel">
        <div className="login-header">
          <span className="login-brand">◈ THE CONTROL CENTRE</span>
          <span className="login-title">Sign in</span>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            <span className="login-label">Username</span>
            <input
              type="text"
              className="input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </label>
          <label className="login-field">
            <span className="login-label">Password</span>
            <input
              type="password"
              className="input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? '…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
