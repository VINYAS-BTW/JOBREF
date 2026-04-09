import MetricsCard from './MetricsCard'

function pct(n) {
  if (!Number.isFinite(n)) return '0%'
  return `${Math.round(n * 1000) / 10}%`
}

export default function MetricsCards({ metrics }) {
  const { totalReferrals, totalInterviews, totalHires, hireConversion } = metrics
  return (
    <div className="flex flex-wrap gap-3">
      <MetricsCard title="Total referrals" value={String(totalReferrals)} />
      <MetricsCard title="Interview stage+" value={String(totalInterviews)} hint="Includes hired" />
      <MetricsCard title="Total hires" value={String(totalHires)} />
      <MetricsCard title="Hire conversion" value={pct(hireConversion)} hint="Hires ÷ referrals" />
    </div>
  )
}
