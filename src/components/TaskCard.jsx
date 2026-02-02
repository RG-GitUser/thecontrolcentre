import { useState } from 'react'
import { fetchLatestCommit, ELSI_REPO } from '../services/discord'
import './TaskCard.css'

export default function TaskCard({ task, statusLabels, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [status, setStatus] = useState(task.status)
  const [pulledCommit, setPulledCommit] = useState(null)
  const [pullCommitLoading, setPullCommitLoading] = useState(false)

  const handlePullCommit = async () => {
    setPullCommitLoading(true)
    setPulledCommit(null)
    try {
      const sha = await fetchLatestCommit(ELSI_REPO)
      setPulledCommit(sha || null)
    } finally {
      setPullCommitLoading(false)
    }
  }

  const handleSave = () => {
    const t = title.trim()
    if (!t) return
    onEdit({ title: t, description: description.trim(), status, overrideCommit: pulledCommit || undefined })
    setEditing(false)
    setPulledCommit(null)
  }

  const handleStatusChange = (e) => {
    const newStatus = e.target.value
    setStatus(newStatus)
    onEdit({ status: newStatus })
  }

  if (editing) {
    return (
      <div className="task-card task-card-editing panel">
        <input
          type="text"
          className="input task-card-edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
        <textarea
          className="input task-card-edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={2}
        />
        <select
          className="input task-card-edit-status"
          value={status}
          onChange={handleStatusChange}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <div className="task-card-commit-row">
          <button type="button" className="btn task-card-pull-btn" onClick={handlePullCommit} disabled={pullCommitLoading}>
            {pullCommitLoading ? '…' : 'Pull latest commit'}
          </button>
          {pulledCommit && <span className="task-card-commit-value">Elsi (main): <code>{pulledCommit}</code></span>}
        </div>
        <div className="task-card-edit-actions">
          <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
          <button type="button" className="btn" onClick={() => { setEditing(false); setTitle(task.title); setDescription(task.description ?? ''); setStatus(task.status); setPulledCommit(null); }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="task-card panel">
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <select
          className="task-card-status-select"
          value={task.status}
          onChange={(e) => onEdit({ status: e.target.value })}
          title="Change status"
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}
      <div className="task-card-actions">
        <button type="button" className="btn task-card-btn" onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className="btn btn-danger task-card-btn" onClick={() => onDelete()}>Delete</button>
      </div>
    </div>
  )
}
