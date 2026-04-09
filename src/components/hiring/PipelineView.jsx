import { REFERRAL_STATUSES } from '../../firebase/hiringFirestore'

export default function PipelineView({ grouped, renderCard }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
      {REFERRAL_STATUSES.map((status) => (
        <div key={status} className="rounded-sm border border-white/[0.08] bg-white/[0.015] min-h-[120px]">
          <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-[#6B6966]">{status}</span>
            <span className="text-[10px] text-[#3D3B38] tabular-nums">{(grouped[status] || []).length}</span>
          </div>
          <div className="p-2 space-y-2">
            {(grouped[status] || []).map((item) => (
              <div key={item.id}>{renderCard(item)}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
