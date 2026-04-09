export default function LeaderboardItem({ rank, name, karmaScore, hireCount }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.06] last:border-0">
      <span className="w-6 text-xs font-mono text-[#C8FF00]">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#E8E6E1] truncate">{name}</p>
        <p className="text-[10px] text-[#6B6966]">{hireCount} hires</p>
      </div>
      <span className="text-sm font-medium text-[#E8E6E1] tabular-nums">{karmaScore}</span>
    </div>
  )
}
