import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { sendDiscordUpdate } from '../services/discord'
import EmergencyProtocols from './EmergencyProtocols'
import './Dashboard.css'

export default function Dashboard() {
  const { state, dispatch } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGithubRepo, setNewGithubRepo] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editGithubRepo, setEditGithubRepo] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const githubRepo = newGithubRepo.trim()
    dispatch({ type: 'ADD_PROJECT', payload: { name, githubRepo } })
    sendDiscordUpdate('project_created', { name })
    setNewName('')
    setNewGithubRepo('')
    setShowAdd(false)
  }

  const handleEdit = (e) => {
    e.preventDefault()
    const name = editName.trim()
    if (!name || !editingId) return
    const project = state.projects.find((p) => p.id === editingId)
    const oldName = project?.name
    const githubRepo = editGithubRepo.trim()
    dispatch({ type: 'EDIT_PROJECT', payload: { id: editingId, name, githubRepo } })
    sendDiscordUpdate('project_edited', { name, oldName })
    setEditingId(null)
    setEditName('')
    setEditGithubRepo('')
  }

  const handleDelete = (project) => {
    if (window.confirm('Decommission this project board? All tasks will be removed.')) {
      const name = project.name
      dispatch({ type: 'DELETE_PROJECT', payload: { id: project.id } })
      sendDiscordUpdate('project_deleted', { name })
    }
  }

  const startEdit = (project) => {
    setEditingId(project.id)
    setEditName(project.name)
    setEditGithubRepo(project.githubRepo ?? '')
  }

  const taskCount = (projectId) => (state.tasks[projectId] ?? []).length
  const completedCount = (projectId) =>
    (state.tasks[projectId] ?? []).filter((t) => t.status === 'done').length

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <h1 className="dashboard-title">MISSION DASHBOARD</h1>
        <p className="dashboard-subtitle">Select a project board or deploy a new one</p>
      </div>

      <div className="dashboard-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAdd(true)}
        >
          + Deploy new board
        </button>
      </div>

      {showAdd && (
        <div className="panel dashboard-form-panel">
          <div className="panel-header">NEW PROJECT BOARD</div>
          <form onSubmit={handleAdd} className="dashboard-form">
            <label className="dashboard-form-label">
              <span>Board name</span>
              <input
                type="text"
                className="input"
                placeholder="e.g. Alpha"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </label>
            <label className="dashboard-form-label">
              <span>GitHub repo (optional)</span>
              <input
                type="text"
                className="input"
                placeholder="owner/repo or full URL — commit hash for this board"
                value={newGithubRepo}
                onChange={(e) => setNewGithubRepo(e.target.value)}
              />
            </label>
            <div className="dashboard-form-actions">
              <button type="submit" className="btn btn-primary">Create</button>
              <button type="button" className="btn" onClick={() => { setShowAdd(false); setNewName(''); setNewGithubRepo(''); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="dashboard-grid">
        {state.projects.length === 0 && !showAdd && (
          <div className="dashboard-empty">
            <span className="dashboard-empty-icon">🛸</span>
            <p>No project boards yet. Deploy your first one above.</p>
          </div>
        )}
        {state.projects.map((project) => (
          <div key={project.id} className="panel dashboard-card">
            {editingId === project.id ? (
              <form onSubmit={handleEdit} className="dashboard-card-edit">
                <label className="dashboard-form-label">
                  <span>Board name</span>
                  <input
                    type="text"
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                </label>
                <label className="dashboard-form-label">
                  <span>GitHub repo (optional)</span>
                  <input
                    type="text"
                    className="input"
                    placeholder="owner/repo"
                    value={editGithubRepo}
                    onChange={(e) => setEditGithubRepo(e.target.value)}
                  />
                </label>
                <div className="dashboard-card-edit-actions">
                  <button type="submit" className="btn btn-primary">Save</button>
                  <button type="button" className="btn" onClick={() => { setEditingId(null); setEditName(''); setEditGithubRepo(''); }}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="dashboard-card-header">
                  <h2 className="dashboard-card-title">{project.name}</h2>
                  <div className="dashboard-card-meta">
                    <span>{completedCount(project.id)} / {taskCount(project.id)} tasks</span>
                    {(project.githubRepo ?? '').trim() && (
                      <span className="dashboard-card-repo" title={project.githubRepo}>Repo linked</span>
                    )}
                  </div>
                </div>
                <div className="dashboard-card-actions">
                  <Link to={`/board/${project.id}`} className="btn btn-primary dashboard-card-open">
                    Open board
                  </Link>
                  <button type="button" className="btn" onClick={() => startEdit(project)}>Edit</button>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(project)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <EmergencyProtocols />
    </div>
  )
}
