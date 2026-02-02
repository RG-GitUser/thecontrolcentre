import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../lib/firebase'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [signUp, setSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
          className="login-video"
          src={`${baseUrl}assets/alienpals.mp4`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
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
