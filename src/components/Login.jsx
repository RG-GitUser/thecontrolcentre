import { useState, useRef } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../lib/firebase'
import './Login.css'

const LOOP_BUFFER = 0.15 // seconds before end to start next video

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [signUp, setSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const videoARef = useRef(null)
  const videoBRef = useRef(null)
  const activeRef = useRef('A')
  const switchingRef = useRef(false)

  const switchTo = (which) => {
    if (switchingRef.current) return
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    switchingRef.current = true
    if (which === 'B') {
      a.pause()
      b.currentTime = 0
      b.play().catch(() => {})
      a.style.opacity = '0'
      b.style.opacity = '1'
      activeRef.current = 'B'
    } else {
      b.pause()
      a.currentTime = 0
      a.play().catch(() => {})
      b.style.opacity = '0'
      a.style.opacity = '1'
      activeRef.current = 'A'
    }
    setTimeout(() => { switchingRef.current = false }, 300)
  }

  const onTimeUpdateA = () => {
    const v = videoARef.current
    if (v && activeRef.current === 'A' && v.duration && v.currentTime >= v.duration - LOOP_BUFFER) switchTo('B')
  }
  const onTimeUpdateB = () => {
    const v = videoBRef.current
    if (v && activeRef.current === 'B' && v.duration && v.currentTime >= v.duration - LOOP_BUFFER) switchTo('A')
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const em = email.trim()
    const pw = password
    if (!em || !pw) {
      setError('Enter email and password.')
      return
    }
    if (signUp && !displayName.trim()) {
      setError('Enter a display name.')
      return
    }
    setLoading(true)
    try {
      if (signUp) {
        const cred = await createUserWithEmailAndPassword(auth, em, pw)
        if (displayName.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim() })
        }
      } else {
        await signInWithEmailAndPassword(auth, em, pw)
      }
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
        ? 'Invalid email or password.'
        : err.code === 'auth/email-already-in-use'
          ? 'That email is already in use.'
          : err.code === 'auth/weak-password'
            ? 'Use a longer password (min 6 characters).'
            : err.message || 'Login failed.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const baseUrl = import.meta.env.BASE_URL || '/'

  return (
    <div className="login">
      <div className="login-video-wrap">
        <video
          ref={videoARef}
          className="login-video login-video-a"
          src={`${baseUrl}assets/controlcentre (1).mp4`}
          autoPlay
          muted
          playsInline
          preload="auto"
          onTimeUpdate={onTimeUpdateA}
          aria-hidden
        />
        <video
          ref={videoBRef}
          className="login-video login-video-b"
          src={`${baseUrl}assets/controlcentre (1).mp4`}
          muted
          playsInline
          preload="auto"
          onTimeUpdate={onTimeUpdateB}
          aria-hidden
        />
      </div>
      <div className="login-panel panel">
        <div className="login-header">
          <span className="login-brand">◈ THE CONTROL CENTRE</span>
          <span className="login-title">{signUp ? 'Create account' : 'Sign in'}</span>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            <span className="login-label">Email</span>
            <input
              type="email"
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </label>
          {signUp && (
            <label className="login-field">
              <span className="login-label">Display name</span>
              <input
                type="text"
                className="input"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </label>
          )}
          <label className="login-field">
            <span className="login-label">Password</span>
            <input
              type="password"
              className="input"
              placeholder={signUp ? 'Min 6 characters' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={signUp ? 'new-password' : 'current-password'}
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? '…' : signUp ? 'Create account' : 'Sign in'}
          </button>
          <button
            type="button"
            className="btn login-toggle"
            onClick={() => { setSignUp(!signUp); setError(''); }}
          >
            {signUp ? 'Already have an account? Sign in' : 'Create an account'}
          </button>
        </form>
      </div>
    </div>
  )
}
