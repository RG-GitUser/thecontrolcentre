import { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import { getSettings } from '../settings/useSettings'
import { sendDiscordUpdate } from '../services/discord'
import './EmergencyProtocols.css'

const MAX_FILES = 3
const MAX_FILE_BYTES = 400 * 1024 // 400KB

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function formatDescriptionWithTags(text, members) {
  if (!text) return ''
  const escaped = escapeHtml(text)
  if (!members?.length) return escaped.replace(/\n/g, '<br/>')
  const names = members.map((m) => m.name).filter(Boolean).sort((a, b) => b.length - a.length)
  let out = escaped
  for (const name of names) {
    const safe = escapeHtml(name)
    const re = new RegExp(`@${safe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
    out = out.replace(re, `<span class="protocol-tag">@${safe}</span>`)
  }
  return out.replace(/\n/g, '<br/>')
}

function formatDate(ts) {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function EmergencyProtocols() {
  const { state, dispatch } = useStore()
  const settings = getSettings()
  const members = settings.teamMembers ?? []
  const currentId = settings.currentUserId

  const [showAdd, setShowAdd] = useState(false)
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [fileError, setFileError] = useState('')
  const descriptionRef = useRef(null)

  const protocols = [...(state.protocols ?? [])].reverse()
  const protocolFiles = state.protocolFiles ?? {}

  const insertTag = (name) => {
    const el = descriptionRef.current
    if (!el) {
      setDescription((d) => d + ` @${name} `)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const insert = ` @${name} `
    const next = description.slice(0, start) + insert + description.slice(end)
    setDescription(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + insert.length, start + insert.length)
    }, 0)
  }

  const onFileChange = (e) => {
    setFileError('')
    const chosen = Array.from(e.target.files ?? [])
    if (chosen.length + files.length > MAX_FILES) {
      setFileError(`Max ${MAX_FILES} files.`)
      e.target.value = ''
      return
    }
    for (const file of chosen) {
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`"${file.name}" is over ${MAX_FILE_BYTES / 1024}KB.`)
        e.target.value = ''
        return
      }
    }
    const readers = chosen.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () =>
          resolve({
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl: reader.result,
          })
        reader.readAsDataURL(file)
      })
    })
    Promise.all(readers).then((loaded) => {
      setFiles((prev) => [...prev, ...loaded].slice(0, MAX_FILES))
    })
    e.target.value = ''
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getAuthorName = (authorId) => {
    if (!authorId) return 'Crew'
    const m = members.find((x) => x.id === authorId)
    return m?.name ?? 'Crew'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const desc = description.trim()
    if (!desc) return
    const taggedIds = []
    const taggedNames = []
    for (const m of members) {
      if (!m.name) continue
      if (new RegExp(`@${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(desc)) {
        taggedIds.push(m.id)
        taggedNames.push(m.name)
      }
    }
    dispatch({
      type: 'ADD_PROTOCOL',
      payload: {
        description: desc,
        authorId: currentId,
        taggedUserIds: taggedIds,
        files,
      },
    })
    sendDiscordUpdate('protocol_added', {
      description: desc,
      authorId: currentId,
      authorName: getAuthorName(currentId),
      taggedUserIds: taggedIds,
      taggedNames,
      fileCount: files.length,
      fileNames: files.map((f) => f.name),
    })
    setDescription('')
    setFiles([])
    setShowAdd(false)
  }

  const handleDelete = (protocol) => {
    if (window.confirm('Remove this protocol entry?')) {
      dispatch({ type: 'DELETE_PROTOCOL', payload: { id: protocol.id } })
    }
  }

  return (
    <section className="emergency-protocols">
      <div className="emergency-protocols-header">
        <span className="emergency-protocols-icon">⚠</span>
        <h2 className="emergency-protocols-title">EMERGENCY PROTOCOLS!</h2>
        <p className="emergency-protocols-subtitle">Critical uploads &amp; crew tags — docs and images</p>
      </div>

      <div className="emergency-protocols-actions">
        <button
          type="button"
          className="btn emergency-btn"
          onClick={() => setShowAdd(true)}
        >
          + Upload protocol
        </button>
      </div>

      {showAdd && (
        <div className="panel emergency-protocols-form">
          <div className="panel-header emergency-form-header">NEW PROTOCOL ENTRY</div>
          <form onSubmit={handleSubmit} className="emergency-form">
            <label className="emergency-field">
              <span className="emergency-label">Description (tag crew with @)</span>
              <textarea
                ref={descriptionRef}
                className="input emergency-description"
                placeholder="e.g. @Alex please review the evacuation map. See attached."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <div className="emergency-tag-row">
                <span className="emergency-tag-label">Insert tag:</span>
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="btn emergency-tag-btn"
                    onClick={() => insertTag(m.name)}
                  >
                    @{m.name}
                  </button>
                ))}
                {members.length === 0 && <span className="emergency-tag-hint">Add team in Settings to tag.</span>}
              </div>
            </label>
            <label className="emergency-field">
              <span className="emergency-label">Attach files (docs &amp; images, max {MAX_FILES}, {MAX_FILE_BYTES / 1024}KB each)</span>
              <span className="emergency-file-row">
                <input
                  id="emergency-file-input"
                  type="file"
                  className="emergency-file-input"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg"
                  multiple
                  onChange={onFileChange}
                />
                <label htmlFor="emergency-file-input" className="btn emergency-file-btn">
                  Choose files
                </label>
              </span>
              {fileError && <p className="emergency-error">{fileError}</p>}
              {files.length > 0 && (
                <ul className="emergency-file-list">
                  {files.map((f, i) => (
                    <li key={i} className="emergency-file-item">
                      <span>{f.name}</span>
                      <button type="button" className="btn emergency-file-remove" onClick={() => removeFile(i)}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </label>
            <div className="emergency-form-actions">
              <button type="submit" className="btn btn-primary">Post protocol</button>
              <button type="button" className="btn" onClick={() => { setShowAdd(false); setDescription(''); setFiles([]); setFileError(''); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="emergency-protocols-list">
        {protocols.length === 0 && !showAdd && (
          <p className="emergency-empty">No protocol entries yet. Upload one above when something critical drops.</p>
        )}
        {protocols.map((protocol) => (
          <div key={protocol.id} className="panel emergency-protocol-card">
            <div className="emergency-card-header">
              <span className="emergency-card-badge">PROTOCOL</span>
              <span className="emergency-card-date">{formatDate(protocol.createdAt)}</span>
            </div>
            <div
              className="emergency-card-description"
              dangerouslySetInnerHTML={{
                __html: formatDescriptionWithTags(protocol.description, members),
              }}
            />
            {protocol.fileIds?.length > 0 && (
              <ul className="emergency-card-files">
                {protocol.fileIds.map((fid) => {
                  const f = protocolFiles[fid]
                  if (!f) return null
                  const isImage = (f.mimeType || '').startsWith('image/')
                  return (
                    <li key={fid} className="emergency-card-file">
                      {isImage ? (
                        <a href={f.dataUrl} target="_blank" rel="noopener noreferrer" className="emergency-file-link">
                          <img src={f.dataUrl} alt={f.name} className="emergency-thumb" />
                          <span>{f.name}</span>
                        </a>
                      ) : (
                        <a href={f.dataUrl} download={f.name} className="emergency-file-link">
                          📄 {f.name}
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="emergency-card-footer">
              <span className="emergency-card-author">Posted by {getAuthorName(protocol.authorId)}</span>
              {protocol.taggedUserIds?.length > 0 && (
                <span className="emergency-card-tagged">
                  Tagged: {protocol.taggedUserIds.map((id) => members.find((m) => m.id === id)?.name).filter(Boolean).join(', ')}
                </span>
              )}
              <button type="button" className="btn btn-danger emergency-card-delete" onClick={() => handleDelete(protocol)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
