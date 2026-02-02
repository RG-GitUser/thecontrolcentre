import { Routes, Route } from 'react-router-dom'
import { useAuth } from './lib/useAuth'
import { StoreProvider } from './store/useStore'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProjectBoard from './components/ProjectBoard'
import Settings from './components/Settings'
import Login from './components/Login'

export default function App() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="app-loading">
        <span className="app-loading-text">THE CONTROL CENTRE</span>
        <span className="app-loading-dots">…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <StoreProvider>
        <Login />
      </StoreProvider>
    )
  }

  return (
    <StoreProvider>
      <Layout user={user} onLogout={signOut}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/board/:projectId" element={<ProjectBoard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </StoreProvider>
  )
}
