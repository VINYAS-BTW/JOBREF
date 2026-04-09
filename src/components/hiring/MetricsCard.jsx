export default function MetricsCard({ title, value, hint }) {
  return (
    <div
      className="rounded-sm border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 min-w-[140px] flex-1"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <p className="text-[10px] uppercase tracking-widest text-[#6B6966] mb-1">{title}</p>
      <p className="text-2xl font-semibold text-[#E8E6E1]" style={{ fontFamily: "'DM Serif Display', serif" }}>
        {value}
      </p>
      {hint ? <p className="text-[10px] text-[#3D3B38] mt-1">{hint}</p> : null}
    </div>
  )
}
