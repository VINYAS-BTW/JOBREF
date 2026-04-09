import LeaderboardItem from './LeaderboardItem'

export default function TopReferrersList({ items }) {
  if (!items.length) {
    return (
      <div className="rounded-sm border border-dashed border-white/[0.12] px-4 py-8 text-center text-sm text-[#6B6966]">
        No referrers yet.
      </div>
    )
  }

  return (
    <div className="rounded-sm border border-white/[0.08] bg-white/[0.02] px-3 py-2">
      {items.map((row, i) => (
        <LeaderboardItem
          key={row.id}
          rank={i + 1}
          name={row.name}
          karmaScore={row.karmaScore ?? 0}
          hireCount={row.successfulReferrals ?? 0}
        />
      ))}
    </div>
  )
}
