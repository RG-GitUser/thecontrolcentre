import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSettings, saveSettings } from '../settings/useSettings'
import { clearSession } from '../lib/auth'
import './Layout.css'

function notifySettingsSaved() {
  window.dispatchEvent(new CustomEvent('settingsSaved'))
}

export default function Layout({ children, onLogout }) {
  const [, setRefresh] = useState(0)
  const settings = getSettings()

  useEffect(() => {
    const handler = () => setRefresh((r) => r + 1)
    window.addEventListener('settingsSaved', handler)
    return () => window.removeEventListener('settingsSaved', handler)
  }, [])

  const discordOn = settings.discordEnabled && !!settings.discordWebhookUrl?.trim()
  const githubOn = settings.githubEnabled && !!settings.githubRepo?.trim()
  const members = settings.teamMembers ?? []
  const currentId = settings.currentUserId
  const currentMember = currentId ? members.find((m) => m.id === currentId) : null
  const currentUserName = currentMember?.name?.trim() || settings.userName?.trim() || null

  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="layout-brand">
          <span className="layout-brand-icon">◈</span>
          <span>THE CONTROL CENTRE</span>
        </Link>
        <nav className="layout-nav">
          <div className="layout-status">
            {currentUserName && (
              <span className="layout-status-user" title="Current user (change in Settings)">
                {currentUserName}
              </span>
            )}
            <span className={`layout-status-pill ${discordOn ? 'on' : 'off'}`} title="Discord updates">
              Discord {discordOn ? 'ON' : 'OFF'}
            </span>
            <span className={`layout-status-pill ${githubOn ? 'on' : 'off'}`} title="GitHub commit">
              GitHub {githubOn ? 'ON' : 'OFF'}
            </span>
          </div>
          <Link to="/" className="layout-nav-link">Dashboard</Link>
          <Link to="/settings" className="layout-nav-link">Settings</Link>
          {onLogout && (
            <button type="button" className="btn layout-logout" onClick={() => { clearSession(); saveSettings({ ...getSettings(), currentUserId: null }); notifySettingsSaved(); onLogout(); }}>
              Log out
            </button>
          )}
        </nav>
      </header>
      <main className="layout-main">
        {children}
      </main>
    </div>
  )
}
