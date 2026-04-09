import { Briefcase, User, GitBranch, Gauge } from 'lucide-react'

const STATUS_STYLE = {
  requested: { bg: 'rgba(255,255,255,0.06)', color: '#A09E9A' },
  approved: { bg: 'rgba(200,255,0,0.08)', color: '#C8FF00' },
  interview: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  hired: { bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
  rejected: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
}

export default function ReferralCard({
  candidateName,
  jobTitle,
  referrerName,
  status,
  matchScore,
  busy,
  onInterview,
  onHired,
  onReject,
}) {
  const st = STATUS_STYLE[status] || STATUS_STYLE.requested
  return (
    <div className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium text-[#E8E6E1] truncate">
            <User size={14} className="text-[#6B6966] shrink-0" />
            {candidateName}
          </p>
          <p className="flex items-center gap-2 text-xs text-[#A09E9A] truncate">
            <Briefcase size={13} className="text-[#6B6966] shrink-0" />
            {jobTitle}
          </p>
          <p className="flex items-center gap-2 text-xs text-[#6B6966] truncate">
            <GitBranch size={13} className="text-[#6B6966] shrink-0" />
            {referrerName}
          </p>
        </div>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-sm shrink-0"
          style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}33` }}
        >
          {status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-[#6B6966]">
        <Gauge size={13} />
        Match score <span className="text-[#E8E6E1] tabular-nums">{matchScore ?? '—'}</span>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={busy || status === 'interview' || status === 'hired' || status === 'rejected'}
          onClick={onInterview}
          className="text-[11px] font-medium px-3 py-1.5 rounded-sm bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 disabled:opacity-40"
        >
          Move to interview
        </button>
        <button
          type="button"
          disabled={busy || status === 'hired' || status === 'rejected'}
          onClick={onHired}
          className="text-[11px] font-medium px-3 py-1.5 rounded-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 disabled:opacity-40"
        >
          Mark hired
        </button>
        <button
          type="button"
          disabled={busy || status === 'rejected'}
          onClick={onReject}
          className="text-[11px] font-medium px-3 py-1.5 rounded-sm bg-white/5 text-[#A09E9A] border border-white/10 hover:bg-white/10 disabled:opacity-40"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
