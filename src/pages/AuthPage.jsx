import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, GitBranch, Mail, Lock, User, Building2, ChevronRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { auth } from '../firebase/config'
import { registerWithEmail, loginWithEmail, loginWithGithub, completeGithubProfile, getUserRole } from '../firebase/auth'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] } }),
}

export default function AuthPage({ mode, navigate }) {
  const { setRole: setAuthRole } = useAuth()
  const [tab, setTab]           = useState('signin')
  const [role, setRole]         = useState(mode)
  const [form, setForm]         = useState({ name: '', email: '', password: '', company: '', stack: '' })
  const [error, setError]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (tab === 'register') {
        if (!form.name.trim()) throw new Error('Name is required')
        if (!form.email.trim()) throw new Error('Email is required')
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters')

        await registerWithEmail(
          form.email,
          form.password,
          form.name,
          role,
          { company: form.company, stack: form.stack }
        )

        setAuthRole(role)
      } else {
        if (!form.email.trim()) throw new Error('Email is required')
        if (!form.password.trim()) throw new Error('Password is required')

        const user = await loginWithEmail(form.email, form.password)
        const existingRole = await getUserRole(user.uid)
        if (existingRole) setAuthRole(existingRole)
      }
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'This email is already registered. Try signing in.'
        : err.code === 'auth/invalid-credential' ? 'Invalid email or password.'
        : err.code === 'auth/user-not-found' ? 'No account found with this email.'
        : err.code === 'auth/wrong-password' ? 'Incorrect password.'
        : err.code === 'auth/too-many-requests' ? 'Too many attempts. Please wait and try again.'
        : err.message || 'Something went wrong. Please try again.'
      setError(msg)
      setSubmitting(false)
    }
  }

  const handleGithub = async () => {
    setError('')
    setSubmitting(true)
    try {
      const result = await loginWithGithub()
      if (result.needsRole) {
        await completeGithubProfile(result.user, role)
        setAuthRole(role)
      } else {
        setAuthRole(result.role)
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'GitHub sign-in failed.')
      }
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="min-h-screen flex"
    >
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-105 shrink-0 border-r border-white/6 bg-white/1">
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-sm text-[#6B6966] mt-3 hover:text-[#A09E9A] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <p className="text-xs tracking-widest uppercase text-[#C8FF00] mb-6">RefHire</p>
          <blockquote
            className="text-2xl font-bold leading-snug text-[#E8E6E1] mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            "The best hires come from trusted networks. We built the infrastructure <br></br>for that trust."
          </blockquote>
          <p className="text-sm text-[#6B6966]">— RefHire founding principle</p>
        </div>

        <div className="space-y-3 mb-2">
          {[
            { icon: Lock, text: 'Zero-knowledge identity by default' },
            { icon: GitBranch, text: 'Proof-of-work via GitHub & LeetCode' },
            { icon: Building2, text: 'Corporate email verification' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-xs text-[#6B6966]">
              <Icon size={13} className="text-[#C8FF00] shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="w-full max-w-sm"
        >
          {/* Mobile back */}
          <button
            onClick={() => navigate('landing')}
            className="lg:hidden flex items-center gap-2 text-xs text-[#6B6966] hover:text-[#A09E9A] transition-colors mb-8"
          >
            <ArrowLeft size={13} /> Back
          </button>

          {/* Role toggle */}
          <div className="flex border border-white/8 rounded-sm mb-8 p-0.5 gap-0.5">
            {[
              { id: 'candidate', label: 'Job seeker' },
              { id: 'employee', label: 'Referrer' },
              { id: 'hiring', label: 'Hiring' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setRole(id); setError('') }}
                className={`flex-1 py-2 text-[11px] font-medium transition-all duration-200 rounded-sm ${
                  role === id
                    ? 'bg-[#C8FF00] text-[#0A0A0B]'
                    : 'text-[#6B6966] hover:text-[#A09E9A]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab switch */}
          <div className="flex gap-6 mb-8 border-b border-white/6 pb-4">
            {['signin', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`text-sm font-medium ml-20 transition-colors duration-200 ${
                  tab === t
                    ? 'text-[#E8E6E1] border-b-2 border-[#C8FF00]'
                    : 'text-[#6B6966] hover:text-[#A09E9A]'
                }`}
              >
                {t === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2.5 mb-4"
            >
              <AlertCircle size={13} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-400">{error}</span>
            </motion.div>
          )}

          <motion.form
            key={tab + role}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {tab === 'register' && (
              <Field icon={User} name="name" placeholder="Full name" value={form.name} onChange={handleChange} />
            )}

            <Field icon={Mail} name="email" type="email" placeholder="Work email" value={form.email} onChange={handleChange} />
            <Field icon={Lock} name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />

            {tab === 'register' && role === 'employee' && (
              <>
                <Field icon={Building2} name="company" placeholder="Company (will be anonymised)" value={form.company} onChange={handleChange} />
                <div className="relative">
                  <textarea
                    name="stack"
                    placeholder="Your team's tech stack (e.g. React, Node.js, AWS)"
                    value={form.stack}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-white/3 border border-white/8 text-sm text-[#E8E6E1] placeholder-[#3D3B38] px-4 py-3 rounded-sm focus:outline-none focus:border-[#C8FF00]/50 transition-colors resize-none"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group w-full flex items-center justify-center gap-2 bg-[#C8FF00] text-[#0A0A0B] font-semibold py-3 rounded-sm text-sm hover:bg-[#D4FF26] transition-colors duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-[#0A0A0B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {tab === 'signin' ? 'Sign in' : 'Create account'}
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/6" />
              <span className="text-xs text-[#3D3B38]">or continue with</span>
              <div className="flex-1 h-px bg-white/6" />
            </div>

            <button
              type="button"
              onClick={handleGithub}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 border border-white/8 text-[#A09E9A] hover:text-[#E8E6E1] hover:border-white/20 py-3 rounded-sm text-sm transition-colors duration-200 disabled:opacity-50"
            >
              <GitBranch size={14} />
              GitHub
            </button>
          </motion.form>
        </motion.div>
      </div>
    </motion.div>
  )
}

function Field({ icon: Icon, name, type = 'text', placeholder, value, onChange }) {
  return (
    <div className="relative">
      <Icon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3D3B38]" />
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-white/3 border border-white/8 text-sm text-[#E8E6E1] placeholder-[#3D3B38] pl-9 pr-4 py-3 rounded-sm focus:outline-none focus:border-[#C8FF00]/50 transition-colors"
      />
    </div>
  )
}
