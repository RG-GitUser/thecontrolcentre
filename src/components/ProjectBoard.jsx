import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { sendDiscordUpdate, fetchLatestCommit, ELSI_REPO } from '../services/discord'
import TaskCard from './TaskCard'
import './ProjectBoard.css'

const STATUS_LABELS = { pending: 'Pending', 'in-progress': 'In progress', done: 'Done' }

export default function ProjectBoard() {
  const { projectId } = useParams()
  const { state, dispatch } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [pulledCommit, setPulledCommit] = useState(null)
  const [pullCommitLoading, setPullCommitLoading] = useState(false)

  const project = state.projects.find((p) => p.id === projectId)
  const tasks = state.tasks[projectId] ?? []

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

  const handleAddTask = (e) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    const description = newDescription.trim()
    dispatch({
      type: 'ADD_TASK',
      payload: { projectId, title, description },
    })
    sendDiscordUpdate('task_added', {
      title,
      description: description || undefined,
      status: 'Pending',
      projectName: project.name,
      projectRepo: project.githubRepo || undefined,
      overrideCommit: pulledCommit || undefined,
    })
    setNewTitle('')
    setNewDescription('')
    setPulledCommit(null)
    setShowAdd(false)
  }

  const handleEditTask = (task, updates) => {
    const { overrideCommit, ...rest } = updates
    const hadStatusChange = rest.status != null && rest.status !== task.status
    dispatch({
      type: 'EDIT_TASK',
      payload: { projectId, taskId: task.id, ...rest },
    })
    const statusLabels = { pending: 'Pending', 'in-progress': 'In progress', done: 'Done' }
    sendDiscordUpdate('task_edited', {
      title: rest.title ?? task.title,
      projectName: project.name,
      projectRepo: project.githubRepo || undefined,
      overrideCommit: overrideCommit || undefined,
      statusChange: hadStatusChange,
      oldStatus: hadStatusChange ? statusLabels[task.status] : undefined,
      newStatus: hadStatusChange ? statusLabels[rest.status] : undefined,
      details: rest.title != null && rest.title !== task.title ? `Title updated.` : undefined,
    })
  }

  const handleDeleteTask = (task) => {
    if (window.confirm('Remove this task?')) {
      dispatch({ type: 'DELETE_TASK', payload: { projectId, taskId: task.id } })
      sendDiscordUpdate('task_deleted', {
      title: task.title,
      projectName: project.name,
      projectRepo: project.githubRepo || undefined,
    })
    }
  }

  if (!project) {
    return (
      <div className="project-board project-board-missing">
        <p>Project board not found.</p>
        <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    )
  }

  const pending = tasks.filter((t) => t.status === 'pending')
  const inProgress = tasks.filter((t) => t.status === 'in-progress')
  const done = tasks.filter((t) => t.status === 'done')

  return (
    <div className="project-board">
      <div className="project-board-header">
        <div className="project-board-title-row">
          <Link to="/" className="project-board-back">← Dashboard</Link>
          <h1 className="project-board-title">{project.name}</h1>
        </div>
        <p className="project-board-subtitle">Progress board — add, edit, and track tasks</p>
      </div>

      <div className="project-board-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAdd(true)}
        >
          + Add task
        </button>
      </div>

      {showAdd && (
        <div className="panel project-board-add-panel">
          <div className="panel-header">NEW TASK</div>
          <form onSubmit={handleAddTask} className="project-board-add-form">
            <input
              type="text"
              className="input"
              placeholder="Task title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <textarea
              className="input project-board-add-desc"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
            />
            <div className="project-board-commit-row">
              <button type="button" className="btn" onClick={handlePullCommit} disabled={pullCommitLoading}>
                {pullCommitLoading ? '…' : 'Pull latest commit'}
              </button>
              {pulledCommit && <span className="project-board-commit-value">Elsi (main): <code>{pulledCommit}</code></span>}
            </div>
            <div className="project-board-add-actions">
              <button type="submit" className="btn btn-primary">Add task</button>
              <button type="button" className="btn" onClick={() => { setShowAdd(false); setNewTitle(''); setNewDescription(''); setPulledCommit(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="project-board-columns">
        <div className="project-board-column">
          <div className="project-board-column-header">
            <span className="project-board-column-badge">PENDING</span>
            <span className="project-board-column-count">{pending.length}</span>
          </div>
          <div className="project-board-column-list">
            {pending.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                statusLabels={STATUS_LABELS}
                onEdit={(updates) => handleEditTask(task, updates)}
                onDelete={() => handleDeleteTask(task)}
              />
            ))}
            {pending.length === 0 && <div className="project-board-empty-col">No tasks</div>}
          </div>
        </div>
        <div className="project-board-column">
          <div className="project-board-column-header in-progress">
            <span className="project-board-column-badge">IN PROGRESS</span>
            <span className="project-board-column-count">{inProgress.length}</span>
          </div>
          <div className="project-board-column-list">
            {inProgress.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                statusLabels={STATUS_LABELS}
                onEdit={(updates) => handleEditTask(task, updates)}
                onDelete={() => handleDeleteTask(task)}
              />
            ))}
            {inProgress.length === 0 && <div className="project-board-empty-col">No tasks</div>}
          </div>
        </div>
        <div className="project-board-column">
          <div className="project-board-column-header done">
            <span className="project-board-column-badge">DONE</span>
            <span className="project-board-column-count">{done.length}</span>
          </div>
          <div className="project-board-column-list">
            {done.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                statusLabels={STATUS_LABELS}
                onEdit={(updates) => handleEditTask(task, updates)}
                onDelete={() => handleDeleteTask(task)}
              />
            ))}
            {done.length === 0 && <div className="project-board-empty-col">No tasks</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
