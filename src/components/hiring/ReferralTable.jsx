import { displayReferrerName, hiringRowBusyKey } from '../../firebase/hiringFirestore'

export default function ReferralTable({ rows, onRowAction, onRowDelete, busyKey }) {
  if (!rows.length) {
    return (
      <div className="rounded-sm border border-dashed border-white/[0.12] px-4 py-10 text-center text-sm text-[#6B6966]">
        No referrals found yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-white/[0.08]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-widest text-[#6B6966]">
            <th className="px-4 py-3 font-medium">Candidate</th>
            <th className="px-4 py-3 font-medium">Job</th>
            <th className="px-4 py-3 font-medium">Referrer</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Match</th>
            <th className="px-4 py-3 font-medium">Actions</th>
            {onRowDelete && <th className="px-4 py-3 font-medium w-24"> </th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.source || 'row'}-${r.id}`} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
              <td className="px-4 py-3 text-[#E8E6E1]">{r.candidateName}</td>
              <td className="px-4 py-3 text-[#A09E9A]">{r.jobTitle}</td>
              <td className="px-4 py-3 text-[#A09E9A]">
                {displayReferrerName(r.status, r.referrerName)}
              </td>
              <td className="px-4 py-3 text-xs capitalize text-[#C8FF00]">{r.status}</td>
              <td className="px-4 py-3 tabular-nums text-[#E8E6E1]">{r.matchScore ?? '—'}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  <MiniBtn
                    label="Interview"
                    disabled={
                      busyKey === hiringRowBusyKey(r.source, r.id) ||
                      r.status === 'interview' ||
                      r.status === 'hired' ||
                      r.status === 'rejected'
                    }
                    onClick={() => onRowAction(r.id, 'interview', r.source)}
                  />
                  <MiniBtn
                    label="Hired"
                    disabled={
                      busyKey === hiringRowBusyKey(r.source, r.id) || r.status === 'hired' || r.status === 'rejected'
                    }
                    onClick={() => onRowAction(r.id, 'hired', r.source)}
                  />
                  <MiniBtn
                    label="Reject"
                    disabled={busyKey === hiringRowBusyKey(r.source, r.id) || r.status === 'rejected'}
                    onClick={() => onRowAction(r.id, 'rejected', r.source)}
                  />
                </div>
              </td>
              {onRowDelete && (
                <td className="px-4 py-3">
                  <MiniBtn
                    label="Remove"
                    disabled={busyKey === hiringRowBusyKey(r.source, r.id)}
                    onClick={() => onRowDelete(r.id, r.source)}
                    danger
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MiniBtn({ label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        danger
          ? 'text-[10px] px-2 py-1 rounded-sm border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/15 disabled:opacity-35'
          : 'text-[10px] px-2 py-1 rounded-sm border border-white/10 bg-white/5 text-[#A09E9A] hover:bg-white/10 disabled:opacity-35'
      }
    >
      {label}
    </button>
  )
}
