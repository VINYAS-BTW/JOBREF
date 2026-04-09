import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import CandidateDashboard from './pages/CandidateDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import HiringDashboard from './pages/HiringDashboard'
import { signOut } from './firebase/auth'

export default function App() {
  const { user, role, loading } = useAuth()
  const [view, setView]       = useState('landing')
  const [authMode, setAuthMode] = useState('candidate')

  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'candidate') setView('candidate')
      else if (role === 'hiring') setView('hiring')
      else setView('employee')
    }
    if (!loading && !user) {
      setView('landing')
    }
  }, [user, role, loading])

  const navigate = async (to, mode) => {
    if (to === 'landing' && user) {
      await signOut()
      setView('landing')
      return
    }
    if (mode) setAuthMode(mode)
    setView(to)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111315] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#C8FF00] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#6B6966] tracking-widest uppercase">Loading</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111315] text-[#E8E6E1]" style={{ fontFamily: 'var(--font-info)' }}>
      <AnimatePresence mode="wait">
        {view === 'landing'   && <LandingPage key="landing" navigate={navigate} />}
        {view === 'auth'      && <AuthPage key="auth" mode={authMode} navigate={navigate} />}
        {view === 'candidate' && <CandidateDashboard key="candidate" navigate={navigate} />}
        {view === 'employee'  && <EmployeeDashboard key="employee" navigate={navigate} />}
        {view === 'hiring'    && <HiringDashboard key="hiring" navigate={navigate} />}
      </AnimatePresence>
    </div>
  )
}
