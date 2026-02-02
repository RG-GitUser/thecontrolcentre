import { createContext, useContext, useReducer, useEffect } from 'react'

const STORAGE_KEY = 'controlcenter-tracker'

const initialState = {
  projects: [],
  tasks: {},
  protocols: [],
  protocolFiles: {},
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const data = JSON.parse(raw)
    const projects = (data.projects ?? []).map((p) => ({
      ...p,
      githubRepo: p.githubRepo ?? '',
    }))
    return {
      projects,
      tasks: data.tasks ?? {},
      protocols: data.protocols ?? [],
      protocolFiles: data.protocolFiles ?? {},
    }
  } catch {
    return initialState
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to save state', e)
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PROJECT': {
      const id = crypto.randomUUID()
      const projects = [
        ...state.projects,
        {
          id,
          name: action.payload.name,
          githubRepo: action.payload.githubRepo ?? '',
          createdAt: Date.now(),
        },
      ]
      const tasks = { ...state.tasks, [id]: [] }
      return { ...state, projects, tasks }
    }

    case 'EDIT_PROJECT': {
      const projects = state.projects.map((p) =>
        p.id === action.payload.id
          ? {
              ...p,
              name: action.payload.name ?? p.name,
              githubRepo: action.payload.githubRepo !== undefined ? action.payload.githubRepo : p.githubRepo,
            }
          : p
      )
      return { ...state, projects }
    }

    case 'DELETE_PROJECT': {
      const { [action.payload.id]: _, ...restTasks } = state.tasks
      const projects = state.projects.filter((p) => p.id !== action.payload.id)
      return { ...state, projects, tasks: restTasks }
    }

    case 'ADD_TASK': {
      const { projectId, title, description = '' } = action.payload
      const task = {
        id: crypto.randomUUID(),
        projectId,
        title,
        description,
        status: 'pending',
        createdAt: Date.now(),
      }
      const list = state.tasks[projectId] ?? []
      const tasks = { ...state.tasks, [projectId]: [...list, task] }
      return { ...state, tasks }
    }

    case 'EDIT_TASK': {
      const { projectId, taskId, title, description, status } = action.payload
      const list = (state.tasks[projectId] ?? []).map((t) =>
        t.id === taskId
          ? { ...t, title: title ?? t.title, description: description ?? t.description, status: status ?? t.status }
          : t
      )
      const tasks = { ...state.tasks, [projectId]: list }
      return { ...state, tasks }
    }

    case 'DELETE_TASK': {
      const { projectId, taskId } = action.payload
      const list = (state.tasks[projectId] ?? []).filter((t) => t.id !== taskId)
      const tasks = { ...state.tasks, [projectId]: list }
      return { ...state, tasks }
    }

    case 'ADD_PROTOCOL': {
      const { description, authorId, taggedUserIds, files } = action.payload
      const protocolId = crypto.randomUUID()
      const fileIds = []
      const protocolFiles = { ...state.protocolFiles }
      for (const f of files ?? []) {
        const fid = crypto.randomUUID()
        fileIds.push(fid)
        protocolFiles[fid] = { name: f.name, mimeType: f.mimeType, size: f.size, dataUrl: f.dataUrl }
      }
      const protocols = [
        ...(state.protocols ?? []),
        {
          id: protocolId,
          description: description ?? '',
          authorId,
          taggedUserIds: taggedUserIds ?? [],
          fileIds,
          createdAt: Date.now(),
        },
      ]
      return { ...state, protocols, protocolFiles }
    }

    case 'DELETE_PROTOCOL': {
      const { id } = action.payload
      const protocol = (state.protocols ?? []).find((p) => p.id === id)
      const protocolFiles = { ...state.protocolFiles }
      for (const fid of protocol?.fileIds ?? []) {
        delete protocolFiles[fid]
      }
      const protocols = (state.protocols ?? []).filter((p) => p.id !== id)
      return { ...state, protocols, protocolFiles }
    }

    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, loadState())

  useEffect(() => {
    if (
      state.projects.length > 0 ||
      Object.keys(state.tasks).length > 0 ||
      state.protocols?.length > 0 ||
      Object.keys(state.protocolFiles ?? {}).length > 0
    ) {
      saveState(state)
    }
  }, [state])

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
