import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubRole = null

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubRole) { unsubRole(); unsubRole = null }

      if (firebaseUser) {
        setUser(firebaseUser)
        unsubRole = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            setRole(snap.data().role)
          }
          setLoading(false)
        }, () => {
          setLoading(false)
        })
      } else {
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    })

    return () => {
      unsubAuth()
      if (unsubRole) unsubRole()
    }
  }, [])

  const forceRole = useCallback((r) => setRole(r), [])

  const value = { user, role, setRole: forceRole, loading }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
