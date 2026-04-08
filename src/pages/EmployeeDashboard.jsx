import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, TrendingUp, LogOut, CheckCircle, X,
  Star, Shield,  Code2, Lock, Users, Zap,
  DollarSign, Mail, ExternalLink, ArrowRight,
  BarChart2, Activity, GitBranch, Terminal,
  Target, Layers, Clock, Briefcase, 
  Sparkles, ChevronRight, Settings, HelpCircle,
  AlertCircle, Award, LayoutDashboard
} from 'lucide-react'

// ── Design Tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:           '#0A0A0B',
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

const serif = { fontFamily: "'DM Serif Display', serif" }

// ── Mock Data ──────────────────────────────────────────────────────────────────
const INBOX_CANDIDATES = [
  {
    id: 1,
    alias: 'Candidate #A7F2',
    realName: 'David Chen',
    email: 'david.c@dev.io',
    match: 91,
    role: 'Senior Frontend Engineer',
    targetReq: 'Senior Frontend Engineer',
    yoe: 6,
    pitch: 'Led frontend infra at a 50-person Series B startup. Built the design system from scratch, reduced bundle size by 40%. Strong React + TypeScript. Looking for a fintech challenge where I can own a product area end-to-end.',
    aiInsight: 'Strong signal: High commit density in React repositories directly matches your current stack requirements. 64-day streak indicates sustained shipping cadence.',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'Figma'],
    GitBranch: {
      commits: 482, topLang: 'TypeScript', streak: 64, repos: 31,
      contributions: [
        [0,1,3,2,0,1,4],[2,3,1,0,2,4,3],[1,0,2,3,1,0,2],[3,2,4,1,3,2,0],
        [0,2,1,3,0,4,2],[1,3,0,2,1,3,4],[4,1,2,0,3,1,2],[2,0,3,4,1,2,3],
        [1,3,2,0,4,1,0],[0,1,4,2,3,0,1],[3,2,1,4,0,3,2],[1,0,3,2,1,4,3],
      ],
      languages: [{ lang: 'TypeScript', pct: 58 }, { lang: 'JavaScript', pct: 24 }, { lang: 'CSS', pct: 18 }],
    },
    leetcode: { solved: 312, rating: 1820, hard: 74, medium: 181, easy: 57 },
    receivedAt: '2h ago',
  },
  {
    id: 2,
    alias: 'Candidate #B3D9',
    realName: 'Sarah Jenkins',
    email: 's.jenkins@sys.dev',
    match: 78,
    role: 'Backend Engineer',
    targetReq: 'Full-Stack Developer',
    yoe: 4,
    pitch: 'Backend engineer with 4 years in distributed systems. Shipped features at scale for a 10M+ DAU product. Designed a Kafka-based event pipeline processing 2M events/day. Looking to move to a product-focused team.',
    aiInsight: 'Matches requirement for distributed systems experience. Notable skill gap in Kafka (currently learning). High LeetCode consistency indicates strong fundamentals.',
    skills: ['Go', 'Python', 'Kafka', 'PostgreSQL', 'AWS'],
    GitBranch: {
      commits: 267, topLang: 'Go', streak: 31, repos: 18,
      contributions: [
        [0,0,1,2,0,1,2],[1,2,0,0,1,3,2],[0,0,1,2,0,0,1],[2,1,3,0,2,1,0],
        [0,1,0,2,0,3,1],[1,2,0,1,1,2,3],[3,0,1,0,2,1,1],[1,0,2,3,0,1,2],
        [0,2,1,0,3,0,0],[0,1,3,1,2,0,1],[2,1,0,3,0,2,1],[0,0,2,1,1,3,2],
      ],
      languages: [{ lang: 'Go', pct: 62 }, { lang: 'Python', pct: 28 }, { lang: 'Shell', pct: 10 }],
    },
    leetcode: { solved: 198, rating: 1640, hard: 31, medium: 102, easy: 65 },
    receivedAt: '5h ago',
  },
  {
    id: 3,
    alias: 'Candidate #C1E5',
    realName: 'Marcus Silva',
    email: 'marcus@silva.net',
    match: 63,
    role: 'Full-Stack Engineer',
    targetReq: 'Full-Stack Developer',
    yoe: 2,
    pitch: 'Full-stack generalist with 2 years at a YC company. Comfortable owning features end-to-end. Shipped 3 core product features solo, from design review to production. Strong written communication.',
    aiInsight: 'Lower tech overlap but strong alignment with your previous successful referral profiles (YC alumni pattern). Written communication scores high across all signals.',
    skills: ['React', 'Rails', 'PostgreSQL', 'Redis', 'Docker'],
    GitBranch: {
      commits: 143, topLang: 'Ruby', streak: 18, repos: 12,
      contributions: [
        [0,0,0,1,0,0,1],[0,1,0,0,1,2,0],[0,0,0,1,0,0,0],[1,0,2,0,1,0,0],
        [0,0,0,1,0,2,0],[0,1,0,0,0,1,1],[1,0,0,0,1,0,0],[0,0,1,2,0,0,1],
        [0,1,0,0,2,0,0],[0,0,1,0,1,0,0],[1,0,0,2,0,1,0],[0,0,1,0,0,2,1],
      ],
      languages: [{ lang: 'Ruby', pct: 45 }, { lang: 'JavaScript', pct: 38 }, { lang: 'ERB', pct: 17 }],
    },
    leetcode: { solved: 89, rating: 1410, hard: 8, medium: 44, easy: 37 },
    receivedAt: '1d ago',
  },
]

const PIPELINE = [
  { id: 1, alias: 'Candidate #F4A1', name: 'Elena Rostova', role: 'Staff Engineer',      match: 88, status: 'hired',          bounty: 4200, date: '3w ago', stage: 4 },
  { id: 2, alias: 'Candidate #G2C3', name: 'James Kim',     role: 'Senior Backend',       match: 71, status: 'offer_extended', bounty: 2800, date: '5w ago', stage: 3 },
  { id: 3, alias: 'Candidate #H9B7', name: 'Priya Patel',   role: 'Frontend Engineer',    match: 65, status: 'interviewing',   bounty: 1500, date: '7w ago', stage: 2 },
  { id: 4, alias: 'Candidate #K2M8', name: 'Leo Marsh',     role: 'DevOps Engineer',      match: 55, status: 'declined',       bounty: 0,    date: '9w ago', stage: 1 },
]

const STAGES = ['Referred', 'Screening', 'Interview', 'Offer', 'Hired']

const STATUS_CFG = {
  hired:         { label: 'Hired',          color: C.emerald, bg: C.emeraldDim, border: C.emeraldBorder },
  offer_extended:{ label: 'Offer Extended', color: C.accent,  bg: C.accentDim,  border: C.accentBorder  },
  interviewing:  { label: 'Interviewing',   color: C.amber,   bg: C.amberDim,   border: C.amberBorder   },
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
  const cfg = STATUS_CFG[status]
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

// ── Candidate Review Modal ─────────────────────────────────────────────────────
function CandidateModal({ candidate, onClose, onDecide }) {
  const [tab, setTab]       = useState('overview')
  const [state, setState]   = useState('anon') // 'anon' | 'deciding' | 'revealed'
  const [action, setAction] = useState(null)

  const matchColor = candidate.match >= 80 ? C.accent : candidate.match >= 65 ? C.amber : C.subtle

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

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,11,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.975, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.32, ease: [0.22,1,0.36,1] } }}
        exit={{ opacity: 0, scale: 0.975, y: 8, transition: { duration: 0.2 } }}
        className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-sm overflow-hidden"
        style={{ background: '#0D0D0E', border: `1px solid ${C.border}` }}
      >
        {/* Match bar */}
        <div className="h-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${candidate.match}%` }}
            transition={{ duration: 0.85, ease: [0.22,1,0.36,1] }}
            style={{ height: '100%', background: matchColor }} />
        </div>

        {/* Header */}
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
                    {/* Explicit Target Req Display */}
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

        {/* Tabs — only in anon state */}
        {state !== 'revealed' && (
          <div className="flex" style={{ borderBottom: `1px solid ${C.border}` }}>
            {['overview', 'proof of work'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-5 py-2.5 text-xs font-medium capitalize transition-colors relative"
                style={{ color: tab === t ? C.accent : C.subtle }}>
                {t}
                {tab === t && <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-px" style={{ background: C.accent }} />}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">

            {/* ── REVEALED ── */}
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

            {/* ── ANON: OVERVIEW ── */}
            {state !== 'revealed' && tab === 'overview' && (
              <motion.div key="overview" variants={stagger} initial="hidden" animate="show" exit={{ opacity:0 }} className="space-y-4">
                {/* AI Insight */}
                <motion.div variants={fadeUp} className="rounded-sm p-3.5 flex gap-2.5"
                  style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}` }}>
                  <Sparkles size={12} style={{ color: C.accent }} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.accent }}>AI Signal</p>
                    <p className="text-xs leading-relaxed" style={{ color: C.secondary }}>{candidate.aiInsight}</p>
                  </div>
                </motion.div>
                {/* Pitch */}
                <motion.div variants={fadeUp}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Mail size={10} style={{ color: C.accent }} />
                    <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: C.muted }}>Warm intro pitch</span>
                  </div>
                  <div className="rounded-sm p-4" style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.accentBorder}` }}>
                    <p className="text-sm leading-relaxed" style={{ color: C.secondary }}>"{candidate.pitch}"</p>
                  </div>
                </motion.div>
                {/* Skills */}
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
                {/* Quick stats */}
                <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Commits', value: candidate.GitBranch.commits, sub: `${candidate.GitBranch.streak}d streak`, icon: GitBranch },
                    { label: 'LC Solved', value: candidate.leetcode.solved, sub: `Rating ${candidate.leetcode.rating}`, icon: Code2 },
                    { label: 'Years Exp', value: candidate.yoe, sub: candidate.role.split(' ')[0], icon: Briefcase },
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

            {/* ── ANON: PROOF OF WORK ── */}
            {state !== 'revealed' && tab === 'proof of work' && (
              <motion.div key="proof" variants={stagger} initial="hidden" animate="show" exit={{ opacity:0 }} className="space-y-4">
                {/* GitBranch */}
                <motion.div variants={fadeUp} className="rounded-sm p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <GitBranch size={12} style={{ color: C.accent }} />
                      <span className="text-xs font-semibold" style={{ color: C.primary }}>GitBranch Activity</span>
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
                {/* LeetCode */}
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
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Actions */}
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
                {state === 'deciding' ? 'Revealing...' : 'Accept & Reveal Identity'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, inboxCount, navigate }) {
  const primary = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
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
        {/* Brand */}
        <div className="px-2 mb-7">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: C.accent }}>RefHire</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>Referrer Portal</div>
        </div>

        {/* Anon tag */}
        <div className="mx-2 mb-5 flex items-center gap-2 px-2.5 py-2 rounded-sm"
          style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}` }}>
          <Lock size={9} style={{ color: C.accent }} />
          <span className="text-[10px] font-medium" style={{ color: C.accent }}>Anonymous mode on</span>
        </div>

        {/* Identity chip */}
        <div className="mx-2 mb-5 px-2.5 py-2 rounded-sm" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] mb-0.5" style={{ color: C.muted }}>Visible as</div>
          <div className="text-[11px] font-medium" style={{ color: C.secondary }}>Sr. React Dev @ FinTech</div>
        </div>

        {/* Primary nav */}
        <div className="mb-2">
          <div className="px-3 mb-1">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: C.muted }}>Main</span>
          </div>
          <nav className="space-y-0.5">
            {primary.map(p => <NavBtn key={p.id} {...p} />)}
          </nav>
        </div>

        {/* Divider */}
        <div className="my-3 mx-2" style={{ borderTop: `1px solid ${C.border}` }} />

        {/* Secondary nav */}
        <div>
          <div className="px-3 mb-1">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: C.muted }}>Account</span>
          </div>
          <nav className="space-y-0.5">
            {secondary.map(p => <NavBtn key={p.id} {...p} />)}
          </nav>
        </div>
      </div>

      {/* Sign out */}
      <button onClick={() => navigate?.('landing')}
        className="flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors"
        style={{ color: C.muted }}>
        <LogOut size={13} /> Sign out
      </button>
    </aside>
  )
}

// ── Topbar ─────────────────────────────────────────────────────────────────────
function Topbar({ tab, reputation, totalBounty }) {
  return (
    <div className="sticky top-0 z-20 h-14 px-6 md:px-8 flex items-center justify-between shrink-0"
      style={{ borderBottom:`1px solid ${C.border}`, background:'rgba(10,10,11,0.92)', backdropFilter:'blur(12px)' }}>
      
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
function DashboardTab({ inbox, reputation, totalRefs, totalBounty, pendingBounty, setActive }) {
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
        <h1 className="text-2xl font-bold mb-0.5" style={{ color: C.primary, ...serif }}>Referrer Dashboard</h1>
        <p className="text-sm" style={{ color: C.subtle }}>You are invisible to candidates until you accept their request.</p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total Earned',    value:`$${totalBounty.toLocaleString()}`, icon:DollarSign, hi: C.accent },
          { label:'Reputation',      value:reputation,                         icon:Star,       hi: C.amber,  sub:'/ 5.0' },
          { label:'Successful Hires',value:3,                                  icon:Award,      hi: C.primary },
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
        {/* Trust Protocol */}
        <motion.div variants={fadeUp} className="rounded-sm p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Shield size={13} style={{ color: C.accent }} />
            <span className="text-sm font-semibold" style={{ color: C.primary }}>Trust Protocol</span>
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: C.subtle }}>
            Your score rises with successful hires and falls with low-signal referrals. Higher tiers unlock premium profiles and bigger bounty splits.
          </p>
          {/* Score bar */}
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

        {/* Bounty Syndicate */}
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
              { label:'Next payout',     value:'Oct 1st',  color: C.secondary },
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

      {/* Quick inbox preview */}
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
        <h1 className="text-xl font-bold mb-0.5" style={{ color: C.primary, ...serif }}>Referral Inbox</h1>
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
                {/* match bar */}
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
                    {/* Explicit Target Req Display in Row */}
                    <div className="flex items-center gap-1.5 mt-1.5 mb-1.5">
                       <Target size={10} style={{ color: C.accent }} />
                       <span className="text-[9px]" style={{ color: C.subtle }}>Target Role: {c.targetReq}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {c.skills.slice(0,3).map(s => (
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
function PipelineTab() {
  const [filter, setFilter] = useState('all')
  const filters = ['all', 'hired', 'offer_extended', 'interviewing', 'declined']
  const visible  = filter === 'all' ? PIPELINE : PIPELINE.filter(r => r.status === filter)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold mb-0.5" style={{ color: C.primary, ...serif }}>My Referrals</h1>
        <p className="text-sm" style={{ color: C.subtle }}>Track candidates you have forwarded to HR and their pipeline stage.</p>
      </motion.div>

      {/* Filters */}
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

      {/* Table header */}
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
                  <p className="text-xs font-semibold truncate" style={{ color: C.primary }}>{r.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{r.date}</p>
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
        <h1 className="text-xl font-bold mb-0.5" style={{ color: C.primary, ...serif }}>Bounty & Reputation</h1>
        <p className="text-sm" style={{ color: C.subtle }}>Your trust score and fractional referral earnings.</p>
      </motion.div>

      {/* Score card */}
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
        {/* Tier table */}
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

      {/* Earnings */}
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

      {/* Mechanics */}
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

// ── Settings placeholder ───────────────────────────────────────────────────────
function SettingsTab() {
  const [stack, setStack] = useState(['React', 'Node.js', 'AWS', 'TypeScript'])
  const [input, setInput] = useState('')
  const addTag = () => { if (input.trim()) { setStack(s => [...s, input.trim()]); setInput('') } }

  // New state for Active Requisitions
  const [reqs, setReqs] = useState(['Senior Frontend Engineer', 'Full-Stack Developer'])
  const [reqInput, setReqInput] = useState('')
  const addReq = () => { if (reqInput.trim()) { setReqs(r => [...r, reqInput.trim()]); setReqInput('') } }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 max-w-xl">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold mb-0.5" style={{ color: C.primary, ...serif }}>Preferences</h1>
        <p className="text-sm" style={{ color: C.subtle }}>Configure your anonymous profile and matching criteria.</p>
      </motion.div>

      {[
        { title:'Anonymous Profile', desc:'Your public identity on the platform', content:(
          <div className="space-y-3">
            {[
              { label:'Visible as', value:'Senior React Dev @ FinTech Unicorn' },
              { label:'Corporate email', value:'•••••@company.com', verified: true },
              { label:'Anonymous since', value:'Sep 12, 2024' },
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
                  <button onClick={() => setReqs(prev => prev.filter(t => t !== r))}>
                    <X size={12} style={{ color: C.subtle }} hover={{ color: C.primary }} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={reqInput} onChange={e => setReqInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addReq()}
                placeholder="e.g. Senior Product Manager..."
                className="flex-1 text-xs px-3 py-2 rounded-sm outline-none"
                style={{ background: C.surface, border:`1px solid ${C.border}`, color: C.primary,
                         caretColor: C.accent }} />
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
                  <button onClick={() => setStack(prev => prev.filter(t => t !== s))}>
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
                style={{ background: C.surface, border:`1px solid ${C.border}`, color: C.primary,
                         caretColor: C.accent }} />
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

// ── Help placeholder ───────────────────────────────────────────────────────────
function HelpTab() {
  const faqs = [
    { q:'How is the AI match score calculated?', a:'The match score compares the candidate\'s verified skills, GitBranch activity patterns, and LeetCode rating against the tech stack you\'ve configured for your team. It also factors in your past successful referral profiles.' },
    { q:'When does my identity get revealed to the candidate?', a:'Only when you explicitly click "Accept & Reveal Identity." The candidate is never shown your profile unless you initiate. You remain invisible otherwise.' },
    { q:'How are bounties paid out?', a:'Bounties are released 30 days after the hire confirmation date, subject to your company\'s standard referral policy. RefHire takes no additional cut beyond the platform fee already agreed with your employer.' },
    { q:'What happens to my reputation if I pass on a candidate?', a:'Passing (declining) a candidate has no direct reputation impact. Reputation only changes based on outcomes of candidates you accepted and forwarded to HR.' },
  ]
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 max-w-xl">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold mb-0.5" style={{ color: C.primary, ...serif }}>Help & Documentation</h1>
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

// ── Root ───────────────────────────────────────────────────────────────────────
export default function EmployeeDashboard({ navigate }) {
  const [tab,      setTab]      = useState('dashboard')
  const [inbox,    setInbox]    = useState(INBOX_CANDIDATES)
  const [selected, setSelected] = useState(null)
  const [rep,      setRep]      = useState(4.6)
  const [refs,     setRefs]     = useState(14)

  const totalBounty   = 3500
  const pendingBounty = 2800

  const handleDecide = (id, choice) => {
    setInbox(prev => prev.filter(c => c.id !== id))
    if (choice === 'accept') {
      setRefs(n => n + 1)
      setRep(r => Math.min(5, parseFloat((r + 0.05).toFixed(2))))
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, fontFamily:"'DM Sans', sans-serif" }}>
      <Sidebar active={tab} setActive={setTab} inboxCount={inbox.length} navigate={navigate} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar tab={tab} reputation={rep} totalBounty={`$${totalBounty.toLocaleString()}`} />
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {tab === 'dashboard' && (
                <motion.div key="dash" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <DashboardTab inbox={inbox} reputation={rep} totalRefs={refs} totalBounty={totalBounty} pendingBounty={pendingBounty} setActive={setTab} />
                </motion.div>
              )}
              {tab === 'inbox' && (
                <motion.div key="inbox" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <InboxTab inbox={inbox} onSelect={setSelected} />
                </motion.div>
              )}
              {tab === 'pipeline' && (
                <motion.div key="pipeline" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <PipelineTab />
                </motion.div>
              )}
              {tab === 'bounty' && (
                <motion.div key="bounty" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <BountyTab reputation={rep} totalRefs={refs} totalBounty={totalBounty} pendingBounty={pendingBounty} />
                </motion.div>
              )}
              {tab === 'settings' && (
                <motion.div key="settings" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <SettingsTab />
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
          />
        )}
      </AnimatePresence>
    </div>
  )
}