import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Search, Bell, LogOut, GitBranch, Code2,
  Zap, Lock, ChevronRight, X, Send, Coins, TrendingUp,
  CheckCircle, Clock, XCircle, BarChart2, Star, User,
  BrainCircuit, Target, BookOpen, Sparkles, ArrowUpRight,
  Eye, RefreshCw, MessageSquare, AlertCircle, TriangleAlert, ChevronDown
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { lang: 'TypeScript', pct: 82, commits: 412 },
  { lang: 'Python', pct: 61, commits: 218 },
  { lang: 'Go', pct: 44, commits: 97 },
  { lang: 'Rust', pct: 28, commits: 43 },
  { lang: 'SQL', pct: 19, commits: 31 },
]

const HEATMAP = Array.from({ length: 52 * 7 }, () => ({
  active: Math.random() > 0.58,
  intensity: Math.floor(Math.random() * 4),
}))

const REFERRERS = [
  { id: 1, alias: 'Senior SWE @ Series-B Fintech', stack: ['React', 'Node.js', 'AWS'], activeReqs: ['Senior Frontend Engineer', 'Full-Stack Developer'], company_tier: 'Series-B', match: 91, reputation: 4.8, refs: 14, requested: false },
  { id: 2, alias: 'Staff Eng @ Public SaaS Co.', stack: ['TypeScript', 'Go', 'GCP'], activeReqs: ['Staff Backend Engineer'], company_tier: 'Public', match: 78, reputation: 4.6, refs: 22, requested: false },
  { id: 3, alias: 'Senior Frontend @ FinTech Unicorn', stack: ['React', 'TypeScript', 'GraphQL'], activeReqs: ['Frontend Architect', 'React Engineer'], company_tier: 'Unicorn', match: 74, reputation: 4.9, refs: 8, requested: false },
  { id: 4, alias: 'Backend Lead @ YC S22', stack: ['Python', 'FastAPI', 'Redis'], activeReqs: ['Backend Engineer (Python)'], company_tier: 'YC', match: 68, reputation: 4.3, refs: 31, requested: false },
  { id: 5, alias: 'Platform Eng @ FAANG Adjacent', stack: ['Go', 'K8s', 'Terraform'], activeReqs: ['Site Reliability Engineer', 'DevOps Lead'], company_tier: 'FAANG+', match: 55, reputation: 4.7, refs: 19, requested: false },
]

const REQUESTS = [
  { id: 1, company: 'Series-B Fintech', role: 'Senior Frontend Engineer', status: 'accepted', match: 91, date: '2d ago', referrer: 'Senior SWE @ Fintech' },
  { id: 2, company: 'YC S23 Startup', role: 'Full-Stack Engineer', status: 'pending', match: 74, date: '4d ago', referrer: 'Backend Lead @ YC' },
  { id: 3, company: 'Public SaaS Co.', role: 'Staff Engineer', status: 'declined', match: 61, date: '1w ago', referrer: 'Staff Eng @ SaaS' },
]

const ACTIVITY = [
  { id: 1, type: 'view', text: 'Your profile was viewed by a referrer', meta: '2h ago', icon: Eye, color: 'text-[#6B6966]' },
  { id: 2, type: 'match', text: 'New high-confidence match found — 91%', meta: '5h ago', icon: Zap, color: 'text-[#C8FF00]' },
  { id: 3, type: 'accepted', text: 'Request accepted at Series-B Fintech', meta: '2d ago', icon: CheckCircle, color: 'text-emerald-400' },
  { id: 4, type: 'token', text: 'Monthly tokens reset — 3 available', meta: '3d ago', icon: Coins, color: 'text-amber-400' },
  { id: 5, type: 'view', text: 'Profile viewed by 3 new referrers', meta: '5d ago', icon: Eye, color: 'text-[#6B6966]' },
]

const SKILL_GAPS = [
  { role: 'Senior Frontend Eng', company_tier: 'Unicorn', missing: ['GraphQL', 'Kubernetes'], your_match: 74, potential: 91 },
  { role: 'Staff SWE', company_tier: 'FAANG+', missing: ['System Design', 'Distributed Systems'], your_match: 55, potential: 82 },
]

const WARM_INTROS = [
  { id: 1, generated: true, preview: 'Hi — I noticed your team uses React and Node.js extensively. My recent work on a high-traffic fintech dashboard (TypeScript, 400+ commits this year) maps closely to what your stack requires. Would love to explore if there is a fit.' },
  { id: 2, generated: false, preview: null },
  { id: 3, generated: false, preview: null },
]

const statusConfig = {
  accepted: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Accepted' },
  pending:  { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   label: 'Pending' },
  declined: { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/20',     label: 'Declined' },
}

const getIntensity = (i, active) => {
  if (!active) return 'bg-white/[0.04]'
  return ['bg-[#C8FF00]/20', 'bg-[#C8FF00]/40', 'bg-[#C8FF00]/65', 'bg-[#C8FF00]'][i] || 'bg-[#C8FF00]/20'
}

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

const page = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.055 } },
}
const row = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } },
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: 'Core',
    items: [
      { id: 'overview',  icon: LayoutDashboard, label: 'Overview' },
      { id: 'profile',   icon: User,            label: 'My Profile' },
      { id: 'discover',  icon: Search,          label: 'Discover Referrers' },
      { id: 'requests',  icon: Bell,            label: 'My Requests', badge: 1 },
    ],
  },
  {
    label: 'AI-Powered',
    items: [
      { id: 'ai-match',   icon: BrainCircuit,  label: 'AI Match Engine' },
      { id: 'warm-intro', icon: MessageSquare, label: 'Warm Intro Generator' },
      { id: 'skill-gap',  icon: Target,        label: 'Skill Gap Navigator' },
    ],
  },
]

const PAGE_LABELS = {
  overview:    'Overview',
  profile:     'My Profile',
  discover:    'Discover Referrers',
  requests:    'My Requests',
  'ai-match':  'AI Match Engine',
  'warm-intro':'Warm Intro Generator',
  'skill-gap': 'Skill Gap Navigator',
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({ active, setActive, navigate, tokens }) {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/6">
      <div className="px-5 py-5 border-b border-white/6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#C8FF00]">RefHire</span>
          
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-[#C8FF00]">AK</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#E8E6E1] truncate">Alex Kumar</p>
            <p className="text-[10px] text-[#3D3B38] truncate">alex@dev.io</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-medium tracking-widest uppercase text-[#3D3B38] px-2 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ id, icon: Icon, label, badge }) => (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-sm transition-all duration-150 ${
                    active === id
                      ? 'bg-[#C8FF00]/10 text-[#C8FF00]'
                      : 'text-[#6B6966] hover:text-[#A09E9A] hover:bg-white/3'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={13} />
                    <span className="text-[13px]">{label}</span>
                  </span>
                  {badge && (
                    <span className="w-4 h-4 rounded-full bg-[#C8FF00] text-[#0A0A0B] text-[9px] font-bold flex items-center justify-center shrink-0">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-4 border-t border-white/6 space-y-2">
        <div className="px-2.5 py-2.5 bg-white/2 border border-white/6 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Coins size={11} className="text-[#C8FF00]" />
              <span className="text-[11px] text-[#6B6966]">Referral tokens</span>
            </div>
            <span className="text-[11px] font-semibold text-[#E8E6E1]">{tokens}/3</span>
          </div>
          <div className="flex gap-1 mb-1.5">
            {[0,1,2].map(i => (
              <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${i < tokens ? 'bg-[#C8FF00]' : 'bg-white/8'}`} />
            ))}
          </div>
          <p className="text-[10px] text-[#3D3B38]">Resets in 18 days</p>
        </div>
        <button
          onClick={() => navigate('landing')}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-[13px] text-[#3D3B38] hover:text-[#6B6966] transition-colors rounded-sm hover:bg-white/2"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────────────────────

function Topbar({ activeTab, tokens }) {
  return (
    <div >
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────

function SH({ title, sub, action, onAction }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <p className="text-[13px] font-semibold text-[#E8E6E1]">{title}</p>
        {sub && <p className="text-[11px] text-[#6B6966] mt-0.5">{sub}</p>}
      </div>
      {action && (
        <button onClick={onAction} className="flex items-center gap-1 text-[11px] text-[#6B6966] hover:text-[#C8FF00] transition-colors shrink-0">
          {action} <ArrowUpRight size={11} />
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST MODAL
// ─────────────────────────────────────────────────────────────────────────────

function RequestModal({ referrer, tokens, onClose, onSend }) {
  const [pitch, setPitch] = useState('')
  const [selectedReq, setSelectedReq] = useState(referrer.activeReqs?.[0] || '')
  const [isDrafting, setIsDrafting] = useState(false)

  const handleAIDraft = () => {
    setIsDrafting(true)
    setTimeout(() => {
      setPitch(`My recent work with scalable architectures perfectly matches the ${selectedReq} requirements. With my strong background in ${referrer.stack[0]} and ${referrer.stack[1]}, I can contribute immediately to your team. I would greatly appreciate a referral.`)
      setIsDrafting(false)
    }, 1200)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-[#0F0F0E] border border-white/10 rounded-sm p-6"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-[#E8E6E1]">Send referral request</p>
            <p className="text-xs text-[#6B6966] mt-0.5">{referrer.alias}</p>
          </div>
          <button onClick={onClose} className="text-[#3D3B38] hover:text-[#6B6966] transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="flex items-center gap-2 bg-amber-400/5 border border-amber-400/20 rounded-sm px-3 py-2 mb-4">
          <Coins size={11} className="text-amber-400 shrink-0" />
          <span className="text-xs text-amber-400">1 token will be spent · {tokens - 1} remaining after</span>
        </div>
        
        {/* Active Req Selection */}
        <div className="mb-4">
          <label className="text-xs text-[#6B6966] block mb-1.5">Target Role</label>
          <div className="relative">
            <select 
              value={selectedReq}
              onChange={e => setSelectedReq(e.target.value)}
              className="w-full bg-white/3 border border-white/8 text-sm text-[#E8E6E1] px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#C8FF00]/40 appearance-none transition-colors"
            >
              {referrer.activeReqs?.map(req => (
                <option key={req} value={req} className="bg-[#0F0F0E] text-[#E8E6E1]">{req}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-[#6B6966] pointer-events-none" />
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-[#6B6966]">Your pitch</label>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleAIDraft} 
                disabled={isDrafting}
                className="flex items-center gap-1.5 text-[10px] bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] hover:bg-[#C8FF00]/20 px-2 py-1 rounded-sm transition-colors disabled:opacity-50"
              >
                <Sparkles size={10} className={isDrafting ? "animate-pulse" : ""} />
                {isDrafting ? 'Drafting...' : 'AI Draft'}
              </button>
              <span className={`text-[10px] ${pitch.length > 180 ? 'text-amber-400' : 'text-[#3D3B38]'}`}>{pitch.length}/200</span>
            </div>
          </div>
          <textarea
            rows={4} maxLength={200} value={pitch} onChange={e => setPitch(e.target.value)}
            placeholder="Why are you a strong fit for their team? Be specific — this is your one shot."
            className="w-full bg-white/3 border border-white/8 text-sm text-[#E8E6E1] placeholder-[#3D3B38] px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#C8FF00]/40 transition-colors resize-none"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-white/8 text-[#6B6966] hover:text-[#A09E9A] py-2.5 text-sm rounded-sm transition-colors">Cancel</button>
          <button
            onClick={() => { onSend(); onClose() }}
            disabled={!pitch.trim() || tokens === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-[#C8FF00] text-[#0A0A0B] font-semibold py-2.5 text-sm rounded-sm hover:bg-[#D4FF26] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={13} /> Send request
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

function OverviewPage({ setActiveTab, tokens, referrers, onRequest }) {
  const top3 = [...referrers].sort((a, b) => b.match - a.match).slice(0, 3)

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-6">

      <motion.div variants={row}>
        <h1 className="text-2xl font-bold text-[#E8E6E1] leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Good morning, Alex.
        </h1>
        <p className="text-sm text-[#6B6966] mt-1">
          Your proof-of-work profile is live.{' '}
          <span className="text-[#C8FF00]">5 referrers</span> currently match your stack.
        </p>
      </motion.div>

      {/* Pipeline stats */}
      <motion.div variants={row} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Profile views', value: '47', trend: '+12 this week', up: true },
          { label: 'Matched referrers', value: '5', trend: 'Top 18% of candidates', up: true },
          { label: 'Requests sent', value: '1', trend: '2 tokens left', up: null },
          { label: 'Awaiting response', value: '1', trend: 'Sent 4 days ago', up: null },
        ].map(s => (
          <div key={s.label} className="bg-white/2 border border-white/5 rounded-sm px-4 py-3.5">
            <p className="text-[10px] text-[#6B6966] uppercase tracking-wider mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-[#E8E6E1] leading-none" style={{ fontFamily: "'DM Serif Display', serif" }}>{s.value}</p>
            <p className={`text-[11px] mt-1.5 ${s.up === true ? 'text-emerald-400' : 'text-[#3D3B38]'}`}>{s.trend}</p>
          </div>
        ))}
      </motion.div>

      {/* Two-column: top matches + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <motion.div variants={row} className="lg:col-span-3 border border-white/6 rounded-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[#E8E6E1]">Top matched referrers</p>
              <p className="text-[11px] text-[#6B6966] mt-0.5">AI probability score · anonymous</p>
            </div>
            <button onClick={() => setActiveTab('discover')} className="flex items-center gap-1 text-[11px] text-[#6B6966] hover:text-[#C8FF00] transition-colors">
              All referrers <ArrowUpRight size={10} />
            </button>
          </div>
          <div className="divide-y divide-white/4">
            {top3.map((r, i) => (
              <div key={r.id} className="px-5 py-4 flex items-start gap-3 hover:bg-white/1.5 transition-colors">
                <span className="text-[11px] text-[#3D3B38] w-5 shrink-0 mt-0.5">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Lock size={9} className="text-[#C8FF00] shrink-0" />
                    <p className="text-[13px] font-medium text-[#E8E6E1] truncate">{r.alias}</p>
                  </div>
                  <div className="flex gap-1.5 mb-2.5">
                    {r.stack.slice(0,3).map(s => (
                      <span key={s} className="text-[10px] text-[#6B6966] bg-white/3 px-1.5 py-0.5 rounded-sm">{s}</span>
                    ))}
                  </div>
                  {/* Active Reqs Tag */}
                  {r.activeReqs && r.activeReqs.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Target size={11} className="text-[#C8FF00]" />
                      <span className="text-[10px] text-[#A09E9A]">Actively referring for:</span>
                      <span className="text-[10px] text-[#E8E6E1] font-medium truncate">{r.activeReqs.join(', ')}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end shrink-0 ml-2">
                  <div className="text-right mb-2">
                    <p className={`text-base font-bold ${r.match >= 80 ? 'text-[#C8FF00]' : 'text-[#A09E9A]'}`} style={{ fontFamily: "'DM Serif Display', serif" }}>
                      {r.match}%
                    </p>
                    <p className="text-[10px] text-[#3D3B38]">match</p>
                  </div>
                  <button
                    onClick={() => onRequest(r)}
                    disabled={r.requested}
                    className={`shrink-0 text-[11px] font-medium px-2.5 py-1.5 rounded-sm transition-all duration-200 ${
                      r.requested
                        ? 'text-emerald-400 bg-emerald-400/10 cursor-default'
                        : 'text-[#C8FF00] bg-[#C8FF00]/8 border border-[#C8FF00]/20 hover:bg-[#C8FF00] hover:text-[#0A0A0B]'
                    }`}
                  >
                    {r.requested ? 'Sent' : 'Request'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={row} className="lg:col-span-2 border border-white/6 rounded-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6">
            <p className="text-[13px] font-semibold text-[#E8E6E1]">Activity</p>
            <p className="text-[11px] text-[#6B6966] mt-0.5">Platform events</p>
          </div>
          <div className="divide-y divide-white/4">
            {ACTIVITY.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-start gap-3">
                <div className="w-6 h-6 rounded-sm bg-white/4 flex items-center justify-center shrink-0 mt-0.5">
                  <a.icon size={11} className={a.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#A09E9A] leading-snug">{a.text}</p>
                  <p className="text-[10px] text-[#3D3B38] mt-0.5">{a.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Pipeline strip */}
      <motion.div variants={row} className="border border-white/6 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-[#E8E6E1]">Referral pipeline</p>
            <p className="text-[11px] text-[#6B6966] mt-0.5">Active and recent requests</p>
          </div>
          <button onClick={() => setActiveTab('requests')} className="flex items-center gap-1 text-[11px] text-[#6B6966] hover:text-[#C8FF00] transition-colors">
            Manage <ArrowUpRight size={10} />
          </button>
        </div>
        <div className="divide-y divide-white/4">
          {REQUESTS.map(r => {
            const cfg = statusConfig[r.status]
            return (
              <div key={r.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/1.5 transition-colors">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[11px] font-medium ${cfg.bg} ${cfg.color} border ${cfg.border} shrink-0`}>
                  <cfg.icon size={10} />{cfg.label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#E8E6E1] truncate">{r.company}</p>
                  <p className="text-[11px] text-[#6B6966] truncate">{r.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#C8FF00]">{r.match}%</p>
                  <p className="text-[10px] text-[#3D3B38]">{r.date}</p>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={row} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Complete your profile', sub: 'GitBranch not yet synced', icon: GitBranch, action: 'profile' },
          { label: 'Run AI match scan', sub: 'Last run 5 hours ago', icon: BrainCircuit, action: 'ai-match' },
          { label: 'Fill skill gaps', sub: '2 high-impact gaps found', icon: Target, action: 'skill-gap' },
        ].map(q => (
          <button
            key={q.label}
            onClick={() => setActiveTab(q.action)}
            className="text-left border border-white/6 rounded-sm p-4 hover:border-white/12 transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-7 h-7 border border-white/[0.07] flex items-center justify-center rounded-sm group-hover:border-[#C8FF00]/25 transition-colors">
                <q.icon size={13} className="text-[#6B6966] group-hover:text-[#C8FF00] transition-colors" />
              </div>
              <ArrowUpRight size={11} className="text-[#3D3B38] group-hover:text-[#C8FF00] transition-colors mt-0.5" />
            </div>
            <p className="text-[13px] font-medium text-[#E8E6E1] mb-0.5">{q.label}</p>
            <p className="text-[11px] text-[#6B6966]">{q.sub}</p>
          </button>
        ))}
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: MY PROFILE
// ─────────────────────────────────────────────────────────────────────────────

function ProfilePage() {
  const completionItems = [
    { label: 'Email verified', done: true },
    { label: 'GitBranch connected', done: false },
    { label: 'LeetCode linked', done: false },
    { label: 'Skills tagged', done: true },
    { label: 'Bio added', done: true },
  ]
  const done = completionItems.filter(i => i.done).length
  const pct = Math.round((done / completionItems.length) * 100)

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5 max-w-3xl">
      <motion.div variants={row}>
        <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: "'DM Serif Display', serif" }}>My Profile</h1>
        <p className="text-sm text-[#6B6966] mt-0.5">Your proof-of-work identity visible to referrers after mutual opt-in.</p>
      </motion.div>

      <motion.div variants={row} className="border border-white/6 rounded-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-[#E8E6E1]">Profile completeness</p>
          <span className="text-sm font-bold text-[#C8FF00]">{pct}%</span>
        </div>
        <div className="h-1 bg-white/6 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            className="h-full bg-[#C8FF00] rounded-full"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {completionItems.map(item => (
            <div key={item.label} className={`flex items-center gap-2 text-[12px] ${item.done ? 'text-[#A09E9A]' : 'text-[#3D3B38]'}`}>
              {item.done
                ? <CheckCircle size={11} className="text-emerald-400 shrink-0" />
                : <AlertCircle size={11} className="text-[#3D3B38] shrink-0" />}
              {item.label}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={row} className="border border-white/6 rounded-sm p-5">
        <SH title="Basic information" sub="Shown after mutual referral reveal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            ['Full name', 'Alex Kumar'], ['Email', 'alex@dev.io'],
            ['Current role', 'Senior Frontend Engineer'], ['Years experience', '4 years'],
            ['Location', 'Bangalore, India'], ['Looking for', 'Fintech / SaaS'],
          ].map(([label, value]) => (
            <div key={label} className="bg-white/2 border border-white/5 rounded-sm px-3 py-2.5">
              <p className="text-[10px] text-[#3D3B38] uppercase tracking-wider mb-1">{label}</p>
              <p className="text-[13px] text-[#E8E6E1]">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={row} className="border border-white/6 rounded-sm p-5">
        <SH title="Tech stack" sub="Used for AI matching" />
        <div className="flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Node.js', 'Python', 'Go', 'PostgreSQL', 'Redis', 'AWS', 'Docker'].map(s => (
            <span key={s} className="text-[12px] bg-white/4 border border-white/6 text-[#A09E9A] px-2.5 py-1 rounded-sm">{s}</span>
          ))}
          <button className="text-[12px] border border-dashed border-white/10 text-[#3D3B38] hover:text-[#6B6966] hover:border-white/20 px-2.5 py-1 rounded-sm transition-colors">
            + Add skill
          </button>
        </div>
      </motion.div>

      <motion.div variants={row} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { icon: GitBranch, title: 'Connect GitBranch', sub: 'Generates commit heatmap and language breakdown.' },
          { icon: Code2, title: 'Link LeetCode', sub: 'Adds solve count and contest rating to your profile.' },
        ].map(({ icon: Icon, title, sub }) => (
          <div key={title} className="border border-dashed border-white/10 rounded-sm p-5 flex flex-col gap-3">
            <div className="w-8 h-8 border border-white/8 rounded-sm flex items-center justify-center">
              <Icon size={14} className="text-[#6B6966]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#E8E6E1]">{title}</p>
              <p className="text-[11px] text-[#6B6966] mt-0.5">{sub}</p>
            </div>
            <button className="self-start text-[12px] bg-[#C8FF00]/10 border border-[#C8FF00]/25 text-[#C8FF00] px-3 py-1.5 rounded-sm hover:bg-[#C8FF00] hover:text-[#0A0A0B] transition-colors font-medium">
              Connect →
            </button>
          </div>
        ))}
      </motion.div>

      <motion.div variants={row} className="border border-white/6 rounded-sm p-5">
        <SH title="GitBranch commit activity" sub="Requires GitBranch connection" />
        <div className="opacity-40 pointer-events-none">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#6B6966]">Last 12 months</span>
          </div>
          <div className="overflow-x-auto">
            <div className="grid gap-0.75" style={{ gridTemplateColumns: 'repeat(52,1fr)', gridTemplateRows: 'repeat(7,1fr)', width:'100%' }}>
              {HEATMAP.map((cell, i) => (
                <div key={i} className={`w-full aspect-square rounded-xs ${getIntensity(cell.intensity, cell.active)}`} style={{ minWidth:8, minHeight:8 }} />
              ))}
            </div>
          </div>
          <div className="mt-5 space-y-2.5">
            {LANGUAGES.map(l => (
              <div key={l.lang}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#A09E9A]">{l.lang}</span>
                  <span className="text-[#3D3B38]">{l.commits} commits</span>
                </div>
                <div className="h-0.5 bg-white/6 rounded-full">
                  <div className="h-full bg-[#C8FF00] rounded-full" style={{ width: `${l.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-[#3D3B38] mt-3">Connect GitBranch above to unlock this section.</p>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: DISCOVER
// ─────────────────────────────────────────────────────────────────────────────

function DiscoverPage({ referrers, onRequest }) {
  const [filter, setFilter] = useState('')
  const filtered = referrers.filter(r =>
    !filter ||
    r.stack.some(s => s.toLowerCase().includes(filter.toLowerCase())) ||
    r.alias.toLowerCase().includes(filter.toLowerCase()) ||
    r.company_tier.toLowerCase().includes(filter.toLowerCase()) ||
    (r.activeReqs && r.activeReqs.some(req => req.toLowerCase().includes(filter.toLowerCase())))
  )

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={row}>
        <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: "'DM Serif Display', serif" }}>Discover Referrers</h1>
        <p className="text-sm text-[#6B6966] mt-0.5">All identities are anonymised until mutual opt-in. Sorted by AI probability score.</p>
      </motion.div>

      <motion.div variants={row} className="flex items-center gap-2 bg-white/3 border border-white/6 rounded-sm px-3 py-2.5">
        <Search size={13} className="text-[#3D3B38] shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm text-[#E8E6E1] placeholder-[#3D3B38] focus:outline-none"
          placeholder="Filter by stack, role, or company tier..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        {filter && <button onClick={() => setFilter('')} className="text-[#3D3B38] hover:text-[#6B6966]"><X size={13} /></button>}
      </motion.div>

      <motion.div variants={row} className="border border-white/6 rounded-sm overflow-hidden">
        <div className="divide-y divide-white/4">
          {filtered.map((r, i) => (
            <div key={r.id} className="px-5 py-4 flex items-start sm:items-center flex-col sm:flex-row gap-4 hover:bg-white/1.5 transition-colors">
              <div className="hidden sm:block text-[11px] text-[#3D3B38] w-5 shrink-0 font-medium">#{i+1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lock size={9} className="text-[#C8FF00]" />
                  <span className="text-[10px] text-[#C8FF00] font-medium">Anonymous</span>
                </div>
                <p className="text-[13px] font-medium text-[#E8E6E1] mb-1.5">{r.alias}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {r.stack.map(s => (
                    <span key={s} className="text-[10px] bg-white/4 border border-white/5 text-[#6B6966] px-1.5 py-0.5 rounded-sm">{s}</span>
                  ))}
                  <span className="text-[10px] bg-[#C8FF00]/5 border border-[#C8FF00]/15 text-[#C8FF00] px-1.5 py-0.5 rounded-sm">{r.company_tier}</span>
                </div>
                {/* Active Reqs Tag */}
                {r.activeReqs && r.activeReqs.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Target size={11} className="text-[#C8FF00]" />
                    <span className="text-[10px] text-[#A09E9A]">Actively referring for:</span>
                    <span className="text-[10px] text-[#E8E6E1] font-medium">{r.activeReqs.join(', ')}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end gap-6 mt-2 sm:mt-0">
                <div className="hidden lg:flex items-center gap-1 text-[11px] text-[#6B6966] shrink-0">
                  <Star size={10} className="text-amber-400" />{r.reputation}
                  <span className="text-[#3D3B38] ml-1">{r.refs} refs</span>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className={`text-base font-bold ${r.match>=80?'text-[#C8FF00]':r.match>=65?'text-amber-400':'text-[#6B6966]'}`} style={{ fontFamily:"'DM Serif Display',serif" }}>
                    {r.match}%
                  </p>
                  <p className="text-[10px] text-[#3D3B38]">match</p>
                </div>
                <button
                  onClick={() => onRequest(r)}
                  disabled={r.requested}
                  className={`text-[12px] font-medium px-3 py-1.5 rounded-sm transition-all duration-200 shrink-0 ${
                    r.requested
                      ? 'bg-emerald-400/10 text-emerald-400 cursor-default'
                      : 'bg-[#C8FF00]/8 border border-[#C8FF00]/20 text-[#C8FF00] hover:bg-[#C8FF00] hover:text-[#0A0A0B]'
                  }`}
                >
                  {r.requested ? '✓ Sent' : 'Request →'}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-[#3D3B38]">No referrers match that filter.</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: MY REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

function RequestsPage() {
  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={row}>
        <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: "'DM Serif Display', serif" }}>My Requests</h1>
        <p className="text-sm text-[#6B6966] mt-0.5">Full pipeline — from request sent to hire.</p>
      </motion.div>

      <motion.div variants={row} className="flex items-center gap-2 flex-wrap">
        {[
          { label: '1 Accepted', color: 'text-emerald-400', bg: 'bg-emerald-400/8 border-emerald-400/20' },
          { label: '1 Pending',  color: 'text-amber-400',   bg: 'bg-amber-400/8 border-amber-400/20' },
          { label: '1 Declined', color: 'text-[#6B6966]',   bg: 'bg-white/[0.04] border-white/[0.08]' },
        ].map(c => (
          <span key={c.label} className={`text-[11px] font-medium px-2.5 py-1 rounded-sm border ${c.bg} ${c.color}`}>{c.label}</span>
        ))}
      </motion.div>

      <motion.div variants={row} className="border border-white/6 rounded-sm overflow-hidden">
        <div className="divide-y divide-white/4">
          {REQUESTS.map(r => {
            const cfg = statusConfig[r.status]
            return (
              <div key={r.id} className="px-5 py-4 hover:bg-white/1.5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <cfg.icon size={13} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold text-[#E8E6E1]">{r.company}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
                    </div>
                    <p className="text-[11px] text-[#6B6966]">{r.role} · via {r.referrer}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#C8FF00]">{r.match}%</p>
                    <p className="text-[10px] text-[#3D3B38]">{r.date}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: AI MATCH ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function AIMatchPage({ referrers }) {
  const [running, setRunning] = useState(false)
  const runScan = () => { setRunning(true); setTimeout(() => setRunning(false), 1800) }

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5 max-w-3xl">
      <motion.div variants={row}>
        <div className="flex items-center gap-2 mb-1">
          <BrainCircuit size={15} className="text-[#C8FF00]" />
          <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: "'DM Serif Display', serif" }}>AI Match Engine</h1>
        </div>
        <p className="text-sm text-[#6B6966]">Your skills are scored against every referrer's team stack. The engine weighs tech overlap, company stage fit, and referrer success history.</p>
      </motion.div>

      <motion.div variants={row} className="border border-white/6 rounded-sm p-5">
        <SH title="Match score breakdown" sub="How your top match (91%) was calculated" />
        <div className="space-y-3.5">
          {[
            { factor: 'Tech stack overlap',        score: 94, weight: '40%' },
            { factor: 'Referrer success history',  score: 82, weight: '25%' },
            { factor: 'Company stage fit',         score: 88, weight: '20%' },
            { factor: 'Commit signal strength',    score: 76, weight: '15%' },
          ].map(f => (
            <div key={f.factor}>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="text-[#A09E9A]">{f.factor}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#3D3B38]">weight {f.weight}</span>
                  <span className="font-semibold text-[#E8E6E1] w-6 text-right">{f.score}</span>
                </div>
              </div>
              <div className="h-1 bg-white/6 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${f.score}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  className="h-full bg-[#C8FF00] rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={row} className="border border-white/6 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-[#E8E6E1]">All referrers — probability scores</p>
            <p className="text-[11px] text-[#6B6966] mt-0.5">Last updated 5 hours ago</p>
          </div>
          <button
            onClick={runScan} disabled={running}
            className="flex items-center gap-1.5 text-[12px] border border-white/8 text-[#6B6966] hover:text-[#E8E6E1] hover:border-white/20 px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={11} className={running ? 'animate-spin' : ''} />
            {running ? 'Scanning...' : 'Re-scan'}
          </button>
        </div>
        <div className="divide-y divide-white/4">
          {[...referrers].sort((a,b) => b.match - a.match).map(r => (
            <div key={r.id} className="px-5 py-3.5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#E8E6E1] truncate">{r.alias}</p>
                <div className="flex gap-1.5 mt-0.5">
                  {r.stack.slice(0,3).map(s => <span key={s} className="text-[10px] text-[#6B6966]">{s}</span>)}
                </div>
              </div>
              <div className="w-24 shrink-0">
                <div className="h-1 bg-white/6 rounded-full overflow-hidden">
                  <div className="h-full bg-[#C8FF00] rounded-full" style={{ width: `${r.match}%` }} />
                </div>
              </div>
              <p className={`text-sm font-bold shrink-0 w-10 text-right ${r.match>=80?'text-[#C8FF00]':r.match>=65?'text-amber-400':'text-[#6B6966]'}`} style={{ fontFamily:"'DM Serif Display',serif" }}>
                {r.match}%
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: WARM INTRO GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

function WarmIntroPage({ referrers }) {
  const [generating, setGenerating] = useState(null)
  const [intros, setIntros] = useState(WARM_INTROS)
  const top3 = referrers.slice(0,3)

  const generate = (id) => {
    setGenerating(id)
    setTimeout(() => {
      setIntros(prev => prev.map(i => i.id === id
        ? { ...i, generated: true, preview: "Based on your team's TypeScript and Node.js stack, I believe there's a strong overlap with my recent work on a real-time fintech dashboard — 400+ commits this year, 4-person team, shipped to 10k+ daily users. My 91% match score reflects that alignment. Would love to explore further if the timing is right." }
        : i
      ))
      setGenerating(null)
    }, 1600)
  }

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5 max-w-3xl">
      <motion.div variants={row}>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare size={15} className="text-[#C8FF00]" />
          <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: "'DM Serif Display', serif" }}>Warm Intro Generator</h1>
        </div>
        <p className="text-sm text-[#6B6966]">AI crafts a personalised, role-specific pitch for each referrer based on your proof-of-work data and their team stack.</p>
      </motion.div>

      <motion.div variants={row} className="space-y-3">
        {top3.map((r, idx) => {
          const intro = intros.find(i => i.id === r.id)
          return (
            <div key={r.id} className="border border-white/6 rounded-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Lock size={9} className="text-[#C8FF00]" />
                    <span className="text-[10px] text-[#C8FF00]">Anonymous</span>
                  </div>
                  <p className="text-[13px] font-medium text-[#E8E6E1]">{r.alias}</p>
                </div>
                <span className="text-sm font-bold text-[#C8FF00] shrink-0">{r.match}%</span>
              </div>
              <div className="px-5 py-4">
                {intro?.generated ? (
                  <div>
                    <p className="text-[12px] text-[#A09E9A] leading-relaxed border-l-2 border-[#C8FF00]/25 pl-3 mb-3 italic">
                      "{intro.preview}"
                    </p>
                    <div className="flex gap-2">
                      <button className="text-[11px] bg-[#C8FF00] text-[#0A0A0B] font-semibold px-3 py-1.5 rounded-sm hover:bg-[#D4FF26] transition-colors">
                        Use this intro
                      </button>
                      <button onClick={() => generate(r.id)} className="text-[11px] border border-white/8 text-[#6B6966] hover:text-[#A09E9A] px-3 py-1.5 rounded-sm transition-colors">
                        Regenerate
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => generate(r.id)}
                    disabled={generating === r.id}
                    className="flex items-center gap-2 text-[12px] text-[#C8FF00] border border-[#C8FF00]/20 bg-[#C8FF00]/5 hover:bg-[#C8FF00]/10 px-3 py-2 rounded-sm transition-colors disabled:opacity-60"
                  >
                    <Sparkles size={12} className={generating === r.id ? 'animate-pulse' : ''} />
                    {generating === r.id ? 'Generating...' : 'Generate warm intro'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: SKILL GAP NAVIGATOR
// ─────────────────────────────────────────────────────────────────────────────

function SkillGapPage() {
  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5 max-w-3xl">
      <motion.div variants={row}>
        <div className="flex items-center gap-2 mb-1">
          <Target size={15} className="text-[#C8FF00]" />
          <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: "'DM Serif Display', serif" }}>Skill Gap Navigator</h1>
        </div>
        <p className="text-sm text-[#6B6966]">See exactly which skills are suppressing your match score — and what to learn to close the gap for each target role.</p>
      </motion.div>

      <motion.div variants={row} className="space-y-4">
        {SKILL_GAPS.map((g, i) => (
          <div key={i} className="border border-white/6 rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-white/4 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-[#E8E6E1]">{g.role}</p>
                <p className="text-[11px] text-[#6B6966] mt-0.5">{g.company_tier} companies</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[12px] text-[#6B6966]">{g.your_match}%</span>
                  <ArrowUpRight size={11} className="text-[#C8FF00]" />
                  <span className="text-[13px] font-bold text-[#C8FF00]">{g.potential}%</span>
                </div>
                <p className="text-[10px] text-[#3D3B38] mt-0.5">current → potential</p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] text-[#6B6966] mb-2.5 flex items-center gap-1.5">
                <TriangleAlert size={10} className="text-amber-400" />
                Skills lowering your score:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {g.missing.map(skill => (
                  <span key={skill} className="text-[12px] bg-amber-400/8 border border-amber-400/20 text-amber-400 px-2.5 py-1 rounded-sm">{skill}</span>
                ))}
              </div>
              <p className="text-[11px] text-[#6B6966] mb-2">Suggested learning path:</p>
              <div className="space-y-1.5">
                {g.missing.map(skill => (
                  <div key={skill} className="flex items-center justify-between bg-white/2 border border-white/5 rounded-sm px-3 py-2">
                    <div className="flex items-center gap-2">
                      <BookOpen size={11} className="text-[#3D3B38]" />
                      <span className="text-[12px] text-[#A09E9A]">Learn {skill}</span>
                    </div>
                    <button className="text-[11px] text-[#C8FF00] hover:underline">View path →</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function CandidateDashboard({ navigate }) {
  const [activeTab, setActiveTab]     = useState('overview')
  const [tokens, setTokens]           = useState(3)
  const [referrers, setReferrers]     = useState(REFERRERS)
  const [modalReferrer, setModalRef]  = useState(null)

  const handleRequest = (referrer) => { if (tokens > 0) setModalRef(referrer) }
  const handleSend    = () => {
    setTokens(t => Math.max(0, t - 1))
    setReferrers(prev => prev.map(r => r.id === modalReferrer.id ? { ...r, requested: true } : r))
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'overview':    return <OverviewPage   setActiveTab={setActiveTab} tokens={tokens} referrers={referrers} onRequest={handleRequest} />
      case 'profile':     return <ProfilePage />
      case 'discover':    return <DiscoverPage   referrers={referrers} onRequest={handleRequest} />
      case 'requests':    return <RequestsPage />
      case 'ai-match':    return <AIMatchPage    referrers={referrers} />
      case 'warm-intro':  return <WarmIntroPage  referrers={referrers} />
      case 'skill-gap':   return <SkillGapPage />
      default:            return null
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#111]">
      <Sidebar active={activeTab} setActive={setActiveTab} navigate={navigate} tokens={tokens} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar activeTab={activeTab} tokens={tokens} />
        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {modalReferrer && (
          <RequestModal
            referrer={modalReferrer}
            tokens={tokens}
            onClose={() => setModalRef(null)}
            onSend={handleSend}
          />
        )}
      </AnimatePresence>
    </div>
  )
}