import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Search, Bell, LogOut, GitBranch, Code2,
  Zap, Lock, X, Send, Coins,
  CheckCircle, Clock, XCircle, Star, User,
  BrainCircuit, Target, BookOpen, Sparkles, ArrowUpRight,
  Eye, RefreshCw, MessageSquare, AlertCircle, TriangleAlert, ChevronDown,
  FileUp, Loader2, FileText, ChevronUp, Mic, ArrowRight, ChevronLeft,
  Shield
} from 'lucide-react'
import { fetchAPI, uploadResume } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import {
  subscribeCandidateProfile,
  subscribeAllEmployees,
  subscribeCandidateRequests,
  subscribeActivity,
  subscribeCandidateShadowInterviews,
  createReferralRequest,
  updateCandidateProfile,
} from '../firebase/firestore'
import { timeAgo } from '../firebase/utils'

// ─────────────────────────────────────────────────────────────────────────────
// STATIC / PRESENTATIONAL MOCK DATA (GitHub, LeetCode, Skill Gaps — not yet API-backed)
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

const SKILL_GAPS = [
  { role: 'Senior Frontend Eng', company_tier: 'Unicorn', missing: ['GraphQL', 'Kubernetes'], your_match: 74, potential: 91 },
  { role: 'Staff SWE', company_tier: 'FAANG+', missing: ['System Design', 'Distributed Systems'], your_match: 55, potential: 82 },
]

const WARM_INTROS_DEFAULT = [
  { id: 1, generated: true, preview: 'Hi — I noticed your team uses React and Node.js extensively. My recent work on a high-traffic fintech dashboard (TypeScript, 400+ commits this year) maps closely to what your stack requires. Would love to explore if there is a fit.' },
  { id: 2, generated: false, preview: null },
  { id: 3, generated: false, preview: null },
]

const statusConfig = {
  accepted: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Accepted' },
  pending:  { icon: Clock,       color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   label: 'Pending' },
  declined: { icon: XCircle,     color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/20',     label: 'Declined' },
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
  show:   { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } },
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────────────────────────────────────

function buildNavGroups(interviewBadge) {
  return [
    {
      label: 'Core',
      items: [
        { id: 'overview',  icon: LayoutDashboard, label: 'Overview' },
        { id: 'profile',   icon: User,            label: 'My Profile' },
        { id: 'discover',  icon: Search,          label: 'Discover Referrers' },
        { id: 'requests',  icon: Bell,            label: 'My Requests' },
      ],
    },
    {
      label: 'AI-Powered',
      items: [
        { id: 'shadow-interview', icon: Mic,            label: 'Shadow Interview', badge: interviewBadge || 0 },
        { id: 'ai-match',         icon: BrainCircuit,   label: 'AI Match Engine' },
        { id: 'warm-intro',       icon: MessageSquare,  label: 'Warm Intro Generator' },
        { id: 'skill-gap',        icon: Target,         label: 'Skill Gap Navigator' },
      ],
    },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({ active, setActive, navigate, tokens, profile, interviewBadge }) {
  const NAV_GROUPS = buildNavGroups(interviewBadge)
  const displayName  = profile?.name || 'User'
  const displayEmail = profile?.email || ''
  const initials     = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/18">
      <div className="px-5 py-5 border-b border-white/16">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#C8FF00]">RefHire</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-lime-100/10 border border-[#C8FF00]/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-[#C8FF00]">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#E8E6E1] truncate">{displayName}</p>
            <p className="text-[12px] text-[#999] truncate">{displayEmail}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-medium tracking-widest uppercase text-[#999] px-2 mb-1.5">--{group.label}--</p>
            <div className="space-y-0.5">
              {group.items.map(({ id, icon: Icon, label, badge }) => (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-sm transition-all cursor-pointer duration-150 ${
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

      <div className="px-3 py-4 border-t border-white/16 space-y-2">
        <div className="px-2.5 py-2.5 bg-white/2 border border-white/16 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Coins size={11} className="text-[#C8FF00]" />
              <span className="text-[12px] text-[#888]">Referral tokens</span>
            </div>
            <span className="text-[11px] font-semibold text-[#E8E6E1]">{tokens}/3</span>
          </div>
          <div className="flex gap-1 mb-1.5">
            {[0,1,2].map(i => (
              <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${i < tokens ? 'bg-[#C8FF00]' : 'bg-white/8'}`} />
            ))}
          </div>
          <p className="text-[11px] text-[#888]">Resets in 18 days</p>
        </div>
        <button
          onClick={() => navigate('landing')}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-[13px] cursor-pointer text-[#888] hover:text-[#aed259] transition-colors rounded-sm hover:bg-white/2"
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

function Topbar() {
  return <div />
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
  const [sending, setSending] = useState(false)

  const handleAIDraft = () => {
    setIsDrafting(true)
    setTimeout(() => {
      setPitch(`My recent work with scalable architectures perfectly matches the ${selectedReq} requirements. With my strong background in ${referrer.stack[0]} and ${referrer.stack[1]}, I can contribute immediately to your team. I would greatly appreciate a referral.`)
      setIsDrafting(false)
    }, 1200)
  }

  const handleSend = async () => {
    setSending(true)
    await onSend(referrer, selectedReq, pitch)
    setSending(false)
    onClose()
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
            onClick={handleSend}
            disabled={!pitch.trim() || tokens === 0 || sending}
            className="flex-1 flex items-center justify-center gap-2 bg-[#C8FF00] text-[#0A0A0B] font-semibold py-2.5 text-sm rounded-sm hover:bg-[#D4FF26] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-[#0A0A0B] border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Send size={13} /> Send request</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

function OverviewPage({ setActiveTab, tokens, referrers, requests, activity, onRequest, profile }) {
  const top3 = [...referrers].sort((a, b) => b.match - a.match).slice(0, 3)
  const pendingCount  = requests.filter(r => r.status === 'pending').length
  const acceptedCount = requests.filter(r => r.status === 'accepted').length

  const activityIcons = { view: Eye, match: Zap, accepted: CheckCircle, token: Coins }
  const activityColors = { view: 'text-[#6B6966]', match: 'text-[#C8FF00]', accepted: 'text-emerald-400', token: 'text-amber-400' }

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-6">

      <motion.div variants={row}>
        <h1 className="text-2xl font-bold text-[#E8E6E1] leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Good morning, {profile?.name?.split(' ')[0] || 'there'}.
        </h1>
        <p className="text-sm text-[#6B6966] mt-1">
          Your proof-of-work profile is live.{' '}
          <span className="text-[#C8FF00]">{referrers.length} referrers</span> currently match your stack.
        </p>
      </motion.div>

      <motion.div variants={row} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Matched referrers', value: String(referrers.length), trend: `Top matches available`, up: true },
          { label: 'Tokens remaining', value: String(tokens), trend: `${3 - tokens} used this cycle`, up: null },
          { label: 'Requests sent', value: String(requests.length), trend: `${acceptedCount} accepted`, up: acceptedCount > 0 },
          { label: 'Awaiting response', value: String(pendingCount), trend: pendingCount > 0 ? 'Check My Requests' : 'None pending', up: null },
        ].map(s => (
          <div key={s.label} className="bg-white/2 border border-white/5 rounded-sm px-4 py-3.5">
            <p className="text-[10px] text-[#fff] uppercase tracking-wider mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-[#E8E6E1] leading-none" style={{ fontFamily: 'var(--font-maininfo)' }}>{s.value}</p>
            <p className={`text-[12px] mt-1.5 ${s.up === true ? 'text-emerald-400' : 'text-[#888]'}`}>{s.trend}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <motion.div variants={row} className="lg:col-span-3 border border-white/6 rounded-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
            <div>
              <p className="text-[18px] font-semibold text-[#E8E6E1]">Top matched referrers</p>
              <p className="text-[12px] text-[#666] mt-0.5 leading-3.5">AI probability score · anonymous</p>
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
                    <p className={`text-base font-bold ${r.match >= 80 ? 'text-[#C8FF00]' : 'text-[#A09E9A]'}`} style={{ fontFamily: 'var(--font-maininfo)' }}>
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
            {top3.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-[#3D3B38]">No referrers found yet. Add skills to your profile to improve matches.</div>
            )}
          </div>
        </motion.div>

        <motion.div variants={row} className="lg:col-span-2 border border-white/6 rounded-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6">
            <p className="text-[18px] font-semibold text-[#E8E6E1]">Activity</p>
            <p className="text-[12px] text-[#888] mt-0.5">Platform events</p>
          </div>
          <div className="divide-y divide-white/4">
            {activity.slice(0, 5).map(a => {
              const IconComp = activityIcons[a.type] || Eye
              const colorCls = activityColors[a.type] || 'text-[#6B6966]'
              return (
                <div key={a.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-sm bg-white/4 flex items-center justify-center shrink-0 mt-0.5">
                    <IconComp size={11} className={colorCls} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#A09E9A] leading-snug">{a.text}</p>
                    <p className="text-[10px] text-[#3D3B38] mt-0.5">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              )
            })}
            {activity.length === 0 && (
              <div className="px-5 py-6 text-center text-[11px] text-[#3D3B38]">No activity yet.</div>
            )}
          </div>
        </motion.div>
      </div>

      {requests.length > 0 && (
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
            {requests.slice(0, 3).map(r => {
              const cfg = statusConfig[r.status] || statusConfig.pending
              return (
                <div key={r.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/1.5 transition-colors">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[11px] font-medium ${cfg.bg} ${cfg.color} border ${cfg.border} shrink-0`}>
                    <cfg.icon size={10} />{cfg.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#E8E6E1] truncate">{r.employeeAlias || 'Anonymous Referrer'}</p>
                    <p className="text-[11px] text-[#6B6966] truncate">{r.targetRole}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#C8FF00]">{r.match}%</p>
                    <p className="text-[10px] text-[#3D3B38]">{timeAgo(r.createdAt)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      <motion.div variants={row} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Complete your profile', sub: 'Add skills and bio', icon: GitBranch, action: 'profile' },
          { label: 'Run AI match scan', sub: 'Find your best matches', icon: BrainCircuit, action: 'ai-match' },
          { label: 'Fill skill gaps', sub: `${SKILL_GAPS.length} high-impact gaps found`, icon: Target, action: 'skill-gap' },
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

function ProfilePage({ profile, onUpdateProfile }) {
  const [newSkill, setNewSkill] = useState('')
  const [parsing, setParsing]   = useState(false)
  const [parsed, setParsed]     = useState(null)
  const [parseError, setParseError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const fileRef = useRef(null)

  const completionItems = [
    { label: 'Email verified', done: !!profile?.email },
    { label: 'GitHub connected', done: !!profile?.githubConnected },
    { label: 'LeetCode linked', done: !!profile?.leetcodeConnected },
    { label: 'Skills tagged', done: (profile?.skills?.length || 0) > 0 },
    { label: 'Bio added', done: !!profile?.bio },
  ]
  const done = completionItems.filter(i => i.done).length
  const pct = Math.round((done / completionItems.length) * 100)

  const addSkill = () => {
    if (!newSkill.trim()) return
    const updated = [...(profile?.skills || []), newSkill.trim()]
    onUpdateProfile({ skills: updated })
    setNewSkill('')
  }

  const handleFile = async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setParseError('Please upload a PDF file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseError('File too large. Max 10 MB.')
      return
    }

    setParseError('')
    setParsed(null)
    setParsing(true)
    setShowPreview(true)

    try {
      const result = await uploadResume(file)
      setParsed(result)
    } catch (err) {
      setParseError(err.message || 'Failed to parse resume.')
    } finally {
      setParsing(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  const applyParsed = () => {
    if (!parsed) return
    const update = {}
    if (parsed.name)            update.name            = parsed.name
    if (parsed.currentRole)     update.currentRole     = parsed.currentRole
    if (parsed.yearsExperience) update.yearsExperience = parsed.yearsExperience
    if (parsed.location)        update.location        = parsed.location
    if (parsed.lookingFor)      update.lookingFor      = parsed.lookingFor
    if (parsed.bio)             update.bio             = parsed.bio
    if (parsed.skills?.length)  update.skills          = parsed.skills

    onUpdateProfile(update)
    setParsed(null)
  }

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5 max-w-3xl">
      <motion.div variants={row}>
        <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: 'var(--font-heading)' }}>My Profile</h1>
        <p className="text-sm text-[#6B6966] mt-0.5">Your proof-of-work identity visible to referrers after mutual opt-in.</p>
      </motion.div>

      {/* ── Resume Upload Agent ─────────────────────────────────── */}
      <motion.div variants={row} className="border border-[#C8FF00]/20 bg-[#C8FF00]/[0.03] rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#C8FF00]/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C8FF00]/10 border border-[#C8FF00]/25 rounded-sm flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-[#C8FF00]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[#E8E6E1]">Resume Agent</p>
            <p className="text-[11px] text-[#6B6966]">Upload your resume and we'll auto-fill your entire profile — name, skills, experience, everything.</p>
          </div>
        </div>

        <div className="p-5">
          {/* Drop zone */}
          {!parsing && !parsed && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-[#C8FF00]/60 bg-[#C8FF00]/[0.06]'
                  : 'border-white/10 hover:border-[#C8FF00]/30 hover:bg-[#C8FF00]/[0.02]'
              }`}
            >
              <div className={`w-10 h-10 rounded-sm flex items-center justify-center transition-colors ${dragOver ? 'bg-[#C8FF00]/15' : 'bg-white/4'}`}>
                <FileUp size={18} className={dragOver ? 'text-[#C8FF00]' : 'text-[#6B6966]'} />
              </div>
              <div className="text-center">
                <p className="text-[13px] text-[#E8E6E1] font-medium">
                  {dragOver ? 'Drop your resume here' : 'Drag & drop your resume PDF'}
                </p>
                <p className="text-[11px] text-[#3D3B38] mt-0.5">or click to browse · PDF only · max 10 MB</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0])}
              />
            </div>
          )}

          {/* Parsing animation */}
          {parsing && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <div className="w-12 h-12 rounded-sm bg-[#C8FF00]/10 border border-[#C8FF00]/25 flex items-center justify-center">
                  <Loader2 size={20} className="text-[#C8FF00] animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[13px] text-[#E8E6E1] font-medium">Parsing your resume...</p>
                <p className="text-[11px] text-[#6B6966] mt-1">Extracting skills, experience, and profile data</p>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {parseError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3">
              <AlertCircle size={13} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-400 flex-1">{parseError}</span>
              <button onClick={() => { setParseError(''); setParsed(null) }} className="text-[11px] text-red-400 hover:text-red-300 underline shrink-0">
                Try again
              </button>
            </div>
          )}

          {/* Parsed preview */}
          {parsed && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <p className="text-[13px] font-semibold text-[#E8E6E1]">Resume parsed successfully</p>
                </div>
                <button onClick={() => setShowPreview(p => !p)} className="text-[#6B6966] hover:text-[#A09E9A] transition-colors">
                  <ChevronUp size={14} className={`transition-transform ${showPreview ? '' : 'rotate-180'}`} />
                </button>
              </div>
              <p className="text-[11px] text-[#6B6966]">
                Extracted from {parsed.rawLineCount} lines · found sections: {parsed.sectionsFound.length > 0 ? parsed.sectionsFound.join(', ') : 'header only'}
              </p>

              <AnimatePresence>
                {showPreview && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">

                    {/* Extracted fields */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Name', parsed.name],
                        ['Role', parsed.currentRole],
                        ['Experience', parsed.yearsExperience ? `${parsed.yearsExperience} years` : ''],
                        ['Location', parsed.location],
                        ['Domain fit', parsed.lookingFor],
                        ['Email', parsed.email],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label} className="bg-white/3 border border-white/6 rounded-sm px-3 py-2">
                          <p className="text-[9px] text-[#3D3B38] uppercase tracking-wider mb-0.5">{label}</p>
                          <p className="text-[12px] text-[#E8E6E1] truncate">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Extracted skills */}
                    {parsed.skills?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-[#3D3B38] uppercase tracking-wider mb-2">Skills detected ({parsed.skills.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {parsed.skills.map(s => (
                            <span key={s} className="text-[11px] bg-[#C8FF00]/8 border border-[#C8FF00]/20 text-[#C8FF00] px-2 py-0.5 rounded-sm">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    {parsed.bio && (
                      <div>
                        <p className="text-[10px] text-[#3D3B38] uppercase tracking-wider mb-1">Summary</p>
                        <p className="text-[12px] text-[#A09E9A] leading-relaxed border-l-2 border-[#C8FF00]/20 pl-3">{parsed.bio}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setParsed(null); setParseError('') }}
                  className="flex-1 border border-white/8 text-[#6B6966] hover:text-[#A09E9A] py-2.5 text-[12px] rounded-sm transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={applyParsed}
                  className="flex-2 flex items-center justify-center gap-2 bg-[#C8FF00] text-[#0A0A0B] font-semibold py-2.5 text-[12px] rounded-sm hover:bg-[#D4FF26] transition-colors"
                >
                  <FileText size={13} />
                  Apply to profile
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Profile Completeness ─────────────────────────────── */}
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
            ['Full name', profile?.name || '—'],
            ['Email', profile?.email || '—'],
            ['Current role', profile?.currentRole || '—'],
            ['Years experience', profile?.yearsExperience ? `${profile.yearsExperience} years` : '—'],
            ['Location', profile?.location || '—'],
            ['Looking for', profile?.lookingFor || '—'],
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
          {(profile?.skills || []).map(s => (
            <span key={s} className="text-[12px] bg-white/4 border border-white/6 text-[#A09E9A] px-2.5 py-1 rounded-sm">{s}</span>
          ))}
          <div className="flex items-center gap-1">
            <input
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSkill()}
              placeholder="+ Add skill"
              className="text-[12px] border border-dashed border-white/10 text-[#6B6966] hover:text-[#6B6966] hover:border-white/20 px-2.5 py-1 rounded-sm bg-transparent focus:outline-none focus:border-[#C8FF00]/40 w-24"
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={row} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { icon: GitBranch, title: 'Connect GitHub', sub: 'Generates commit heatmap and language breakdown.' },
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
        <SH title="GitHub commit activity" sub="Requires GitHub connection" />
        <div className={profile?.githubConnected ? '' : 'opacity-40 pointer-events-none'}>
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
        {!profile?.githubConnected && (
          <p className="text-[11px] text-[#3D3B38] mt-3">Connect GitHub above to unlock this section.</p>
        )}
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
    (r.company_tier || '').toLowerCase().includes(filter.toLowerCase()) ||
    (r.activeReqs && r.activeReqs.some(req => req.toLowerCase().includes(filter.toLowerCase())))
  )

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={row}>
        <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: 'var(--font-heading)' }}>Discover Referrers</h1>
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
                  <p className={`text-base font-bold ${r.match>=80?'text-[#C8FF00]':r.match>=65?'text-amber-400':'text-[#6B6966]'}`} style={{ fontFamily: 'var(--font-maininfo)' }}>
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

function RequestsPage({ requests }) {
  const accepted = requests.filter(r => r.status === 'accepted').length
  const pending  = requests.filter(r => r.status === 'pending').length
  const declined = requests.filter(r => r.status === 'declined').length

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={row}>
        <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: 'var(--font-heading)' }}>My Requests</h1>
        <p className="text-sm text-[#6B6966] mt-0.5">Full pipeline — from request sent to hire.</p>
      </motion.div>

      <motion.div variants={row} className="flex items-center gap-2 flex-wrap">
        {[
          { label: `${accepted} Accepted`, color: 'text-emerald-400', bg: 'bg-emerald-400/8 border-emerald-400/20' },
          { label: `${pending} Pending`,   color: 'text-amber-400',   bg: 'bg-amber-400/8 border-amber-400/20' },
          { label: `${declined} Declined`, color: 'text-[#6B6966]',   bg: 'bg-white/[0.04] border-white/[0.08]' },
        ].map(c => (
          <span key={c.label} className={`text-[11px] font-medium px-2.5 py-1 rounded-sm border ${c.bg} ${c.color}`}>{c.label}</span>
        ))}
      </motion.div>

      <motion.div variants={row} className="border border-white/6 rounded-sm overflow-hidden">
        <div className="divide-y divide-white/4">
          {requests.map(r => {
            const cfg = statusConfig[r.status] || statusConfig.pending
            return (
              <div key={r.id} className="px-5 py-4 hover:bg-white/1.5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <cfg.icon size={13} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold text-[#E8E6E1]">{r.employeeAlias || 'Anonymous Referrer'}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
                    </div>
                    <p className="text-[11px] text-[#6B6966]">{r.targetRole}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#C8FF00]">{r.match}%</p>
                    <p className="text-[10px] text-[#3D3B38]">{timeAgo(r.createdAt)}</p>
                  </div>
                </div>
              </div>
            )
          })}
          {requests.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-[#3D3B38]">No requests yet. Discover referrers and send your first request.</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: AI MATCH ENGINE
// ─────────────────────────────────────────────────────────────────────────────

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
        <span className="text-base font-bold" style={{ color, fontFamily: 'var(--font-maininfo)' }}>{score}</span>
      </div>
    </div>
  )
}

function BreakdownBar({ label, score, weight, delay = 0 }) {
  const barColor = score >= 70 ? '#C8FF00' : score >= 45 ? '#fbbf24' : '#6B6966'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span className="text-[#A09E9A]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[#3D3B38]">{Math.round(weight * 100)}%</span>
          <span className="font-semibold text-[#E8E6E1] w-6 text-right">{score}</span>
        </div>
      </div>
      <div className="h-1 bg-white/6 rounded-full overflow-hidden">
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

function AIMatchPage({ recommendations, profile, onRequest, tokens }) {
  const [expanded, setExpanded] = useState(null)
  const [running, setRunning] = useState(false)
  const [filter, setFilter] = useState('all')

  const runScan = () => { setRunning(true); setTimeout(() => setRunning(false), 1500) }

  const topRec = recommendations[0]
  const perfectCount = recommendations.filter(r => r.aiScore >= 85).length
  const strongCount = recommendations.filter(r => r.aiScore >= 70 && r.aiScore < 85).length
  const avgScore = recommendations.length > 0
    ? Math.round(recommendations.reduce((sum, r) => sum + r.aiScore, 0) / recommendations.length)
    : 0

  const filtered = filter === 'all'
    ? recommendations
    : filter === 'perfect' ? recommendations.filter(r => r.aiScore >= 85)
    : filter === 'strong'  ? recommendations.filter(r => r.aiScore >= 70 && r.aiScore < 85)
    : filter === 'good'    ? recommendations.filter(r => r.aiScore >= 50 && r.aiScore < 70)
    : recommendations.filter(r => r.aiScore < 50)

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={row}>
        <div className="flex items-center gap-2 mb-1">
          <BrainCircuit size={15} className="text-[#C8FF00]" />
          <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: 'var(--font-heading)' }}>AI Match Engine</h1>
        </div>
        <p className="text-sm text-[#6B6966]">
          Multi-factor scoring: skill overlap (40%), role/domain fit (20%), experience alignment (15%), referrer credibility (15%), activity signal (10%).
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={row} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Perfect matches', value: String(perfectCount), sub: 'Score 85+', color: 'text-[#C8FF00]' },
          { label: 'Strong matches', value: String(strongCount), sub: 'Score 70–84', color: 'text-emerald-400' },
          { label: 'Avg. AI score', value: String(avgScore), sub: 'Across all referrers', color: 'text-amber-400' },
          { label: 'Total analyzed', value: String(recommendations.length), sub: 'Referrers scanned', color: 'text-[#A09E9A]' },
        ].map(s => (
          <div key={s.label} className="bg-white/2 border border-white/5 rounded-sm px-4 py-3.5">
            <p className="text-[10px] text-[#6B6966] uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-2xl font-bold leading-none ${s.color}`} style={{ fontFamily: 'var(--font-maininfo)' }}>{s.value}</p>
            <p className="text-[11px] text-[#3D3B38] mt-1.5">{s.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Top match deep-dive */}
      {topRec && (
        <motion.div variants={row} className="border border-[#C8FF00]/20 bg-[#C8FF00]/[0.02] rounded-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#C8FF00]/10 flex items-center gap-4">
            <ScoreRing score={topRec.aiScore} color={topRec.tier.color} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm border" style={{ color: topRec.tier.color, borderColor: `${topRec.tier.color}33`, backgroundColor: `${topRec.tier.color}0d` }}>
                  {topRec.tier.label}
                </span>
                <Lock size={9} className="text-[#C8FF00]" />
                <span className="text-[10px] text-[#C8FF00]">Anonymous</span>
              </div>
              <p className="text-[15px] font-semibold text-[#E8E6E1]">{topRec.alias}</p>
              <p className="text-[11px] text-[#6B6966] mt-0.5">Your #1 recommendation — here's why</p>
            </div>
            <button
              onClick={() => onRequest(topRec)}
              disabled={topRec.requested || tokens === 0}
              className={`shrink-0 text-[12px] font-semibold px-4 py-2 rounded-sm transition-all duration-200 ${
                topRec.requested
                  ? 'bg-emerald-400/10 text-emerald-400 cursor-default'
                  : 'bg-[#C8FF00] text-[#0A0A0B] hover:bg-[#D4FF26]'
              }`}
            >
              {topRec.requested ? 'Sent' : 'Request Referral'}
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-3">
              <BreakdownBar label="Skill Match" score={topRec.breakdown.skill.score} weight={topRec.breakdown.skill.weight} delay={0.1} />
              <BreakdownBar label="Domain / Role Fit" score={topRec.breakdown.domain.score} weight={topRec.breakdown.domain.weight} delay={0.2} />
              <BreakdownBar label="Experience Alignment" score={topRec.breakdown.experience.score} weight={topRec.breakdown.experience.weight} delay={0.3} />
              <BreakdownBar label="Referrer Credibility" score={topRec.breakdown.credibility.score} weight={topRec.breakdown.credibility.weight} delay={0.4} />
              <BreakdownBar label="Activity Signal" score={topRec.breakdown.activity.score} weight={topRec.breakdown.activity.weight} delay={0.5} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {topRec.matchedSkills.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#3D3B38] uppercase tracking-wider mb-2">Matching Skills ({topRec.matchedSkills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topRec.matchedSkills.map(s => (
                      <span key={s} className="text-[10px] bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] px-2 py-0.5 rounded-sm">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {topRec.missingSkills.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#3D3B38] uppercase tracking-wider mb-2">Skills to Add ({topRec.missingSkills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topRec.missingSkills.map(s => (
                      <span key={s} className="text-[10px] bg-amber-400/8 border border-amber-400/20 text-amber-400 px-2 py-0.5 rounded-sm">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {topRec.breakdown.domain.insight && (
              <p className="text-[11px] text-[#6B6966] border-l-2 border-[#C8FF00]/20 pl-3">
                {topRec.breakdown.domain.insight}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Filter + list */}
      <motion.div variants={row} className="border border-white/6 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[13px] font-semibold text-[#E8E6E1]">All Recommendations</p>
            <p className="text-[11px] text-[#6B6966] mt-0.5">Click any row for AI score breakdown</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'perfect', label: '85+' },
              { id: 'strong', label: '70+' },
              { id: 'good', label: '50+' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-[11px] px-2.5 py-1 rounded-sm border transition-colors ${
                  filter === f.id
                    ? 'bg-[#C8FF00]/10 border-[#C8FF00]/25 text-[#C8FF00]'
                    : 'border-white/8 text-[#6B6966] hover:text-[#A09E9A]'
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={runScan}
              disabled={running}
              className="flex items-center gap-1.5 text-[11px] border border-white/8 text-[#6B6966] hover:text-[#E8E6E1] hover:border-white/20 px-2.5 py-1 rounded-sm transition-colors disabled:opacity-50 ml-1"
            >
              <RefreshCw size={10} className={running ? 'animate-spin' : ''} />
              {running ? 'Scanning...' : 'Re-scan'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/4">
          {filtered.map((rec, i) => (
            <div key={rec.id}>
              <div
                onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
                className="px-5 py-4 flex items-center gap-4 hover:bg-white/[0.015] transition-colors cursor-pointer"
              >
                <span className="text-[11px] text-[#3D3B38] w-5 shrink-0 font-medium">#{i+1}</span>
                <ScoreRing score={rec.aiScore} size={42} strokeWidth={3} color={rec.tier.color} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={9} className="text-[#C8FF00]" />
                    <p className="text-[13px] font-medium text-[#E8E6E1] truncate">{rec.alias}</p>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-sm border shrink-0" style={{ color: rec.tier.color, borderColor: `${rec.tier.color}33`, backgroundColor: `${rec.tier.color}0d` }}>
                      {rec.tier.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.stack.slice(0, 4).map(s => (
                      <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                        rec.matchedSkills.includes(s.toLowerCase().replace(/[\s.]+/g, ' '))
                          ? 'bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00]'
                          : 'bg-white/4 border border-white/5 text-[#6B6966]'
                      }`}>{s}</span>
                    ))}
                    {rec.companyTier && (
                      <span className="text-[10px] bg-[#C8FF00]/5 border border-[#C8FF00]/15 text-[#C8FF00] px-1.5 py-0.5 rounded-sm">{rec.companyTier}</span>
                    )}
                  </div>
                  {rec.activeReqs.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Target size={10} className="text-[#C8FF00]" />
                      <span className="text-[10px] text-[#A09E9A] truncate">Hiring: {rec.activeReqs.join(', ')}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-1 text-[10px] text-[#6B6966]">
                    <Star size={9} className="text-amber-400" />
                    {rec.reputation}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onRequest(rec) }}
                    disabled={rec.requested || tokens === 0}
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-sm transition-all duration-200 ${
                      rec.requested
                        ? 'bg-emerald-400/10 text-emerald-400 cursor-default'
                        : 'bg-[#C8FF00]/8 border border-[#C8FF00]/20 text-[#C8FF00] hover:bg-[#C8FF00] hover:text-[#0A0A0B]'
                    }`}
                  >
                    {rec.requested ? 'Sent' : 'Request'}
                  </button>
                  <ChevronDown size={13} className={`text-[#3D3B38] transition-transform ${expanded === rec.id ? 'rotate-180' : ''}`} />
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
                    <div className="px-5 pb-5 pt-1 ml-10 border-l border-white/6 space-y-3">
                      <p className="text-[10px] text-[#3D3B38] uppercase tracking-wider">AI Score Breakdown</p>
                      <div className="space-y-2.5">
                        <BreakdownBar label="Skill Match" score={rec.breakdown.skill.score} weight={rec.breakdown.skill.weight} delay={0} />
                        <BreakdownBar label="Domain / Role Fit" score={rec.breakdown.domain.score} weight={rec.breakdown.domain.weight} delay={0.05} />
                        <BreakdownBar label="Experience Alignment" score={rec.breakdown.experience.score} weight={rec.breakdown.experience.weight} delay={0.1} />
                        <BreakdownBar label="Referrer Credibility" score={rec.breakdown.credibility.score} weight={rec.breakdown.credibility.weight} delay={0.15} />
                        <BreakdownBar label="Activity Signal" score={rec.breakdown.activity.score} weight={rec.breakdown.activity.weight} delay={0.2} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {rec.matchedSkills.length > 0 && (
                          <div>
                            <p className="text-[10px] text-[#3D3B38] uppercase tracking-wider mb-1.5">Matching Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {rec.matchedSkills.map(s => (
                                <span key={s} className="text-[10px] bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] px-1.5 py-0.5 rounded-sm">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {rec.missingSkills.length > 0 && (
                          <div>
                            <p className="text-[10px] text-[#3D3B38] uppercase tracking-wider mb-1.5">Gap Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {rec.missingSkills.map(s => (
                                <span key={s} className="text-[10px] bg-amber-400/8 border border-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded-sm">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-[#6B6966] pt-1">
                        {rec.breakdown.domain.insight && <span>{rec.breakdown.domain.insight}</span>}
                        {rec.breakdown.experience.insight && <span>{rec.breakdown.experience.insight}</span>}
                        {rec.breakdown.credibility.tier && <span>{rec.breakdown.credibility.tier} · {rec.totalRefs} referrals</span>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-[#3D3B38]">
              {recommendations.length === 0
                ? 'Add skills to your profile to see AI recommendations.'
                : 'No matches in this tier. Try a different filter.'}
            </div>
          )}
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
  const [intros, setIntros] = useState(WARM_INTROS_DEFAULT)
  const top3 = referrers.slice(0, 3)

  const generate = (idx) => {
    const r = top3[idx]
    if (!r) return
    setGenerating(idx)
    setTimeout(() => {
      setIntros(prev => prev.map((intro, i) =>
        i === idx
          ? { ...intro, generated: true, preview: `Based on your team's ${r.stack.slice(0,2).join(' and ')} stack, I believe there's a strong overlap with my recent work. My ${r.match}% match score reflects that alignment. Would love to explore further if the timing is right.` }
          : intro
      ))
      setGenerating(null)
    }, 1600)
  }

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5 max-w-3xl">
      <motion.div variants={row}>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare size={15} className="text-[#C8FF00]" />
          <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: 'var(--font-heading)' }}>Warm Intro Generator</h1>
        </div>
        <p className="text-sm text-[#6B6966]">AI crafts a personalised, role-specific pitch for each referrer based on your proof-of-work data and their team stack.</p>
      </motion.div>

      <motion.div variants={row} className="space-y-3">
        {top3.map((r, idx) => {
          const intro = intros[idx]
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
                      <button onClick={() => generate(idx)} className="text-[11px] border border-white/8 text-[#6B6966] hover:text-[#A09E9A] px-3 py-1.5 rounded-sm transition-colors">
                        Regenerate
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => generate(idx)}
                    disabled={generating === idx}
                    className="flex items-center gap-2 text-[12px] text-[#C8FF00] border border-[#C8FF00]/20 bg-[#C8FF00]/5 hover:bg-[#C8FF00]/10 px-3 py-2 rounded-sm transition-colors disabled:opacity-60"
                  >
                    <Sparkles size={12} className={generating === idx ? 'animate-pulse' : ''} />
                    {generating === idx ? 'Generating...' : 'Generate warm intro'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {top3.length === 0 && (
          <div className="text-center text-sm text-[#3D3B38] py-10">No referrers found. Add skills to your profile first.</div>
        )}
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
          <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: 'var(--font-heading)' }}>Skill Gap Navigator</h1>
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
// PAGE: SHADOW INTERVIEW
// ─────────────────────────────────────────────────────────────────────────────

function ShadowInterviewPage({ interviews, onComplete }) {
  const [activeInterview, setActiveInterview] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [evaluating, setEvaluating] = useState(false)

  const pending = interviews.filter(i => i.status === 'generated')
  const completed = interviews.filter(i => i.status === 'evaluated')

  const startInterview = (interview) => {
    setActiveInterview(interview)
    setCurrentQ(0)
    setAnswers(new Array(interview.questions.length).fill(''))
  }

  const updateAnswer = (idx, value) => {
    setAnswers(prev => { const a = [...prev]; a[idx] = value; return a })
  }

  const handleSubmit = async () => {
    if (!activeInterview) return
    setSubmitting(true)
    try {
      setEvaluating(true)
      await fetchAPI('/shadow-interview/submit', {
        interviewId: activeInterview.id,
        answers,
      })

      setEvaluating(false)
      setSubmitting(false)
      setActiveInterview(null)
      setAnswers([])
      setCurrentQ(0)
      if (onComplete) onComplete()
    } catch (err) {
      console.error('Interview submit failed:', err)
      setSubmitting(false)
      setEvaluating(false)
    }
  }

  if (activeInterview) {
    const questions = activeInterview.questions
    const q = questions[currentQ]
    const progress = ((currentQ + 1) / questions.length) * 100
    const canNext = answers[currentQ]?.trim().length > 10
    const isLast = currentQ === questions.length - 1

    return (
      <motion.div variants={page} initial="hidden" animate="show" className="space-y-5 max-w-3xl">
        {/* Header */}
        <motion.div variants={row} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mic size={15} className="text-purple-400" />
              <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: 'var(--font-heading)' }}>Shadow Interview</h1>
            </div>
            <p className="text-sm text-[#6B6966]">For: {activeInterview.targetRole}</p>
          </div>
          <button onClick={() => { setActiveInterview(null); setCurrentQ(0); setAnswers([]) }}
            className="text-[11px] border border-white/8 text-[#6B6966] hover:text-[#A09E9A] px-3 py-1.5 rounded-sm transition-colors">
            Exit
          </button>
        </motion.div>

        {/* Progress */}
        <motion.div variants={row}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#6B6966]">Question {currentQ + 1} of {questions.length}</span>
            <span className="text-[11px] font-medium" style={{ color: q.type === 'behavioral' ? '#A855F7' : '#C8FF00' }}>
              {q.type === 'behavioral' ? 'Behavioral' : `Technical · ${q.domain}`}
            </span>
          </div>
          <div className="h-1 bg-white/6 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full" style={{ background: q.type === 'behavioral' ? '#A855F7' : '#C8FF00' }} />
          </div>
        </motion.div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
            className="border rounded-sm overflow-hidden"
            style={{ borderColor: q.type === 'behavioral' ? 'rgba(168,85,247,0.2)' : 'rgba(200,255,0,0.15)' }}
          >
            <div className="px-5 py-4" style={{ background: q.type === 'behavioral' ? 'rgba(168,85,247,0.04)' : 'rgba(200,255,0,0.02)', borderBottom: `1px solid ${q.type === 'behavioral' ? 'rgba(168,85,247,0.12)' : 'rgba(200,255,0,0.1)'}` }}>
              <p className="text-[14px] font-medium text-[#E8E6E1] leading-relaxed">{q.text}</p>
            </div>
            <div className="p-5">
              <textarea
                rows={6}
                value={answers[currentQ] || ''}
                onChange={e => updateAnswer(currentQ, e.target.value)}
                placeholder="Type your answer here. Be specific — mention real examples, tools, and outcomes."
                className="w-full bg-white/3 border border-white/8 text-sm text-[#E8E6E1] placeholder-[#3D3B38] px-4 py-3 rounded-sm focus:outline-none focus:border-[#C8FF00]/40 transition-colors resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <span className={`text-[10px] ${(answers[currentQ]?.split(/\s+/).filter(Boolean).length || 0) < 15 ? 'text-[#3D3B38]' : 'text-[#6B6966]'}`}>
                  {answers[currentQ]?.split(/\s+/).filter(Boolean).length || 0} words
                  {(answers[currentQ]?.split(/\s+/).filter(Boolean).length || 0) < 15 && ' · aim for 30+ words'}
                </span>
                <div className="flex gap-2">
                  {currentQ > 0 && (
                    <button onClick={() => setCurrentQ(c => c - 1)}
                      className="flex items-center gap-1 text-[12px] border border-white/8 text-[#6B6966] hover:text-[#A09E9A] px-3 py-2 rounded-sm transition-colors">
                      <ChevronLeft size={12} /> Back
                    </button>
                  )}
                  {isLast ? (
                    <button onClick={handleSubmit} disabled={!canNext || submitting}
                      className="flex items-center gap-2 text-[12px] font-semibold bg-[#C8FF00] text-[#0A0A0B] px-4 py-2 rounded-sm hover:bg-[#D4FF26] transition-colors disabled:opacity-40">
                      {submitting ? (
                        evaluating ? <><Loader2 size={12} className="animate-spin" /> Evaluating...</>
                          : <><Loader2 size={12} className="animate-spin" /> Submitting...</>
                      ) : (
                        <><Send size={12} /> Submit Interview</>
                      )}
                    </button>
                  ) : (
                    <button onClick={() => setCurrentQ(c => c + 1)} disabled={!canNext}
                      className="flex items-center gap-1 text-[12px] font-medium bg-[#C8FF00]/10 border border-[#C8FF00]/25 text-[#C8FF00] px-4 py-2 rounded-sm hover:bg-[#C8FF00]/20 transition-colors disabled:opacity-40">
                      Next <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Question dots */}
        <motion.div variants={row} className="flex items-center justify-center gap-2">
          {questions.map((q, i) => (
            <button key={i} onClick={() => setCurrentQ(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentQ ? 'scale-125' : ''
              }`}
              style={{
                background: i === currentQ
                  ? (q.type === 'behavioral' ? '#A855F7' : '#C8FF00')
                  : answers[i]?.trim() ? 'rgba(200,255,0,0.3)' : 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={page} initial="hidden" animate="show" className="space-y-5 max-w-3xl">
      <motion.div variants={row}>
        <div className="flex items-center gap-2 mb-1">
          <Mic size={15} className="text-purple-400" />
          <h1 className="text-xl font-bold text-[#E8E6E1]" style={{ fontFamily: 'var(--font-heading)' }}>Shadow Interview</h1>
        </div>
        <p className="text-sm text-[#6B6966]">AI-generated technical interviews requested by referrers. Complete them to strengthen your referral.</p>
      </motion.div>

      {/* Pending interviews */}
      {pending.length > 0 && (
        <motion.div variants={row}>
          <p className="text-[10px] uppercase tracking-widest text-purple-400 mb-2">Pending ({pending.length})</p>
          <div className="space-y-2.5">
            {pending.map(interview => (
              <div key={interview.id} className="border border-purple-500/20 bg-purple-500/[0.03] rounded-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={12} className="text-purple-400" />
                      <p className="text-[13px] font-semibold text-[#E8E6E1]">{interview.targetRole}</p>
                    </div>
                    <p className="text-[11px] text-[#6B6966] mb-2">{interview.questions?.length || 0} questions · ~10 min</p>
                    <p className="text-[11px] text-[#6B6966]">{timeAgo(interview.createdAt)}</p>
                  </div>
                  <button onClick={() => startInterview(interview)}
                    className="flex items-center gap-2 text-[12px] font-semibold bg-purple-500/10 border border-purple-500/25 text-purple-400 px-4 py-2 rounded-sm hover:bg-purple-500/20 transition-colors">
                    <Mic size={12} /> Start Interview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Completed interviews */}
      {completed.length > 0 && (
        <motion.div variants={row}>
          <p className="text-[10px] uppercase tracking-widest text-[#6B6966] mb-2">Completed ({completed.length})</p>
          <div className="space-y-2.5">
            {completed.map(interview => {
              const s = interview.scores
              const recColors = { strong_yes: '#C8FF00', yes: '#10B981', maybe: '#F59E0B', no: '#EF4444' }
              return (
                <div key={interview.id} className="border border-white/6 rounded-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle size={12} className="text-emerald-400" />
                        <p className="text-[13px] font-semibold text-[#E8E6E1]">{interview.targetRole}</p>
                        {s && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm" style={{
                            color: recColors[s.recommendation] || '#6B6966',
                            background: `${recColors[s.recommendation]}15`,
                            border: `1px solid ${recColors[s.recommendation]}33`,
                          }}>
                            {s.recLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B6966]">{timeAgo(interview.createdAt)}</p>
                    </div>
                    {s && (
                      <div className="flex items-center gap-3 shrink-0">
                        {[
                          { label: 'Tech', value: s.technicalScore },
                          { label: 'Comm', value: s.communicationScore },
                          { label: 'Conf', value: s.confidenceScore },
                        ].map(m => (
                          <div key={m.label} className="text-center">
                            <p className={`text-sm font-bold ${m.value >= 70 ? 'text-[#C8FF00]' : m.value >= 45 ? 'text-amber-400' : 'text-[#6B6966]'}`} style={{ fontFamily: 'var(--font-maininfo)' }}>
                              {m.value}
                            </p>
                            <p className="text-[9px] text-[#3D3B38]">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {s?.aiSummary && (
                    <p className="text-[11px] text-[#6B6966] mt-3 border-l-2 border-purple-500/20 pl-3">{s.aiSummary}</p>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {pending.length === 0 && completed.length === 0 && (
        <motion.div variants={row} className="border border-white/6 rounded-sm p-10 text-center">
          <Mic size={24} className="mx-auto mb-3 text-[#3D3B38]" />
          <p className="text-sm font-medium text-[#E8E6E1] mb-1">No interviews yet</p>
          <p className="text-[11px] text-[#3D3B38]">When a referrer requests a Shadow Interview, it will appear here.</p>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function CandidateDashboard({ navigate }) {
  const { user }                      = useAuth()
  const [activeTab, setActiveTab]         = useState('overview')
  const [profile, setProfile]             = useState(null)
  const [employees, setEmployees]         = useState([])
  const [requests, setRequests]           = useState([])
  const [activity, setActivity]           = useState([])
  const [shadowInterviews, setShadowInterviews] = useState([])
  const [modalReferrer, setModalRef]      = useState(null)
  const [dataReady, setDataReady]         = useState(false)

  useEffect(() => {
    if (!user) return
    const unsubs = []
    let loaded = { profile: false, employees: false, requests: false, activity: false, interviews: false }
    const checkReady = () => {
      if (Object.values(loaded).every(Boolean)) setDataReady(true)
    }

    unsubs.push(subscribeCandidateProfile(user.uid, (p) => {
      setProfile(p)
      loaded.profile = true
      checkReady()
    }))

    unsubs.push(subscribeAllEmployees((emps) => {
      setEmployees(emps)
      loaded.employees = true
      checkReady()
    }))

    unsubs.push(subscribeCandidateRequests(user.uid, (reqs) => {
      setRequests(reqs)
      loaded.requests = true
      checkReady()
    }))

    unsubs.push(subscribeActivity(user.uid, (acts) => {
      setActivity(acts)
      loaded.activity = true
      checkReady()
    }))

    unsubs.push(subscribeCandidateShadowInterviews(user.uid, (ints) => {
      setShadowInterviews(ints)
      loaded.interviews = true
      checkReady()
    }))

    return () => unsubs.forEach(u => u())
  }, [user])

  const [recommendations, setRecommendations] = useState([])

  useEffect(() => {
    if (!user || !profile) return
    let cancelled = false
    fetchAPI('/recommendations/candidate', { candidateId: user.uid })
      .then(recs => { if (!cancelled) setRecommendations(recs) })
      .catch(err => console.error('Failed to fetch recommendations:', err))
    return () => { cancelled = true }
  }, [user, profile, employees])

  const tokens = profile?.tokens ?? 3

  const requestedEmployeeIds = new Set(requests.map(r => r.employeeId))

  const referrers = recommendations.map(rec => ({
    id:           rec.id,
    alias:        rec.alias,
    stack:        rec.stack,
    activeReqs:   rec.activeReqs,
    company_tier: rec.companyTier,
    match:        rec.aiScore,
    reputation:   rec.reputation,
    refs:         rec.totalRefs,
    requested:    rec.requested,
  }))

  const enrichedRequests = requests.map(req => {
    const emp = employees.find(e => e.id === req.employeeId)
    return {
      ...req,
      employeeAlias: emp?.alias || emp?.visibleAs || 'Anonymous Referrer',
    }
  })

  const handleRequest = (referrer) => {
    if (tokens > 0 && !referrer.requested) {
      const normalized = { ...referrer, match: referrer.match ?? referrer.aiScore }
      setModalRef(normalized)
    }
  }

  const handleSend = async (referrer, targetRole, pitch) => {
    try {
      await createReferralRequest({
        candidateId: user.uid,
        employeeId:  referrer.id,
        targetRole,
        pitch,
        match: referrer.match,
      })
    } catch (err) {
      console.error('Failed to send request:', err)
    }
  }

  const handleUpdateProfile = async (data) => {
    try {
      await updateCandidateProfile(user.uid, data)
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
  }

  if (!dataReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#C8FF00] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#6B6966] tracking-widest uppercase">Loading dashboard</span>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'overview':    return <OverviewPage setActiveTab={setActiveTab} tokens={tokens} referrers={referrers} requests={enrichedRequests} activity={activity} onRequest={handleRequest} profile={profile} />
      case 'profile':     return <ProfilePage profile={profile} onUpdateProfile={handleUpdateProfile} />
      case 'discover':    return <DiscoverPage referrers={referrers} onRequest={handleRequest} />
      case 'requests':    return <RequestsPage requests={enrichedRequests} />
      case 'shadow-interview': return <ShadowInterviewPage interviews={shadowInterviews} onComplete={() => {}} />
      case 'ai-match':    return <AIMatchPage recommendations={recommendations} profile={profile} onRequest={handleRequest} tokens={tokens} />
      case 'warm-intro':  return <WarmIntroPage referrers={referrers} />
      case 'skill-gap':   return <SkillGapPage />
      default:            return null
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#111]">
      <Sidebar active={activeTab} setActive={setActiveTab} navigate={navigate} tokens={tokens} profile={profile} interviewBadge={shadowInterviews.filter(i => i.status === 'generated').length} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
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
