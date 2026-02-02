import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { getSettings } from './settings/useSettings'
import { hasSession } from './lib/auth'
import { StoreProvider } from './store/useStore'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProjectBoard from './components/ProjectBoard'
import Settings from './components/Settings'
import Login from './components/Login'

function getRequireLogin() {
  const settings = getSettings()
  const members = settings.teamMembers ?? []
  return members.some((m) => !!m.passwordHash)
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(hasSession)
  const [requireLogin, setRequireLogin] = useState(getRequireLogin)

  useEffect(() => {
    const handler = () => setRequireLogin(getRequireLogin())
    window.addEventListener('settingsSaved', handler)
    return () => window.removeEventListener('settingsSaved', handler)
  }, [])

  const showLogin = requireLogin && !loggedIn

  if (showLogin) {
    return (
      <StoreProvider>
        <Login onSuccess={() => setLoggedIn(true)} />
      </StoreProvider>
    )
  }

  return (
    <StoreProvider>
      <Layout onLogout={() => setLoggedIn(false)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/board/:projectId" element={<ProjectBoard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </StoreProvider>
  )
}
