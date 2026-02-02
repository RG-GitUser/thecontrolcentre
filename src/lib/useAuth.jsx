import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from './firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signOut = () => {
    firebaseSignOut(auth)
  }

  return { user, loading, signOut }
}

export function getCurrentUserDisplayName() {
  const u = auth.currentUser
  if (!u) return null
  return u.displayName?.trim() || u.email || null
}
