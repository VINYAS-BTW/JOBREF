import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import CandidateDashboard from './pages/CandidateDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'

export default function App() {
  const [view, setView] = useState('landing') // landing | auth | candidate | employee
  const [authMode, setAuthMode] = useState('candidate') // candidate | employee

  const navigate = (to, mode) => {
    if (mode) setAuthMode(mode)
    setView(to)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E8E6E1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <AnimatePresence mode="wait">
        {view === 'landing' && <LandingPage key="landing" navigate={navigate} />}
        {view === 'auth' && <AuthPage key="auth" mode={authMode} navigate={navigate} />}
        {view === 'candidate' && <CandidateDashboard key="candidate" navigate={navigate} />}
        {view === 'employee' && <EmployeeDashboard key="employee" navigate={navigate} />}
      </AnimatePresence>
    </div>
  )
}