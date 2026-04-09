import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, TrendingUp, LogOut, CheckCircle, X,
  Star, Shield, Code2, Lock, Users, Zap,
  DollarSign, Mail, ArrowRight,
  BarChart2, Activity, GitBranch, Terminal,
  Target, Layers, Clock, Briefcase, Mic,
  Sparkles, ChevronRight, ChevronDown, Settings, HelpCircle,
  AlertCircle, Award, LayoutDashboard, BrainCircuit, RefreshCw, Search
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  subscribeEmployeeProfile,
  subscribeEmployeeInbox,
  subscribeEmployeePipeline,
  subscribeAllCandidates,
  subscribeEmployeeShadowInterviews,
  getCandidateProfile,
  acceptRequest,
  declineRequest,
  updateEmployeeProfile,
} from '../firebase/firestore'
import { timeAgo } from '../firebase/utils'
import { fetchAPI } from '../services/api'

// ── Design Tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:           '#111315',
  surface:      'rgba(255,255,255,0.02)',
  surfaceHover: 'rgba(255,255,255,0.035)',
  border:       'rgba(255,255,255,0.06)',
  borderHover:  'rgba(255,255,255,0.11)',
  muted:        '#3D3B38',
  subtle:       '#6B6966',
  secondary:    '#A09E9A',
  primary:      '#E8E6E1',
  accent:       '#C8FF00',
  accentDim:    'rgba(200,255,0,0.08)',
  accentBorder: 'rgba(200,255,0,0.22)',
  amber:        '#F59E0B',
  amberDim:     'rgba(245,158,11,0.08)',
  amberBorder:  'rgba(245,158,11,0.2)',
  red:          '#EF4444',
  emerald:      '#10B981',
  emeraldDim:   'rgba(16,185,129,0.08)',
  emeraldBorder:'rgba(16,185,129,0.2)',
}

const heading = { fontFamily: 'var(--font-heading)' }
const serif = { fontFamily: 'var(--font-maininfo)' }

const STAGES = ['Referred', 'Screening', 'Interview', 'Offer', 'Hired']

const STATUS_CFG = {
  hired:         { label: 'Hired',          color: C.emerald, bg: C.emeraldDim, border: C.emeraldBorder },
  offer_extended:{ label: 'Offer Extended', color: C.accent,  bg: C.accentDim,  border: C.accentBorder  },
  interviewing:  { label: 'Interviewing',   color: C.amber,   bg: C.amberDim,   border: C.amberBorder   },
  referred:      { label: 'Referred',       color: C.accent,  bg: C.accentDim,  border: C.accentBorder  },
  declined:      { label: 'Declined',       color: C.subtle,  bg: C.surface,    border: C.border        },
}

// ── Animation Presets ──────────────────────────────────────────────────────────
const stagger   = { show: { transition: { staggerChildren: 0.065 } } }
const fadeUp    = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } }

// ── Heatmap ────────────────────────────────────────────────────────────────────
function Heatmap({ data }) {
  const col = v => ['rgba(255,255,255,0.04)','rgba(200,255,0,0.15)','rgba(200,255,0,0.32)','rgba(200,255,0,0.58)',C.accent][v] || C.accent
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Activity size={10} style={{ color: C.accent }} />
        <span className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>Contribution Activity · 12 weeks</span>
      </div>
      <div className="flex gap-0.5">
        {data.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((d, di) => <div key={di} className="w-2 h-2 rounded-xs" style={{ background: col(d) }} />)}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[9px]" style={{ color: C.muted }}>12w ago</span>
        <span className="text-[9px]" style={{ color: C.muted }}>today</span>
      </div>
    </div>
  )
}

// ── Language Bar ───────────────────────────────────────────────────────────────
function LangBar({ languages }) {
  const cols = [C.accent, 'rgba(200,255,0,0.42)', 'rgba(200,255,0,0.18)']
  return (
    <div>
      <div className="flex h-1 rounded-full overflow-hidden gap-px">
        {languages.map((l, i) => <div key={l.lang} style={{ width: `${l.pct}%`, background: cols[i] }} />)}
      </div>
      <div className="flex gap-3 mt-1.5">
        {languages.map((l, i) => (
          <div key={l.lang} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: cols[i] }} />
            <span className="text-[9px]" style={{ color: C.subtle }}>{l.lang} {l.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.declined
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-sm"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  )
}

// ── Pipeline Dots ──────────────────────────────────────────────────────────────
function PipelineDots({ stage, total = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className="w-1.5 h-1.5 rounded-full transition-colors"
            style={{ background: i < stage ? C.accent : C.border }} />
          {i < total - 1 && <div className="w-4 h-px mx-0.5" style={{ background: i < stage - 1 ? C.accent : C.border }} />}
        </div>
      ))}
    </div>
  )
}

function generateMockGitBranch(skills) {
  const topLang = skills?.[0] || 'JavaScript'
  const commits = 150 + Math.floor(Math.random() * 350)
  return {
    commits,
    topLang,
    streak: 10 + Math.floor(Math.random() * 60),
    repos: 8 + Math.floor(Math.random() * 25),
    contributions: Array.from({ length: 12 }, () =>
      Array.from({ length: 7 }, () => Math.floor(Math.random() * 5))
    ),
    languages: (skills || ['JavaScript']).slice(0, 3).map((s, i) => ({
      lang: s,
      pct: Math.max(10, 60 - i * 20 + Math.floor(Math.random() * 10)),
    })),
  }
}

function generateMockLeetCode() {
  const easy = 30 + Math.floor(Math.random() * 40)
  const medium = 50 + Math.floor(Math.random() * 130)
  const hard = 5 + Math.floor(Math.random() * 70)
  return {
    solved: easy + medium + hard,
    rating: 1300 + Math.floor(Math.random() * 600),
    hard,
    medium,
    easy,
  }
}

// ── Probability Gauge ─────────────────────────────────────────────────────────
function ProbGauge({ value, label, size = 72, color }) {
  const radius = (size - 6) / 2
  const circumference = Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size / 2 + 8 }}>
        <svg width={size} height={size / 2 + 8} style={{ overflow: 'visible' }}>
          <path
            d={`M ${3} ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - 3} ${size / 2 + 2}`}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} strokeLinecap="round"
          />
          <motion.path
            d={`M ${3} ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - 3} ${size / 2 + 2}`}
            fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0">
          <span className="text-lg font-bold" style={{ color, ...serif }}>{value}%</span>
        </div>
      </div>
      <span className="text-[10px] font-medium" style={{ color: C.subtle }}>{label}</span>
    </div>
  )
}

// ── Risk Badge ────────────────────────────────────────────────────────────────
function RiskBadge({ risk }) {
  const colors = {
    high:   { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#EF4444' },
    medium: { bg: C.amberDim, border: C.amberBorder, text: C.amber },
    low:    { bg: C.surface, border: C.border, text: C.subtle },
  }
  const c = colors[risk.severity] || colors.low
  return (
    <div className="rounded-sm p-3 flex items-start gap-2.5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <AlertCircle size={12} className="shrink-0 mt-0.5" style={{ color: c.text }} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold" style={{ color: c.text }}>{risk.label}</p>
        <p className="text-[10px] mt-0.5" style={{ color: C.subtle }}>{risk.detail}</p>
      </div>
      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm shrink-0"
        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
        {risk.severity}
      </span>
    </div>
  )
}

// ── Candidate Review Modal ─────────────────────────────────────────────────────
function CandidateModal({ candidate, onClose, onDecide, employeeProfile, onRequestInterview, interviewResult }) {
  const [tab, setTab]       = useState('overview')
  const [state, setState]   = useState('anon')
  const [action, setAction] = useState(null)
  const [simResult, setSimResult] = useState(null)
  const [simRunning, setSimRunning] = useState(false)
  const [interviewRequesting, setInterviewRequesting] = useState(false)

  const candidateId = candidate._candidateId || candidate.id
  const hasInterview = interviewResult?.status === 'evaluated'
  const interviewPending = interviewResult?.status === 'generated' || interviewResult?.status === 'submitted'

  const handleRequestInterview = async () => {
    setInterviewRequesting(true)
    const profile = candidate._candidateProfile || {}
    await onRequestInterview?.(
      candidateId,
      candidate.targetReq || candidate.role,
      profile.skills || candidate.skills || [],
      profile.yearsExperience || candidate.yoe || 2,
    )
    setInterviewRequesting(false)
  }

  const matchColor = candidate.match >= 80 ? C.accent : candidate.match >= 65 ? C.amber : C.subtle

  const runSimulation = async () => {
    setSimRunning(true)
    try {
      const result = await fetchAPI('/simulate-referral', {
        candidateId: candidateId,
        employeeId: employeeProfile?.id,
        targetRole: candidate.targetReq || candidate.role,
      })
      setSimResult(result)
      setTab('simulation')
    } catch (err) {
      console.error('Simulation failed:', err)
    } finally {
      setSimRunning(false)
    }
  }

  const handleDecline = () => {
    setAction('decline')
    setTimeout(() => { onDecide(candidate.id, 'decline'); onClose() }, 420)
  }

  const handleAccept = () => {
    setAction('accept')
    setState('deciding')
    setTimeout(() => setState('revealed'), 600)
  }

  const handleForward = () => {
    onDecide(candidate.id, 'accept')
    onClose()
  }

  const buildTabs = () => {
    if (state === 'revealed') return []
    const t = ['overview']
    if (hasInterview) t.push('interview')
    if (simResult) t.push('simulation')
    t.push('proof of work')
    return t
  }
  const tabs = buildTabs()

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,19,21,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.975, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.32, ease: [0.22,1,0.36,1] } }}
        exit={{ opacity: 0, scale: 0.975, y: 8, transition: { duration: 0.2 } }}
        className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-sm overflow-hidden"
        style={{ background: '#0D0D0E', border: `1px solid ${C.border}` }}
      >
        <div className="h-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${candidate.match}%` }}
            transition={{ duration: 0.85, ease: [0.22,1,0.36,1] }}
            style={{ height: '100%', background: matchColor }} />
        </div>

        <div className="flex items-start justify-between gap-4 p-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
              style={{ background: state === 'revealed' ? C.accentDim : C.surface,
                       border: `1px solid ${state === 'revealed' ? C.accentBorder : C.border}` }}>
              {state === 'revealed'
                ? <span className="text-sm font-bold" style={{ color: C.accent }}>{candidate.realName.split(' ').map(n=>n[0]).join('')}</span>
                : <Lock size={13} style={{ color: C.subtle }} />}
            </div>
            <div>
              <AnimatePresence mode="wait">
                {state === 'revealed' ? (
                  <motion.div key="revealed" initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold" style={{ color: C.primary }}>{candidate.realName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm"
                        style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accentBorder}` }}>
                        Identity Unlocked
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: C.subtle }}>{candidate.email} · {candidate.role}</span>
                  </motion.div>
                ) : (
                  <motion.div key="anon" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold" style={{ color: C.primary }}>{candidate.alias}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm"
                        style={{ background: C.surface, color: C.subtle, border: `1px solid ${C.border}` }}>
                        {candidate.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Target size={11} style={{ color: C.accent }} />
                      <span className="text-[10px]" style={{ color: C.secondary }}>Applying for:</span>
                      <span className="text-[10px] font-medium" style={{ color: C.primary }}>{candidate.targetReq}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xl font-bold" style={{ color: matchColor, ...serif }}>{candidate.match}%</div>
              <div className="text-[10px]" style={{ color: C.muted }}>AI match</div>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-sm transition-colors"
              style={{ color: C.subtle, border: `1px solid ${C.border}` }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {tabs.length > 0 && (
          <div className="flex items-center" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex flex-1">
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-5 py-2.5 text-xs font-medium capitalize transition-colors relative"
                  style={{ color: tab === t ? C.accent : C.subtle }}>
                  {t}
                  {tab === t && <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-px" style={{ background: C.accent }} />}
                </button>
              ))}
            </div>
            {!simResult && !simRunning && (
              <button onClick={runSimulation}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 mr-3 rounded-sm transition-all"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', color: '#A855F7' }}>
                <Zap size={10} /> Simulate Referral
              </button>
            )}
            {simRunning && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 mr-3 rounded-sm"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', color: '#A855F7' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Zap size={10} />
                </motion.div>
                Simulating...
              </div>
            )}
            {!interviewResult && !interviewRequesting && (
              <button onClick={handleRequestInterview}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 mr-3 rounded-sm transition-all"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', color: '#818CF8' }}>
                <Mic size={10} /> Request Interview
              </button>
            )}
            {interviewRequesting && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 mr-3 rounded-sm"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', color: '#818CF8' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw size={10} />
                </motion.div>
                Sending...
              </div>
            )}
            {interviewPending && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 mr-3 rounded-sm"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                <Clock size={10} /> Interview Pending
              </span>
            )}
            {hasInterview && (
              <button onClick={() => setTab('interview')}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 mr-3 rounded-sm transition-all"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
                <CheckCircle size={10} /> View Results
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">

            {state === 'revealed' && (
              <motion.div key="unlocked" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }} className="space-y-4">
                <div className="rounded-sm p-4 flex items-center gap-3" style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}` }}>
                  <CheckCircle size={16} style={{ color: C.accent }} />
                  <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: C.accent }}>Identity successfully revealed</p>
                    <p className="text-[11px]" style={{ color: C.secondary }}>This referral has been logged and will count toward your reputation score once submitted to HR.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-sm p-3 flex items-center justify-between" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-2">
                      <Mail size={12} style={{ color: C.subtle }} />
                      <span className="text-xs" style={{ color: C.primary }}>{candidate.realName}</span>
                    </div>
                  </div>
                  <div className="rounded-sm p-3 flex items-center gap-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <Mail size={12} style={{ color: C.subtle }} />
                    <span className="text-xs truncate" style={{ color: C.secondary }}>{candidate.email}</span>
                  </div>
                </div>
                {simResult && (
                  <div className="rounded-sm p-4" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#A855F7' }}>Simulation Summary</p>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-xs" style={{ color: C.secondary }}>Interview: <b style={{ color: C.primary }}>{simResult.interviewProbability}%</b></span>
                      <span className="text-xs" style={{ color: C.secondary }}>Hire: <b style={{ color: C.primary }}>{simResult.hireProbability}%</b></span>
                    </div>
                    <p className="text-[11px]" style={{ color: C.subtle }}>{simResult.explanation.suggestion}</p>
                  </div>
                )}
                <div className="rounded-sm p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: C.muted }}>What happens next</p>
                  {['Copy their contact and reach out directly', 'Submit to your HR or ATS system', 'You earn +0.05 reputation on confirmation', 'Bounty releases upon successful hire'].map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-1.5">
                      <div className="w-4 h-4 rounded-sm flex items-center justify-center shrink-0 text-[9px] font-bold"
                        style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accentBorder}` }}>{i+1}</div>
                      <span className="text-xs" style={{ color: C.secondary }}>{s}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {state !== 'revealed' && tab === 'overview' && (
              <motion.div key="overview" variants={stagger} initial="hidden" animate="show" exit={{ opacity:0 }} className="space-y-4">
                <motion.div variants={fadeUp} className="rounded-sm p-3.5 flex gap-2.5"
                  style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}` }}>
                  <Sparkles size={12} style={{ color: C.accent }} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.accent }}>AI Signal</p>
                    <p className="text-xs leading-relaxed" style={{ color: C.secondary }}>{candidate.aiInsight}</p>
                  </div>
                </motion.div>
                {candidate.pitch && (
                  <motion.div variants={fadeUp}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Mail size={10} style={{ color: C.accent }} />
                      <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: C.muted }}>Warm intro pitch</span>
                    </div>
                    <div className="rounded-sm p-4" style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.accentBorder}` }}>
                      <p className="text-sm leading-relaxed" style={{ color: C.secondary }}>"{candidate.pitch}"</p>
                    </div>
                  </motion.div>
                )}
                <motion.div variants={fadeUp}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Layers size={10} style={{ color: C.accent }} />
                    <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: C.muted }}>Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.map(s => (
                      <span key={s} className="text-[11px] px-2.5 py-1 rounded-sm"
                        style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.secondary }}>{s}</span>
                    ))}
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Commits', value: candidate.GitBranch?.commits ?? '—', sub: candidate.GitBranch ? `${candidate.GitBranch.streak}d streak` : '—', icon: GitBranch },
                    { label: 'LC Solved', value: candidate.leetcode?.solved ?? '—', sub: candidate.leetcode ? `Rating ${candidate.leetcode.rating}` : '—', icon: Code2 },
                    { label: 'Years Exp', value: candidate.yoe ?? '—', sub: candidate.role?.split(' ')[0] || '', icon: Briefcase },
                  ].map(({ label, value, sub, icon: Icon }) => (
                    <div key={label} className="rounded-sm p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon size={10} style={{ color: C.accent }} />
                        <span className="text-[10px]" style={{ color: C.muted }}>{label}</span>
                      </div>
                      <div className="text-base font-bold" style={{ color: C.primary, ...serif }}>{value}</div>
                      <div className="text-[10px]" style={{ color: C.muted }}>{sub}</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {state !== 'revealed' && tab === 'interview' && hasInterview && (
              <motion.div key="interview" variants={stagger} initial="hidden" animate="show" exit={{ opacity:0 }} className="space-y-4">
                {(() => {
                  const s = interviewResult.scores
                  const recColors = { strong_yes: C.accent, yes: '#10B981', maybe: '#F59E0B', no: '#EF4444' }
                  const recColor = recColors[s.recommendation] || C.subtle
                  return (
                    <>
                      {/* Recommendation badge */}
                      <motion.div variants={fadeUp} className="rounded-sm p-5 text-center" style={{ background: `${recColor}08`, border: `1px solid ${recColor}30` }}>
                        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: C.subtle }}>AI Recommendation</p>
                        <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-sm" style={{ color: recColor, background: `${recColor}18`, border: `1px solid ${recColor}40` }}>
                          {s.recLabel}
                        </span>
                        <p className="text-[22px] font-bold mt-3" style={{ color: recColor, ...serif }}>{s.overallScore}/100</p>
                        <p className="text-[10px] mt-0.5" style={{ color: C.subtle }}>Overall Score</p>
                      </motion.div>

                      {/* Score breakdown */}
                      <motion.div variants={fadeUp} className="rounded-sm p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                        <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: C.subtle }}>Score Breakdown</p>
                        <div className="space-y-2.5">
                          {[
                            { label: 'Technical',     value: s.technicalScore,     color: '#C8FF00' },
                            { label: 'Communication', value: s.communicationScore, color: '#818CF8' },
                            { label: 'Confidence',    value: s.confidenceScore,    color: '#F59E0B' },
                            { label: 'Behavioral',    value: s.behavioralScore,    color: '#A855F7' },
                          ].map(m => (
                            <div key={m.label}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px]" style={{ color: C.secondary }}>{m.label}</span>
                                <span className="text-[11px] font-bold" style={{ color: m.value >= 70 ? m.color : m.value >= 45 ? '#F59E0B' : C.subtle }}>
                                  {m.value}
                                </span>
                              </div>
                              <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }}
                                  transition={{ duration: 0.6, delay: 0.1 }}
                                  className="h-full rounded-full" style={{ background: m.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Strengths & Weaknesses */}
                      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
                        <div className="rounded-sm p-4" style={{ background: 'rgba(200,255,0,0.02)', border: '1px solid rgba(200,255,0,0.12)' }}>
                          <p className="text-[10px] uppercase tracking-widest mb-2 text-emerald-400">Strengths</p>
                          <div className="space-y-1.5">
                            {s.strengths.map((str, i) => (
                              <p key={i} className="text-[11px]" style={{ color: C.secondary }}>+ {str}</p>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-sm p-4" style={{ background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.12)' }}>
                          <p className="text-[10px] uppercase tracking-widest mb-2 text-red-400">Weaknesses</p>
                          <div className="space-y-1.5">
                            {s.weaknesses.map((w, i) => (
                              <p key={i} className="text-[11px]" style={{ color: C.secondary }}>- {w}</p>
                            ))}
                          </div>
                        </div>
                      </motion.div>

                      {/* AI Summary */}
                      <motion.div variants={fadeUp} className="rounded-sm p-4" style={{ background: 'rgba(168,85,247,0.03)', border: '1px solid rgba(168,85,247,0.15)' }}>
                        <p className="text-[10px] uppercase tracking-widest mb-2 text-purple-400">AI Summary</p>
                        <p className="text-[12px] leading-relaxed" style={{ color: C.secondary }}>{s.aiSummary}</p>
                      </motion.div>

                      {/* Per-question breakdown */}
                      {s.perQuestion && (
                        <motion.div variants={fadeUp} className="rounded-sm p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: C.subtle }}>Per-Question Results</p>
                          <div className="space-y-2">
                            {s.perQuestion.map((pq, i) => (
                              <div key={i} className="flex items-center justify-between gap-3 text-[11px] border-b pb-2" style={{ borderColor: C.border }}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                    pq.type === 'behavioral' ? 'bg-purple-500/15 text-purple-400' : 'bg-[#C8FF00]/10 text-[#C8FF00]'
                                  }`}>
                                    {i + 1}
                                  </span>
                                  <span className="truncate" style={{ color: C.secondary }}>{pq.question}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                                    pq.depth === 'deep' ? 'bg-emerald-500/10 text-emerald-400' :
                                    pq.depth === 'moderate' ? 'bg-amber-500/10 text-amber-400' :
                                    'bg-white/5 text-[#3D3B38]'
                                  }`}>{pq.depth}</span>
                                  <span className="font-bold" style={{ color: pq.techScore >= 70 ? C.accent : pq.techScore >= 45 ? '#F59E0B' : C.subtle }}>{pq.techScore}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </>
                  )
                })()}
              </motion.div>
            )}

            {state !== 'revealed' && tab === 'simulation' && simResult && (
              <motion.div key="simulation" variants={stagger} initial="hidden" animate="show" exit={{ opacity:0 }} className="space-y-4">
                {/* Probability gauges */}
                <motion.div variants={fadeUp} className="rounded-sm p-5" style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.18)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={12} style={{ color: '#A855F7' }} />
                    <span className="text-xs font-semibold" style={{ color: '#A855F7' }}>Referral Outcome Prediction</span>
                  </div>
                  <div className="flex items-center justify-around">
                    <ProbGauge value={simResult.matchScore} label="Match Score" color={simResult.matchScore >= 70 ? C.accent : simResult.matchScore >= 50 ? C.amber : C.subtle} />
                    <ProbGauge value={simResult.interviewProbability} label="Interview Chance" color={simResult.interviewProbability >= 60 ? C.emerald : C.amber} />
                    <ProbGauge value={simResult.hireProbability} label="Hire Chance" color={simResult.hireProbability >= 40 ? C.emerald : simResult.hireProbability >= 20 ? C.amber : C.subtle} />
                  </div>
                </motion.div>

                {/* Factor breakdown */}
                <motion.div variants={fadeUp} className="rounded-sm p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: C.muted }}>Score Breakdown</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Cosine Similarity (50%)', value: simResult.factors.cosineSimilarity },
                      { label: 'Experience Score (20%)', value: simResult.factors.experienceScore },
                      { label: 'Skill Match Score (20%)', value: simResult.factors.skillMatchScore },
                      { label: 'GitHub / Proof Score (10%)', value: simResult.factors.githubScore },
                    ].map((f, i) => {
                      const barColor = f.value >= 70 ? C.accent : f.value >= 45 ? C.amber : C.subtle
                      return (
                        <div key={f.label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px]" style={{ color: C.secondary }}>{f.label}</span>
                            <span className="text-[11px] font-semibold" style={{ color: C.primary }}>{f.value}%</span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${f.value}%` }}
                              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 * i }}
                              className="h-full rounded-full" style={{ background: barColor }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>

                {/* Critical skills */}
                <motion.div variants={fadeUp} className="rounded-sm p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: C.muted }}>
                    Critical Skills for {simResult.meta.targetRole}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {simResult.meta.criticalSkills.map(s => {
                      const matched = simResult.meta.matchedCritical.map(x => x.toLowerCase()).includes(s.toLowerCase())
                      return (
                        <span key={s} className="text-[11px] px-2.5 py-1 rounded-sm" style={{
                          background: matched ? C.accentDim : 'rgba(239,68,68,0.06)',
                          border: `1px solid ${matched ? C.accentBorder : 'rgba(239,68,68,0.18)'}`,
                          color: matched ? C.accent : '#EF4444',
                        }}>
                          {matched ? '✓' : '✗'} {s}
                        </span>
                      )
                    })}
                  </div>
                </motion.div>

                {/* Risk factors */}
                {simResult.riskFactors.length > 0 && (
                  <motion.div variants={fadeUp}>
                    <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: C.muted }}>Risk Factors ({simResult.riskFactors.length})</p>
                    <div className="space-y-2">
                      {simResult.riskFactors.map((r, i) => <RiskBadge key={i} risk={r} />)}
                    </div>
                  </motion.div>
                )}

                {/* AI Explanation */}
                <motion.div variants={fadeUp} className="rounded-sm overflow-hidden" style={{ border: '1px solid rgba(168,85,247,0.18)' }}>
                  <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'rgba(168,85,247,0.06)', borderBottom: '1px solid rgba(168,85,247,0.15)' }}>
                    <BrainCircuit size={12} style={{ color: '#A855F7' }} />
                    <span className="text-xs font-semibold" style={{ color: '#A855F7' }}>AI Insights</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>Evaluation</p>
                      <p className="text-xs leading-relaxed" style={{ color: C.secondary }}>{simResult.explanation.evaluation}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: C.emerald }}>Strengths</p>
                        <div className="space-y-1">
                          {simResult.explanation.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <CheckCircle size={9} className="shrink-0 mt-0.5" style={{ color: C.emerald }} />
                              <span className="text-[11px]" style={{ color: C.secondary }}>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: '#EF4444' }}>Weaknesses</p>
                        <div className="space-y-1">
                          {simResult.explanation.weaknesses.map((w, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <AlertCircle size={9} className="shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
                              <span className="text-[11px]" style={{ color: C.secondary }}>{w}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-sm p-3" style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)' }}>
                      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#A855F7' }}>Suggestion</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: C.secondary }}>{simResult.explanation.suggestion}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {state !== 'revealed' && tab === 'proof of work' && (
              <motion.div key="proof" variants={stagger} initial="hidden" animate="show" exit={{ opacity:0 }} className="space-y-4">
                {candidate.GitBranch && (
                  <motion.div variants={fadeUp} className="rounded-sm p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <GitBranch size={12} style={{ color: C.accent }} />
                        <span className="text-xs font-semibold" style={{ color: C.primary }}>GitHub Activity</span>
                      </div>
                      <span className="text-[10px]" style={{ color: C.muted }}>{candidate.GitBranch.repos} public repos</span>
                    </div>
                    <Heatmap data={candidate.GitBranch.contributions} />
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <GitBranch size={10} style={{ color: C.accent }} />
                        <span className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>Language breakdown</span>
                      </div>
                      <LangBar languages={candidate.GitBranch.languages} />
                    </div>
                  </motion.div>
                )}
                {candidate.leetcode && (
                  <motion.div variants={fadeUp} className="rounded-sm p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Terminal size={12} style={{ color: C.accent }} />
                      <span className="text-xs font-semibold" style={{ color: C.primary }}>LeetCode Breakdown</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold" style={{ color: C.primary, ...serif }}>
                        {candidate.leetcode.solved}<span className="text-sm font-normal ml-1" style={{ color: C.muted }}>solved</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold" style={{ color: C.accent }}>{candidate.leetcode.rating}</div>
                        <div className="text-[10px]" style={{ color: C.muted }}>contest rating</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Hard',   value: candidate.leetcode.hard,   color: '#EF4444' },
                        { label: 'Medium', value: candidate.leetcode.medium, color: C.amber },
                        { label: 'Easy',   value: candidate.leetcode.easy,   color: C.emerald },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="text-center rounded-sm py-2.5"
                          style={{ background: `${color}0A`, border: `1px solid ${color}22` }}>
                          <div className="text-sm font-bold" style={{ color }}>{value}</div>
                          <div className="text-[10px]" style={{ color: C.muted }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <div className="p-5 pt-4 flex gap-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
          {state === 'revealed' ? (
            <>
              <button onClick={onClose} className="flex-1 py-3 text-sm rounded-sm transition-colors"
                style={{ border: `1px solid ${C.border}`, color: C.subtle }}>
                Done
              </button>
              <button onClick={handleForward}
                className="flex-2 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-sm transition-all duration-200"
                style={{ background: C.accent, color: '#0A0A0B' }}>
                Forward to ATS <ArrowRight size={13} />
              </button>
            </>
          ) : (
            <>
              {!simResult && (
                <button onClick={runSimulation} disabled={simRunning}
                  className="flex items-center justify-center gap-2 py-3 text-sm rounded-sm transition-all duration-200 px-4"
                  style={{ border: '1px solid rgba(168,85,247,0.25)', color: '#A855F7', opacity: simRunning ? 0.5 : 1 }}>
                  <Zap size={13} /> {simRunning ? 'Simulating...' : 'Simulate'}
                </button>
              )}
              <button onClick={handleDecline}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm rounded-sm transition-all duration-200"
                style={{
                  border: `1px solid ${action === 'decline' ? '#EF444444' : C.border}`,
                  color: action === 'decline' ? '#EF4444' : C.subtle,
                  opacity: action === 'accept' ? 0.35 : 1,
                }}>
                <X size={13} /> Pass
              </button>
              <button onClick={handleAccept} disabled={state === 'deciding'}
                className="flex-2 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-sm transition-all duration-200"
                style={{
                  background: state === 'deciding' ? C.accent : C.accentDim,
                  border: `1px solid ${C.accentBorder}`,
                  color: state === 'deciding' ? '#0A0A0B' : C.accent,
                  opacity: action === 'decline' ? 0.35 : 1,
                }}>
                <CheckCircle size={13} />
                {state === 'deciding' ? 'Revealing...' : 'Accept & Reveal'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, inboxCount, navigate, profile }) {
  const primary = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'talent',    icon: BrainCircuit,    label: 'AI Talent Scout' },
    { id: 'inbox',     icon: Bell,            label: 'Inbox',       badge: inboxCount },
    { id: 'pipeline',  icon: TrendingUp,      label: 'My Referrals' },
    { id: 'bounty',    icon: DollarSign,      label: 'Bounty & Rep' },
  ]
  const secondary = [
    { id: 'settings', icon: Settings,    label: 'Preferences' },
    { id: 'help',     icon: HelpCircle,  label: 'Help & Docs' },
  ]

  const NavBtn = ({ id, icon: Icon, label, badge }) => (
    <button onClick={() => setActive(id)}
      className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-sm text-xs transition-all duration-150"
      style={{
        background: active === id ? C.accentDim : 'transparent',
        color:      active === id ? C.accent    : C.subtle,
      }}
    >
      <span className="flex items-center gap-2.5"><Icon size={13} />{label}</span>
      {badge > 0 && (
        <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: C.accent, color: '#0A0A0B' }}>{badge}</span>
      )}
    </button>
  )

  return (
    <aside className="hidden md:flex flex-col justify-between w-56 shrink-0 py-6 px-4"
      style={{ borderRight: `1px solid ${C.border}`, background: C.bg }}>
      <div>
        <div className="px-2 mb-7">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: C.accent }}>RefHire</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>Referrer Portal</div>
        </div>

        <div className="mx-2 mb-5 flex items-center gap-2 px-2.5 py-2 rounded-sm"
          style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}` }}>
          <Lock size={9} style={{ color: C.accent }} />
          <span className="text-[10px] font-medium" style={{ color: C.accent }}>Anonymous mode on</span>
        </div>

        <div className="mx-2 mb-5 px-2.5 py-2 rounded-sm" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] mb-0.5" style={{ color: C.muted }}>Visible as</div>
          <div className="text-[11px] font-medium" style={{ color: C.secondary }}>{profile?.visibleAs || profile?.alias || 'Anonymous Referrer'}</div>
        </div>

        <div className="mb-2">
          <div className="px-3 mb-1">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: C.muted }}>Main</span>
          </div>
          <nav className="space-y-0.5">
            {primary.map(p => <NavBtn key={p.id} {...p} />)}
          </nav>
        </div>

        <div className="my-3 mx-2" style={{ borderTop: `1px solid ${C.border}` }} />

        <div>
          <div className="px-3 mb-1">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: C.muted }}>Account</span>
          </div>
          <nav className="space-y-0.5">
            {secondary.map(p => <NavBtn key={p.id} {...p} />)}
          </nav>
        </div>
      </div>

      <button onClick={() => navigate?.('landing')}
        className="flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors"
        style={{ color: C.muted }}>
        <LogOut size={13} /> Sign out
      </button>
    </aside>
  )
}

// ── Topbar ─────────────────────────────────────────────────────────────────────
function Topbar({ reputation, totalBounty }) {
  return (
    <div className="sticky top-0 z-20 h-14 px-6 md:px-8 flex items-center justify-between shrink-0"
      style={{ borderBottom:`1px solid ${C.border}`, background:'rgba(17,19,21,0.92)', backdropFilter:'blur(12px)' }}>

      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm"
          style={{ background: C.amberDim, border: `1px solid ${C.amberBorder}` }}>
          <Star size={10} style={{ color: C.amber }} />
          <span className="text-xs font-semibold" style={{ color: C.amber }}>{reputation}</span>
          <span className="text-[10px]" style={{ color: 'rgba(245,158,11,0.5)' }}>rep</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm"
          style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}` }}>
          <span className="text-xs font-semibold" style={{ color: C.accent }}>{totalBounty}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <Lock size={10} style={{ color: C.secondary }} />
          <span className="text-[10px]" style={{ color: C.secondary }}>Anon</span>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard Tab ──────────────────────────────────────────────────────────────
function DashboardTab({ inbox, reputation, totalRefs, totalBounty, pendingBounty, setActive, topRecs }) {
  const tiers = [
    { name:'Bronze',   min:0,   max:3.5 },
    { name:'Silver',   min:3.5, max:4.2 },
    { name:'Gold',     min:4.2, max:4.7 },
    { name:'Platinum', min:4.7, max:5   },
  ]
  const currentTier = tiers.find(t => reputation >= t.min && reputation < t.max) || tiers[3]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold mb-0.5" style={{ color: C.primary, ...heading }}>Referrer Dashboard</h1>
        <p className="text-sm" style={{ color: C.subtle }}>You are invisible to candidates until you accept their request.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total Earned',    value:`$${totalBounty.toLocaleString()}`, icon:DollarSign, hi: C.accent },
          { label:'Reputation',      value:reputation,                         icon:Star,       hi: C.amber,  sub:'/ 5.0' },
          { label:'Successful Refs', value:totalRefs,                          icon:Award,      hi: C.primary },
          { label:'Pending Review',  value:inbox.length,                       icon:Bell,       hi: C.primary },
        ].map(({ label, value, icon:Icon, hi, sub }) => (
          <div key={label} className="rounded-sm p-4 transition-colors"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>{label}</span>
              <Icon size={11} style={{ color: hi }} />
            </div>
            <div className="text-xl font-bold" style={{ color: hi, ...serif }}>
              {value}{sub && <span className="text-sm font-normal ml-1" style={{ color: C.muted }}>{sub}</span>}
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} className="rounded-sm p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Shield size={13} style={{ color: C.accent }} />
            <span className="text-sm font-semibold" style={{ color: C.primary }}>Trust Protocol</span>
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: C.subtle }}>
            Your score rises with successful hires and falls with low-signal referrals. Higher tiers unlock premium profiles and bigger bounty splits.
          </p>
          <div className="h-1 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div initial={{ width:0 }} animate={{ width:`${(reputation/5)*100}%` }}
              transition={{ duration:1, ease:[0.22,1,0.36,1] }}
              className="h-full rounded-full" style={{ background: C.accent }} />
          </div>
          <div className="flex gap-1.5">
            {tiers.map(t => (
              <div key={t.name} className="flex-1 text-center py-1.5 rounded-sm text-[10px] font-medium"
                style={{
                  background: currentTier.name === t.name ? C.accentDim : C.surface,
                  border: `1px solid ${currentTier.name === t.name ? C.accentBorder : C.border}`,
                  color:   currentTier.name === t.name ? C.accent : C.muted,
                }}>
                {t.name}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-sm p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <DollarSign size={13} style={{ color: C.accent }} />
              <span className="text-sm font-semibold" style={{ color: C.primary }}>Bounty Syndicate</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-sm"
              style={{ background: C.emeraldDim, color: C.emerald, border: `1px solid ${C.emeraldBorder}` }}>Active</span>
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: C.subtle }}>
            Earn a 10% facilitation fee from your company's standard referral bonus when a candidate you matched gets hired.
          </p>
          <div className="space-y-2">
            {[
              { label:'Lifetime earned', value:`$${totalBounty.toLocaleString()}`, color: C.accent },
              { label:'Pending release', value:`$${pendingBounty.toLocaleString()}`, color: C.amber },
              { label:'Next payout',     value:'Next month',  color: C.secondary },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-1.5"
                style={{ borderBottom:`1px solid ${C.border}` }}>
                <span className="text-[11px]" style={{ color: C.subtle }}>{label}</span>
                <span className="text-xs font-semibold" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI top picks */}
      {topRecs && topRecs.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-sm overflow-hidden" style={{ border: `1px solid ${C.accentBorder}`, background: C.accentDim }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${C.accentBorder}` }}>
            <div className="flex items-center gap-2">
              <BrainCircuit size={12} style={{ color: C.accent }} />
              <span className="text-xs font-semibold" style={{ color: C.accent }}>AI Top Picks</span>
              <span className="text-[10px]" style={{ color: C.subtle }}>Based on your team stack</span>
            </div>
            <button onClick={() => setActive('talent')} className="flex items-center gap-1 text-[10px] transition-colors" style={{ color: C.accent }}>
              View all <ChevronRight size={11} />
            </button>
          </div>
          {topRecs.map(r => {
            const mc = r.aiScore >= 80 ? C.accent : r.aiScore >= 65 ? C.amber : C.subtle
            return (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors" style={{ borderBottom: `1px solid ${C.accentBorder}` }}>
                <div className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
                  style={{ background: `${r.tier.color}15`, border: `1px solid ${r.tier.color}33` }}>
                  <Lock size={10} style={{ color: r.tier.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: C.primary }}>{r.alias}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-sm" style={{ color: r.tier.color, border: `1px solid ${r.tier.color}33`, background: `${r.tier.color}0d` }}>{r.tier.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: C.muted }}>{r.currentRole}</span>
                    {r.matchedSkills.length > 0 && <span className="text-[10px]" style={{ color: C.subtle }}>· {r.matchedSkills.slice(0, 2).join(', ')}</span>}
                  </div>
                </div>
                <div className="text-sm font-bold" style={{ color: mc, ...serif }}>{r.aiScore}%</div>
              </div>
            )
          })}
        </motion.div>
      )}

      {inbox.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-sm overflow-hidden" style={{ border:`1px solid ${C.border}` }}>
          <div className="flex items-center justify-between px-5 py-3"
            style={{ background: C.surface, borderBottom:`1px solid ${C.border}` }}>
            <div className="flex items-center gap-2">
              <Bell size={12} style={{ color: C.accent }} />
              <span className="text-xs font-semibold" style={{ color: C.primary }}>Pending requests</span>
            </div>
            <button onClick={() => setActive('inbox')}
              className="flex items-center gap-1 text-[10px] transition-colors"
              style={{ color: C.accent }}>
              View all <ChevronRight size={11} />
            </button>
          </div>
          {inbox.slice(0,2).map(c => {
            const mc = c.match >= 80 ? C.accent : c.match >= 65 ? C.amber : C.subtle
            return (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                style={{ borderBottom:`1px solid ${C.border}` }}>
                <div className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
                  style={{ background: C.accentDim, border:`1px solid ${C.accentBorder}` }}>
                  <Lock size={10} style={{ color: C.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium" style={{ color: C.primary }}>{c.alias}</span>
                  <span className="text-[10px] ml-2" style={{ color: C.muted }}>{c.role}</span>
                </div>
                <div className="text-sm font-bold" style={{ color: mc, ...serif }}>{c.match}%</div>
              </div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}

// ── Inbox Tab ──────────────────────────────────────────────────────────────────
function InboxTab({ inbox, onSelect }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold mb-0.5" style={{ color: C.primary, ...heading }}>Referral Inbox</h1>
        <p className="text-sm" style={{ color: C.subtle }}>
          {inbox.length > 0
            ? `${inbox.length} candidate${inbox.length !== 1 ? 's' : ''} filtered by AI, awaiting your review.`
            : 'Inbox clear. High-signal candidates will appear here.'}
        </p>
      </motion.div>

      {inbox.length === 0 ? (
        <motion.div variants={fadeUp} className="rounded-sm p-14 text-center" style={{ border:`1px solid ${C.border}` }}>
          <CheckCircle size={24} className="mx-auto mb-3" style={{ color: C.accent }} />
          <p className="text-sm font-medium mb-1" style={{ color: C.primary }}>Inbox Zero</p>
          <p className="text-xs" style={{ color: C.subtle }}>New requests appear as candidates match to your team stack.</p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-2.5">
          {inbox.map(c => {
            const mc = c.match >= 80 ? C.accent : c.match >= 65 ? C.amber : C.subtle
            return (
              <motion.div key={c.id} whileHover={{ borderColor: C.borderHover }}
                onClick={() => onSelect(c)}
                className="rounded-sm cursor-pointer overflow-hidden transition-colors"
                style={{ border:`1px solid ${C.border}`, background: C.surface }}>
                <div className="h-0.5" style={{ background:'rgba(255,255,255,0.03)' }}>
                  <div style={{ width:`${c.match}%`, height:'100%', background: mc }} />
                </div>
                <div className="flex items-center gap-4 p-4">
                  <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
                    style={{ background: C.accentDim, border:`1px solid ${C.accentBorder}` }}>
                    <Lock size={12} style={{ color: C.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium" style={{ color: C.primary }}>{c.alias}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm"
                        style={{ background: C.surface, border:`1px solid ${C.border}`, color: C.subtle }}>{c.role}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 mb-1.5">
                       <Target size={10} style={{ color: C.accent }} />
                       <span className="text-[9px]" style={{ color: C.subtle }}>Target Role: {c.targetReq}</span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {c.aiScoring?.matchedSkills?.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] px-1 py-0.5 rounded-sm" style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}`, color: C.accent }}>{s}</span>
                      ))}
                      {(!c.aiScoring?.matchedSkills?.length) && c.skills.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px]" style={{ color: C.muted }}>{s}</span>
                      ))}
                      {c.skills.length > 3 && <span className="text-[10px]" style={{ color: C.muted }}>+{c.skills.length - 3} more</span>}
                      <span className="text-[10px]" style={{ color: C.muted }}>{c.receivedAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-bold" style={{ color: mc, ...serif }}>{c.match}%</div>
                      <div className="text-[10px]" style={{ color: C.muted }}>match</div>
                    </div>
                    <ChevronRight size={13} style={{ color: C.muted }} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}

// ── Pipeline Tab ───────────────────────────────────────────────────────────────
function PipelineTab({ pipeline }) {
  const [filter, setFilter] = useState('all')
  const filters = ['all', 'hired', 'offer_extended', 'interviewing', 'referred', 'declined']
  const visible  = filter === 'all' ? pipeline : pipeline.filter(r => r.status === filter)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold mb-0.5" style={{ color: C.primary, ...heading }}>My Referrals</h1>
        <p className="text-sm" style={{ color: C.subtle }}>Track candidates you have forwarded to HR and their pipeline stage.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-1.5 flex-wrap">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-[10px] px-2.5 py-1 rounded-sm capitalize transition-all"
            style={{
              background: filter === f ? C.accentDim : C.surface,
              border:     `1px solid ${filter === f ? C.accentBorder : C.border}`,
              color:      filter === f ? C.accent : C.subtle,
            }}>
            {f === 'offer_extended' ? 'Offer Extended' : f}
          </button>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-sm overflow-hidden" style={{ border:`1px solid ${C.border}` }}>
        <div className="grid grid-cols-12 gap-4 px-5 py-3" style={{ borderBottom:`1px solid ${C.border}`, background: C.surface }}>
          {['Candidate','Role','Pipeline','Status','Bounty'].map((h, i) => (
            <div key={h} className={`text-[10px] uppercase tracking-widest font-medium ${
              i === 0 ? 'col-span-3' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-3' : i === 3 ? 'col-span-2' : 'col-span-2 text-right'
            }`} style={{ color: C.subtle }}>{h}</div>
          ))}
        </div>
        <div>
          {visible.map(r => {
            const earned = r.status === 'hired'
            return (
              <div key={r.id} className="grid grid-cols-12 gap-4 items-center px-5 py-4 transition-colors"
                style={{ borderBottom:`1px solid ${C.border}` }}>
                <div className="col-span-3 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: C.primary }}>{r.candidateName}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{timeAgo(r.createdAt)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] truncate" style={{ color: C.subtle }}>{r.role}</p>
                </div>
                <div className="col-span-3">
                  <PipelineDots stage={r.stage} />
                  <p className="text-[10px] mt-1" style={{ color: C.muted }}>{STAGES[r.stage - 1]}</p>
                </div>
                <div className="col-span-2">
                  <StatusBadge status={r.status} />
                </div>
                <div className="col-span-2 text-right">
                  {r.bounty > 0 ? (
                    <>
                      <div className="text-xs font-bold" style={{ color: earned ? C.emerald : C.amber }}>
                        ${r.bounty.toLocaleString()}
                      </div>
                      <div className="text-[10px]" style={{ color: C.muted }}>{earned ? 'earned' : 'pending'}</div>
                    </>
                  ) : (
                    <span className="text-[11px]" style={{ color: C.muted }}>—</span>
                  )}
                </div>
              </div>
            )
          })}
          {visible.length === 0 && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: C.muted }}>No referrals in this category.</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Bounty & Reputation Tab ────────────────────────────────────────────────────
function BountyTab({ reputation, totalRefs, totalBounty, pendingBounty }) {
  const tiers = [
    { name:'Bronze',   min:0,   max:3.5, mult:'1x',  perk:'Standard queue access',            cap:'$500/hire'   },
    { name:'Silver',   min:3.5, max:4.2, mult:'1.2x', perk:'Priority matching + early access', cap:'$1,000/hire' },
    { name:'Gold',     min:4.2, max:4.7, mult:'1.5x', perk:'Premium profiles + fast-track',    cap:'$2,500/hire' },
    { name:'Platinum', min:4.7, max:5,   mult:'2x',   perk:'Top 1% candidates + white-glove',  cap:'$5,000/hire' },
  ]
  const currentTier = tiers.find(t => reputation >= t.min && reputation < t.max) || tiers[3]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold mb-0.5" style={{ color: C.primary, ...heading }}>Bounty & Reputation</h1>
        <p className="text-sm" style={{ color: C.subtle }}>Your trust score and fractional referral earnings.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-sm p-5" style={{ background: C.surface, border:`1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={13} style={{ color: C.accent }} />
            <span className="text-sm font-semibold" style={{ color: C.primary }}>Trust Score</span>
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-sm"
            style={{ background: C.accentDim, color: C.accent, border:`1px solid ${C.accentBorder}` }}>
            {currentTier.name} Tier · {currentTier.mult} bounty
          </span>
        </div>
        <div className="flex items-end gap-3 mb-4">
          <div className="text-4xl font-bold" style={{ color: C.accent, ...serif }}>{reputation}</div>
          <div className="text-base mb-1" style={{ color: C.muted }}>/ 5.0</div>
        </div>
        <div className="h-1.5 rounded-full mb-4" style={{ background:'rgba(255,255,255,0.05)' }}>
          <motion.div initial={{ width:0 }} animate={{ width:`${(reputation/5)*100}%` }}
            transition={{ duration:1.1, ease:[0.22,1,0.36,1] }}
            className="h-full rounded-full" style={{ background: C.accent }} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {tiers.map(t => (
            <div key={t.name} className="rounded-sm p-2.5 transition-all"
              style={{
                background: currentTier.name === t.name ? C.accentDim : C.surface,
                border: `1px solid ${currentTier.name === t.name ? C.accentBorder : C.border}`,
              }}>
              <div className="text-[10px] font-semibold mb-0.5"
                style={{ color: currentTier.name === t.name ? C.accent : C.muted }}>{t.name}</div>
              <div className="text-[9px]" style={{ color: currentTier.name === t.name ? C.accent : C.muted }}>{t.mult}</div>
              <div className="text-[9px] mt-1" style={{ color: C.muted }}>{t.cap}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label:'Lifetime Earned', value:`$${totalBounty.toLocaleString()}`, color: C.accent,   icon: DollarSign },
          { label:'Pending Release', value:`$${pendingBounty.toLocaleString()}`, color: C.amber,  icon: Clock      },
          { label:'Total Referrals', value: totalRefs,                          color: C.primary, icon: Users      },
        ].map(({ label, value, color, icon:Icon }) => (
          <div key={label} className="rounded-sm p-4" style={{ background: C.surface, border:`1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>{label}</span>
              <Icon size={11} style={{ color }} />
            </div>
            <div className="text-xl font-bold" style={{ color, ...serif }}>{value}</div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-sm p-5" style={{ background: C.surface, border:`1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={13} style={{ color: C.accent }} />
          <span className="text-sm font-semibold" style={{ color: C.primary }}>Reputation mechanics</span>
        </div>
        <div className="space-y-0">
          {[
            { event:'Candidate hired',                    delta:'+0.15', color: C.emerald },
            { event:'Offer extended',                     delta:'+0.05', color: C.accent  },
            { event:'Candidate reached interview stage',  delta:'+0.02', color: C.amber   },
            { event:'Low-signal referral auto-rejected',  delta:'−0.10', color: C.red     },
            { event:'Referred candidate flagged by HR',   delta:'−0.05', color: C.red     },
          ].map(({ event, delta, color }, i, arr) => (
            <div key={event} className="flex items-center justify-between py-2.5"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <span className="text-xs" style={{ color: C.secondary }}>{event}</span>
              <span className="text-xs font-semibold tabular-nums" style={{ color }}>{delta}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Settings Tab ───────────────────────────────────────────────────────────────
function SettingsTab({ profile, onUpdate }) {
  const [stack, setStack] = useState(profile?.stack || [])
  const [input, setInput] = useState('')
  const [reqs, setReqs]   = useState(profile?.activeReqs || [])
  const [reqInput, setReqInput] = useState('')

  const addTag = () => {
    if (!input.trim()) return
    const updated = [...stack, input.trim()]
    setStack(updated)
    setInput('')
    onUpdate({ stack: updated })
  }
  const removeTag = (tag) => {
    const updated = stack.filter(t => t !== tag)
    setStack(updated)
    onUpdate({ stack: updated })
  }

  const addReq = () => {
    if (!reqInput.trim()) return
    const updated = [...reqs, reqInput.trim()]
    setReqs(updated)
    setReqInput('')
    onUpdate({ activeReqs: updated })
  }
  const removeReq = (req) => {
    const updated = reqs.filter(t => t !== req)
    setReqs(updated)
    onUpdate({ activeReqs: updated })
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 max-w-xl">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold mb-0.5" style={{ color: C.primary, ...heading }}>Preferences</h1>
        <p className="text-sm" style={{ color: C.subtle }}>Configure your anonymous profile and matching criteria.</p>
      </motion.div>

      {[
        { title:'Anonymous Profile', desc:'Your public identity on the platform', content:(
          <div className="space-y-3">
            {[
              { label:'Visible as', value: profile?.visibleAs || profile?.alias || '—' },
              { label:'Corporate email', value: profile?.email ? '•••••@' + profile.email.split('@')[1] : '—', verified: !!profile?.email },
              { label:'Anonymous since', value: profile?.anonymousSince ? new Date(profile.anonymousSince.toDate?.() || profile.anonymousSince).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—' },
            ].map(({ label, value, verified }) => (
              <div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom:`1px solid ${C.border}` }}>
                <span className="text-xs" style={{ color: C.subtle }}>{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: C.secondary }}>{value}</span>
                  {verified && <span className="text-[10px] px-1.5 py-0.5 rounded-sm" style={{ background: C.emeraldDim, color: C.emerald, border:`1px solid ${C.emeraldBorder}` }}>Verified</span>}
                </div>
              </div>
            ))}
          </div>
        )},
        { title:'Active Requisitions (Bounty Slots)', desc:'Specific roles you are currently referring for. Candidates will select from these when requesting a referral.', content:(
          <div>
            <div className="flex flex-col gap-2 mb-3">
              {reqs.map(r => (
                <div key={r} className="flex items-center justify-between px-3 py-2 rounded-sm"
                  style={{ background: C.surface, border:`1px solid ${C.border}` }}>
                  <div className="flex items-center gap-2">
                    <Target size={12} style={{ color: C.accent }} />
                    <span className="text-[11px]" style={{ color: C.primary }}>{r}</span>
                  </div>
                  <button onClick={() => removeReq(r)}>
                    <X size={12} style={{ color: C.subtle }} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={reqInput} onChange={e => setReqInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addReq()}
                placeholder="e.g. Senior Product Manager..."
                className="flex-1 text-xs px-3 py-2 rounded-sm outline-none"
                style={{ background: C.surface, border:`1px solid ${C.border}`, color: C.primary, caretColor: C.accent }} />
              <button onClick={addReq} className="px-3 py-2 text-xs rounded-sm"
                style={{ background: C.accentDim, border:`1px solid ${C.accentBorder}`, color: C.accent }}>
                Add Req
              </button>
            </div>
          </div>
        )},
        { title:'Team Tech Stack', desc:'Candidates are filtered against these tags', content:(
          <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {stack.map(s => (
                <div key={s} className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm"
                  style={{ background: C.accentDim, border:`1px solid ${C.accentBorder}` }}>
                  <span className="text-[11px]" style={{ color: C.accent }}>{s}</span>
                  <button onClick={() => removeTag(s)}>
                    <X size={10} style={{ color: C.accent }} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="Add technology..."
                className="flex-1 text-xs px-3 py-2 rounded-sm outline-none"
                style={{ background: C.surface, border:`1px solid ${C.border}`, color: C.primary, caretColor: C.accent }} />
              <button onClick={addTag} className="px-3 py-2 text-xs rounded-sm"
                style={{ background: C.accentDim, border:`1px solid ${C.accentBorder}`, color: C.accent }}>
                Add Tag
              </button>
            </div>
          </div>
        )},
      ].map(({ title, desc, content }) => (
        <motion.div key={title} variants={fadeUp} className="rounded-sm p-5"
          style={{ background: C.surface, border:`1px solid ${C.border}` }}>
          <div className="mb-4">
            <p className="text-sm font-semibold mb-0.5" style={{ color: C.primary }}>{title}</p>
            <p className="text-xs" style={{ color: C.muted }}>{desc}</p>
          </div>
          {content}
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── Help Tab ───────────────────────────────────────────────────────────────────
function HelpTab() {
  const faqs = [
    { q:'How is the AI match score calculated?', a:'The match score compares the candidate\'s verified skills, GitHub activity patterns, and LeetCode rating against the tech stack you\'ve configured for your team. It also factors in your past successful referral profiles.' },
    { q:'When does my identity get revealed to the candidate?', a:'Only when you explicitly click "Accept & Reveal Identity." The candidate is never shown your profile unless you initiate. You remain invisible otherwise.' },
    { q:'How are bounties paid out?', a:'Bounties are released 30 days after the hire confirmation date, subject to your company\'s standard referral policy. RefHire takes no additional cut beyond the platform fee already agreed with your employer.' },
    { q:'What happens to my reputation if I pass on a candidate?', a:'Passing (declining) a candidate has no direct reputation impact. Reputation only changes based on outcomes of candidates you accepted and forwarded to HR.' },
  ]
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 max-w-xl">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold mb-0.5" style={{ color: C.primary, ...heading }}>Help & Documentation</h1>
        <p className="text-sm" style={{ color: C.subtle }}>Frequently asked questions about the referrer workflow.</p>
      </motion.div>
      <motion.div variants={fadeUp} className="space-y-2.5">
        {faqs.map(({ q, a }) => (
          <div key={q} className="rounded-sm p-4" style={{ background: C.surface, border:`1px solid ${C.border}` }}>
            <div className="flex gap-2.5 mb-2">
              <AlertCircle size={13} style={{ color: C.accent, flexShrink:0, marginTop:1 }} />
              <p className="text-xs font-semibold" style={{ color: C.primary }}>{q}</p>
            </div>
            <p className="text-xs leading-relaxed pl-5" style={{ color: C.subtle }}>{a}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}

// ── Score Ring ──────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 64, strokeWidth = 4, color }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold" style={{ color, ...serif }}>{score}</span>
      </div>
    </div>
  )
}

function FactorBar({ label, score, weight, delay = 0 }) {
  const barColor = score >= 70 ? C.accent : score >= 45 ? C.amber : C.subtle
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span style={{ color: C.secondary }}>{label}</span>
        <div className="flex items-center gap-2">
          <span style={{ color: C.muted }}>{Math.round(weight * 100)}%</span>
          <span className="font-semibold w-6 text-right" style={{ color: C.primary }}>{score}</span>
        </div>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}

// ── AI Talent Scout Tab ─────────────────────────────────────────────────────────
function TalentScoutTab({ recommendations, onSelect }) {
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [running, setRunning] = useState(false)

  const runScan = () => { setRunning(true); setTimeout(() => setRunning(false), 1500) }

  const topRec = recommendations[0]
  const perfectCount = recommendations.filter(r => r.aiScore >= 85).length
  const strongCount = recommendations.filter(r => r.aiScore >= 70 && r.aiScore < 85).length
  const avgScore = recommendations.length > 0
    ? Math.round(recommendations.reduce((s, r) => s + r.aiScore, 0) / recommendations.length)
    : 0

  let filtered = filter === 'all'
    ? recommendations
    : filter === 'perfect' ? recommendations.filter(r => r.aiScore >= 85)
    : filter === 'strong'  ? recommendations.filter(r => r.aiScore >= 70 && r.aiScore < 85)
    : filter === 'good'    ? recommendations.filter(r => r.aiScore >= 50 && r.aiScore < 70)
    : recommendations.filter(r => r.aiScore < 50)

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(r =>
      r.skills.some(s => s.toLowerCase().includes(q)) ||
      r.currentRole.toLowerCase().includes(q) ||
      r.lookingFor.toLowerCase().includes(q) ||
      r.alias.toLowerCase().includes(q)
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-1">
          <BrainCircuit size={15} style={{ color: C.accent }} />
          <h1 className="text-xl font-bold" style={{ color: C.primary, ...heading }}>AI Talent Scout</h1>
        </div>
        <p className="text-sm" style={{ color: C.subtle }}>
          Multi-factor scoring: skill match (40%), role fit (20%), experience (15%), profile depth (15%), activity signal (10%).
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Perfect candidates', value: String(perfectCount), sub: 'Score 85+', hi: C.accent },
          { label: 'Strong candidates', value: String(strongCount), sub: 'Score 70–84', hi: C.emerald },
          { label: 'Avg. AI score', value: String(avgScore), sub: 'Across all candidates', hi: C.amber },
          { label: 'Total scanned', value: String(recommendations.length), sub: 'Candidates analyzed', hi: C.secondary },
        ].map(s => (
          <div key={s.label} className="rounded-sm p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>{s.label}</span>
            </div>
            <div className="text-2xl font-bold leading-none" style={{ color: s.hi, ...serif }}>{s.value}</div>
            <p className="text-[11px] mt-1.5" style={{ color: C.muted }}>{s.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Top candidate deep-dive */}
      {topRec && (
        <motion.div variants={fadeUp} className="rounded-sm overflow-hidden"
          style={{ border: `1px solid ${C.accentBorder}`, background: C.accentDim }}>
          <div className="px-5 py-4 flex items-center gap-4" style={{ borderBottom: `1px solid ${C.accentBorder}` }}>
            <ScoreRing score={topRec.aiScore} color={topRec.tier.color} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm"
                  style={{ color: topRec.tier.color, border: `1px solid ${topRec.tier.color}33`, background: `${topRec.tier.color}0d` }}>
                  {topRec.tier.label}
                </span>
                <Lock size={9} style={{ color: C.accent }} />
                <span className="text-[10px]" style={{ color: C.accent }}>Anonymous</span>
              </div>
              <p className="text-[15px] font-semibold" style={{ color: C.primary }}>{topRec.alias}</p>
              <p className="text-[11px] mt-0.5" style={{ color: C.subtle }}>
                {topRec.currentRole}{topRec.yearsExperience ? ` · ${topRec.yearsExperience} yrs exp` : ''}
                {topRec.location ? ` · ${topRec.location}` : ''}
              </p>
            </div>
            <button onClick={() => onSelect(topRec)}
              className="shrink-0 text-[12px] font-semibold px-4 py-2 rounded-sm transition-all duration-200"
              style={{ background: C.accent, color: '#0A0A0B' }}>
              Review
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-3">
              <FactorBar label="Skill Match" score={topRec.breakdown.skill.score} weight={topRec.breakdown.skill.weight} delay={0.1} />
              <FactorBar label="Domain / Role Fit" score={topRec.breakdown.domain.score} weight={topRec.breakdown.domain.weight} delay={0.2} />
              <FactorBar label="Experience Alignment" score={topRec.breakdown.experience.score} weight={topRec.breakdown.experience.weight} delay={0.3} />
              <FactorBar label="Profile Depth" score={topRec.breakdown.profileDepth.score} weight={topRec.breakdown.profileDepth.weight} delay={0.4} />
              <FactorBar label="Activity Signal" score={topRec.breakdown.activity.score} weight={topRec.breakdown.activity.weight} delay={0.5} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {topRec.matchedSkills.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.muted }}>Matching Skills ({topRec.matchedSkills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topRec.matchedSkills.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-sm"
                        style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}`, color: C.accent }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {topRec.missingSkills.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.muted }}>Missing from their stack ({topRec.missingSkills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topRec.missingSkills.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-sm"
                        style={{ background: C.amberDim, border: `1px solid ${C.amberBorder}`, color: C.amber }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] pt-1" style={{ color: C.subtle }}>
              {topRec.breakdown.domain.insight && <span>{topRec.breakdown.domain.insight}</span>}
              {topRec.breakdown.experience.insight && <span>{topRec.breakdown.experience.insight}</span>}
              {topRec.breakdown.profileDepth.insight && <span>{topRec.breakdown.profileDepth.insight}</span>}
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter + search + list */}
      <motion.div variants={fadeUp} className="rounded-sm overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: C.primary }}>All Candidates</p>
            <p className="text-[11px] mt-0.5" style={{ color: C.subtle }}>Click any row for AI score breakdown</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <Search size={10} style={{ color: C.muted }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Filter skills, role..."
                className="text-[11px] bg-transparent outline-none w-28" style={{ color: C.primary }}
              />
              {search && <button onClick={() => setSearch('')}><X size={10} style={{ color: C.muted }} /></button>}
            </div>
            {[
              { id: 'all', label: 'All' },
              { id: 'perfect', label: '85+' },
              { id: 'strong', label: '70+' },
              { id: 'good', label: '50+' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="text-[11px] px-2.5 py-1 rounded-sm transition-colors"
                style={{
                  background: filter === f.id ? C.accentDim : 'transparent',
                  border: `1px solid ${filter === f.id ? C.accentBorder : C.border}`,
                  color: filter === f.id ? C.accent : C.subtle,
                }}>
                {f.label}
              </button>
            ))}
            <button onClick={runScan} disabled={running}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-sm transition-colors"
              style={{ border: `1px solid ${C.border}`, color: C.subtle, opacity: running ? 0.5 : 1 }}>
              <RefreshCw size={10} className={running ? 'animate-spin' : ''} />
              {running ? 'Scanning...' : 'Re-scan'}
            </button>
          </div>
        </div>

        <div>
          {filtered.map((rec, i) => (
            <div key={rec.id} style={{ borderBottom: `1px solid ${C.border}` }}>
              <div
                onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
                className="px-5 py-4 flex items-center gap-4 cursor-pointer transition-colors"
                style={{ ':hover': { background: C.surfaceHover } }}
                onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span className="text-[11px] w-5 shrink-0 font-medium" style={{ color: C.muted }}>#{i+1}</span>
                <ScoreRing score={rec.aiScore} size={42} strokeWidth={3} color={rec.tier.color} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={9} style={{ color: C.accent }} />
                    <p className="text-[13px] font-medium truncate" style={{ color: C.primary }}>{rec.alias}</p>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-sm shrink-0"
                      style={{ color: rec.tier.color, border: `1px solid ${rec.tier.color}33`, background: `${rec.tier.color}0d` }}>
                      {rec.tier.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px]" style={{ color: C.subtle }}>{rec.currentRole || 'Engineer'}</span>
                    {rec.yearsExperience && <span className="text-[10px]" style={{ color: C.muted }}>· {rec.yearsExperience} yrs</span>}
                    {rec.location && <span className="text-[10px]" style={{ color: C.muted }}>· {rec.location}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.skills.slice(0, 5).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-sm"
                        style={{
                          background: rec.matchedSkills.includes(s.toLowerCase().replace(/[\s.]+/g, ' ')) ? C.accentDim : C.surface,
                          border: `1px solid ${rec.matchedSkills.includes(s.toLowerCase().replace(/[\s.]+/g, ' ')) ? C.accentBorder : C.border}`,
                          color: rec.matchedSkills.includes(s.toLowerCase().replace(/[\s.]+/g, ' ')) ? C.accent : C.subtle,
                        }}>
                        {s}
                      </span>
                    ))}
                    {rec.skills.length > 5 && <span className="text-[10px]" style={{ color: C.muted }}>+{rec.skills.length - 5}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); onSelect(rec) }}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-sm transition-all duration-200"
                    style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}`, color: C.accent }}>
                    Review
                  </button>
                  <ChevronDown size={13} className={`transition-transform ${expanded === rec.id ? 'rotate-180' : ''}`} style={{ color: C.muted }} />
                </div>
              </div>

              {/* Expandable breakdown */}
              <AnimatePresence>
                {expanded === rec.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 ml-10 space-y-3" style={{ borderLeft: `1px solid ${C.border}` }}>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>AI Score Breakdown</p>
                      <div className="space-y-2.5">
                        <FactorBar label="Skill Match" score={rec.breakdown.skill.score} weight={rec.breakdown.skill.weight} delay={0} />
                        <FactorBar label="Domain / Role Fit" score={rec.breakdown.domain.score} weight={rec.breakdown.domain.weight} delay={0.05} />
                        <FactorBar label="Experience Alignment" score={rec.breakdown.experience.score} weight={rec.breakdown.experience.weight} delay={0.1} />
                        <FactorBar label="Profile Depth" score={rec.breakdown.profileDepth.score} weight={rec.breakdown.profileDepth.weight} delay={0.15} />
                        <FactorBar label="Activity Signal" score={rec.breakdown.activity.score} weight={rec.breakdown.activity.weight} delay={0.2} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {rec.matchedSkills.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: C.muted }}>Matching Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {rec.matchedSkills.map(s => (
                                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-sm"
                                  style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}`, color: C.accent }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {rec.missingSkills.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: C.muted }}>Gap Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {rec.missingSkills.map(s => (
                                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-sm"
                                  style={{ background: C.amberDim, border: `1px solid ${C.amberBorder}`, color: C.amber }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] pt-1" style={{ color: C.subtle }}>
                        {rec.breakdown.domain.insight && <span>{rec.breakdown.domain.insight}</span>}
                        {rec.breakdown.experience.insight && <span>{rec.breakdown.experience.insight}</span>}
                        {rec.breakdown.profileDepth.insight && <span>{rec.breakdown.profileDepth.insight}</span>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: C.muted }}>
              {recommendations.length === 0
                ? 'No candidates found. Update your team stack in Preferences to see matches.'
                : 'No candidates in this tier. Try a different filter.'}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function EmployeeDashboard({ navigate }) {
  const { user }              = useAuth()
  const [tab, setTab]               = useState('dashboard')
  const [profile, setProfile]       = useState(null)
  const [inbox, setInbox]           = useState([])
  const [pipeline, setPipeline]     = useState([])
  const [candidates, setCandidates]           = useState([])
  const [shadowInterviews, setShadowInterviews] = useState([])
  const [selected, setSelected]               = useState(null)
  const [dataReady, setDataReady]             = useState(false)

  useEffect(() => {
    if (!user) return
    const unsubs = []
    let loaded = { profile: false, inbox: false, pipeline: false, candidates: false }
    const checkReady = () => {
      if (Object.values(loaded).every(Boolean)) setDataReady(true)
    }

    unsubs.push(subscribeEmployeeProfile(user.uid, (p) => {
      setProfile(p)
      loaded.profile = true
      checkReady()
    }))

    unsubs.push(subscribeEmployeeInbox(user.uid, async (rawRequests) => {
      const enriched = await Promise.all(
        rawRequests.map(async (req) => {
          const candidateProfile = await getCandidateProfile(req.candidateId)
          const candidateIdShort = req.candidateId.substring(0, 4).toUpperCase()
          return {
            id:        req.id,
            alias:     `Candidate #${candidateIdShort}`,
            realName:  candidateProfile?.name || 'Unknown',
            email:     candidateProfile?.email || '',
            match:     req.match,
            role:      candidateProfile?.currentRole || 'Engineer',
            targetReq: req.targetRole,
            yoe:       candidateProfile?.yearsExperience || 2,
            pitch:     req.pitch || '',
            skills:    candidateProfile?.skills || [],
            GitBranch: generateMockGitBranch(candidateProfile?.skills),
            leetcode:  generateMockLeetCode(),
            receivedAt: timeAgo(req.createdAt),
            requestId: req.id,
            _candidateId: req.candidateId,
            _candidateProfile: candidateProfile,
          }
        })
      )
      setInbox(enriched)
      loaded.inbox = true
      checkReady()
    }))

    unsubs.push(subscribeEmployeePipeline(user.uid, (p) => {
      setPipeline(p)
      loaded.pipeline = true
      checkReady()
    }))

    unsubs.push(subscribeAllCandidates((c) => {
      setCandidates(c)
      loaded.candidates = true
      checkReady()
    }))

    unsubs.push(subscribeEmployeeShadowInterviews(user.uid, (ints) => {
      setShadowInterviews(ints)
    }))

    return () => unsubs.forEach(u => u())
  }, [user])

  const [employerRecs, setEmployerRecs] = useState([])
  const [enrichedInbox, setEnrichedInbox] = useState([])

  useEffect(() => {
    if (!user || !profile) return
    let cancelled = false
    fetchAPI('/recommendations/employer', { employeeId: user.uid })
      .then(recs => { if (!cancelled) setEmployerRecs(recs) })
      .catch(err => console.error('Failed to fetch employer recs:', err))
    return () => { cancelled = true }
  }, [user, profile, candidates])

  useEffect(() => {
    if (!inbox.length || !profile) {
      setEnrichedInbox(inbox)
      return
    }
    let cancelled = false

    Promise.all(
      inbox.map(async (item) => {
        if (!item._candidateId) return { ...item }
        try {
          const scoring = await fetchAPI('/recommendations/score', {
            candidateId: item._candidateId,
            employeeId: profile.id,
          })
          return {
            ...item,
            match: scoring?.aiScore ?? item.match,
            aiScoring: scoring,
            aiInsight: scoring
              ? `AI score ${scoring.aiScore}% — skill match ${scoring.breakdown.skill.score}%, role fit ${scoring.breakdown.domain.score}%. ${scoring.matchedSkills.length > 0 ? `Shares: ${scoring.matchedSkills.slice(0,3).join(', ')}.` : ''}`
              : `Match score of ${item.match}% based on tech stack overlap.`,
          }
        } catch {
          return { ...item }
        }
      })
    ).then(enriched => { if (!cancelled) setEnrichedInbox(enriched) })

    return () => { cancelled = true }
  }, [inbox, profile])

  const reputation    = profile?.reputation ?? 3.5
  const totalRefs     = profile?.totalRefs ?? 0
  const totalBounty   = profile?.totalBounty ?? 0
  const pendingBounty = profile?.pendingBounty ?? 0

  const handleSelectTalent = (rec) => {
    const normalized = {
      id:        rec.id,
      alias:     rec.alias,
      realName:  rec.name || 'Unknown',
      email:     rec.email || '',
      match:     rec.aiScore,
      role:      rec.currentRole || 'Engineer',
      targetReq: rec.lookingFor || rec.currentRole || 'General',
      yoe:       rec.yearsExperience || 2,
      pitch:     rec.bio || '',
      aiInsight: `AI score ${rec.aiScore}% — skill match ${rec.breakdown.skill.score}%, role fit ${rec.breakdown.domain.score}%. ${rec.matchedSkills.length > 0 ? `Shares: ${rec.matchedSkills.slice(0, 3).join(', ')}.` : ''}`,
      skills:    rec.skills || [],
      GitBranch: generateMockGitBranch(rec.skills),
      leetcode:  generateMockLeetCode(),
      receivedAt: 'Just now',
      requestId: null,
      _candidateId: rec.id,
      _candidateProfile: { skills: rec.skills, yearsExperience: rec.yearsExperience },
      _fromTalentScout: true,
    }
    setSelected(normalized)
  }

  const handleRequestInterview = async (candidateId, targetRole) => {
    try {
      await fetchAPI('/shadow-interview/generate', {
        candidateId,
        employeeId: user.uid,
        targetRole: targetRole || 'Software Engineer',
      })
    } catch (err) {
      console.error('Failed to create shadow interview:', err)
    }
  }

  const getInterviewForCandidate = (candidateId) => {
    return shadowInterviews.find(i => i.candidateId === candidateId) || null
  }

  const handleDecide = async (candidateId, choice) => {
    const item = enrichedInbox.find(c => c.id === candidateId)
    if (!item) return

    try {
      if (choice === 'accept') {
        await acceptRequest(item.requestId, user.uid)
      } else {
        await declineRequest(item.requestId)
      }
    } catch (err) {
      console.error('Decision failed:', err)
    }
  }

  const handleUpdateProfile = async (data) => {
    try {
      await updateEmployeeProfile(user.uid, data)
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
  }

  if (!dataReady) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: C.bg }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#C8FF00] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#6B6966] tracking-widest uppercase">Loading dashboard</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, fontFamily: 'var(--font-info)' }}>
      <Sidebar active={tab} setActive={setTab} inboxCount={enrichedInbox.length} navigate={navigate} profile={profile} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar reputation={reputation} totalBounty={`$${totalBounty.toLocaleString()}`} />
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {tab === 'dashboard' && (
                <motion.div key="dash" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <DashboardTab inbox={enrichedInbox} reputation={reputation} totalRefs={totalRefs} totalBounty={totalBounty} pendingBounty={pendingBounty} setActive={setTab} topRecs={employerRecs.slice(0, 3)} />
                </motion.div>
              )}
              {tab === 'talent' && (
                <motion.div key="talent" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <TalentScoutTab recommendations={employerRecs} onSelect={handleSelectTalent} />
                </motion.div>
              )}
              {tab === 'inbox' && (
                <motion.div key="inbox" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <InboxTab inbox={enrichedInbox} onSelect={setSelected} />
                </motion.div>
              )}
              {tab === 'pipeline' && (
                <motion.div key="pipeline" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <PipelineTab pipeline={pipeline} />
                </motion.div>
              )}
              {tab === 'bounty' && (
                <motion.div key="bounty" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <BountyTab reputation={reputation} totalRefs={totalRefs} totalBounty={totalBounty} pendingBounty={pendingBounty} />
                </motion.div>
              )}
              {tab === 'settings' && (
                <motion.div key="settings" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <SettingsTab profile={profile} onUpdate={handleUpdateProfile} />
                </motion.div>
              )}
              {tab === 'help' && (
                <motion.div key="help" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <HelpTab />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selected && (
          <CandidateModal
            candidate={selected}
            onClose={() => setSelected(null)}
            onDecide={(id, choice) => { handleDecide(id, choice); setSelected(null) }}
            employeeProfile={profile}
            onRequestInterview={handleRequestInterview}
            interviewResult={getInterviewForCandidate(selected._candidateId || selected.id?.replace?.(/^req-/, ''))}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
