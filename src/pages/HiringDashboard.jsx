import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { LogOut, LayoutDashboard, Users, BarChart2, GitBranch, Trophy, Table } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeAllCandidates } from '../firebase/firestore'
import {
  subscribeReferrals,
  subscribeJobs,
  subscribeEmployeeProfilesForLeaderboard,
  subscribeEmployeeProfiles,
  subscribePipeline,
  updateReferralStatus,
  updatePipelineStatus,
  aggregateDashboardMetrics,
  referrerMetricsForEmployee,
  displayReferrerName,
  REFERRAL_STATUSES,
  createJob,
  createReferral,
  purgeDemoData,
  pipelineToReferralStatus,
} from '../firebase/hiringFirestore'
import MetricsCards from '../components/hiring/MetricsCards'
import ReferralTable from '../components/hiring/ReferralTable'
import PipelineView from '../components/hiring/PipelineView'
import TopReferrersList from '../components/hiring/TopReferrersList'
import ReferralCard from '../components/hiring/ReferralCard'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
}

export default function HiringDashboard({ navigate }) {
  const { user } = useAuth()
  const [referrals, setReferrals] = useState([])
  const [pipeline, setPipeline] = useState([])
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [employees, setEmployees] = useState([])
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [createJobOpen, setCreateJobOpen] = useState(false)
  const [createRefOpen, setCreateRefOpen] = useState(false)
  const [jobForm, setJobForm] = useState({ title: '', company: '' })
  const [refForm, setRefForm] = useState({
    candidateId: '',
    employeeId: '',
    jobId: '',
    status: 'requested',
    matchScore: '',
  })
  const [saving, setSaving] = useState(false)
  const [purging, setPurging] = useState(false)

  useEffect(() => {
    const unsubs = [
      subscribeReferrals(setReferrals),
      subscribePipeline(setPipeline),
      subscribeJobs(setJobs),
      subscribeAllCandidates(setCandidates),
      // Use non-ordered subscription for stable functionality.
      subscribeEmployeeProfiles(setEmployees),
    ]
    return () => unsubs.forEach((u) => u && u())
  }, [])

  const jobById = useMemo(() => Object.fromEntries(jobs.map((j) => [j.id, j])), [jobs])
  const candById = useMemo(() => Object.fromEntries(candidates.map((c) => [c.id, c])), [candidates])
  const empById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees])

  const referralRows = useMemo(
    () =>
      referrals.map((r) => {
        const job = jobById[r.jobId]
        const cand = candById[r.candidateId]
        const emp = empById[r.employeeId]
        return {
          id: r.id,
          source: 'referrals',
          status: r.status,
          matchScore: r.matchScore,
          candidateName: cand?.name || 'Unknown candidate',
          jobTitle: job?.title ? `${job.title}${job.company ? ` · ${job.company}` : ''}` : 'Unknown role',
          referrerName: emp?.name || 'Unknown referrer',
        }
      }),
    [referrals, jobById, candById, empById]
  )

  const pipelineRows = useMemo(
    () =>
      pipeline.map((p) => {
        const cand = candById[p.candidateId]
        const emp = empById[p.employeeId]
        return {
          id: p.id,
          source: 'pipeline',
          status: pipelineToReferralStatus(p.status),
          matchScore: p.match,
          candidateName: cand?.name || p.candidateName || 'Unknown candidate',
          jobTitle: p.role || 'Unknown role',
          referrerName: emp?.name || 'Unknown referrer',
        }
      }),
    [pipeline, candById, empById]
  )

  // What hiring should see for "Forwarded to ATS" is `pipelineRows`.
  // We keep `referralRows` too (from hiring-created referrals).
  const enrichedRows = useMemo(() => [...pipelineRows, ...referralRows], [pipelineRows, referralRows])

  const recentEnriched = useMemo(() => enrichedRows.slice(0, 6), [enrichedRows])

  const grouped = useMemo(() => {
    const g = Object.fromEntries(REFERRAL_STATUSES.map((s) => [s, []]))
    enrichedRows.forEach((row) => {
      if (g[row.status]) g[row.status].push(row)
    })
    return g
  }, [enrichedRows])

  const metrics = useMemo(() => aggregateDashboardMetrics(enrichedRows), [enrichedRows])

  const topReferrers = useMemo(() => {
    const sorted = [...employees].sort((a, b) => (b.karmaScore ?? 0) - (a.karmaScore ?? 0))
    return sorted.slice(0, 5)
  }, [employees])

  const referrerPerfRows = useMemo(() => {
    return employees
      .map((e) => ({
        id: e.id,
        name: e.name || e.alias || e.id,
        ...referrerMetricsForEmployee(e.id, referrals),
      }))
      .filter((r) => r.totalReferrals > 0)
      .sort((a, b) => b.performanceScore - a.performanceScore)
  }, [employees, referrals])

  const handleStatus = useCallback(async (id, status, source) => {
    setError('')
    setBusyId(id)
    try {
      if (source === 'pipeline') {
        await updatePipelineStatus(id, status)
      } else {
        await updateReferralStatus(id, status)
      }
    } catch (e) {
      setError(e.message || 'Update failed. Check Firestore rules and indexes.')
    } finally {
      setBusyId(null)
    }
  }, [])

  const renderPipelineCard = useCallback(
    (row) => (
      <ReferralCard
        candidateName={row.candidateName}
        jobTitle={row.jobTitle}
        referrerName={displayReferrerName(row.status, row.referrerName)}
        status={row.status}
        matchScore={row.matchScore}
        busy={busyId === row.id}
        onInterview={() => handleStatus(row.id, 'interview', row.source)}
        onHired={() => handleStatus(row.id, 'hired', row.source)}
        onReject={() => handleStatus(row.id, 'rejected', row.source)}
      />
    ),
    [busyId, handleStatus]
  )

  const onSignOut = useCallback(() => navigate('landing'), [navigate])

  const onCreateJob = useCallback(async () => {
    setError('')
    setSaving(true)
    try {
      await createJob(jobForm)
      setJobForm({ title: '', company: '' })
      setCreateJobOpen(false)
    } catch (e) {
      setError(e.message || 'Could not create job.')
    } finally {
      setSaving(false)
    }
  }, [jobForm])

  const onCreateReferral = useCallback(async () => {
    setError('')
    setSaving(true)
    try {
      await createReferral(refForm)
      setRefForm({ candidateId: '', employeeId: '', jobId: '', status: 'requested', matchScore: '' })
      setCreateRefOpen(false)
    } catch (e) {
      setError(e.message || 'Could not create referral.')
    } finally {
      setSaving(false)
    }
  }, [refForm])

  const onPurgeDemo = useCallback(async () => {
    setError('')
    setPurging(true)
    try {
      await purgeDemoData()
    } catch (e) {
      setError(e.message || 'Could not purge demo data.')
    } finally {
      setPurging(false)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0A0A0B] text-[#E8E6E1]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="flex min-h-screen">
        <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/6">
          <div className="px-5 py-5 border-b border-white/6">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#C8FF00]">RefHire</span>
            <div className="mt-4">
              <p className="text-xs text-[#6B6966]">Hiring committee</p>
              <p className="text-sm text-[#E8E6E1] mt-0.5" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Referral ATS
              </p>
            </div>
          </div>
          <div className="px-3 py-4 space-y-1">
            <NavItem icon={BarChart2} label="Funnel Metrics" />
            <NavItem icon={Trophy} label="Top Referrers" />
            <NavItem icon={Users} label="Performance" />
            <NavItem icon={GitBranch} label="Pipeline" />
            <NavItem icon={Table} label="Referrals Table" />
          </div>
          <div className="mt-auto px-3 py-4 border-t border-white/6 space-y-2">
            <div className="px-2.5 py-2.5 bg-white/2 border border-white/6 rounded-sm">
              <p className="text-[10px] uppercase tracking-widest text-[#3D3B38]">Signed in</p>
              <p className="text-xs text-[#A09E9A] mt-1 truncate">{user?.email}</p>
            </div>
            <button
              type="button"
              disabled={purging}
              onClick={onPurgeDemo}
              className="w-full flex items-center justify-center gap-2 px-2.5 py-2 text-[11px] text-[#A09E9A] border border-white/10 rounded-sm hover:bg-white/2 disabled:opacity-50"
            >
              {purging ? 'Purging demo data…' : 'Purge demo data'}
            </button>
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-[13px] text-[#3D3B38] hover:text-[#6B6966] transition-colors rounded-sm hover:bg-white/2"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="border-b border-white/[0.06] bg-[#111]/80 backdrop-blur-md sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <LayoutDashboard size={16} className="text-[#C8FF00]" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-[#C8FF00]">Hiring committee</p>
                  <p className="text-xs text-[#A09E9A] truncate">Centralized referral operations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCreateJobOpen(true)}
                  className="text-xs text-[#A09E9A] hover:text-[#E8E6E1] border border-white/10 px-3 py-1.5 rounded-sm"
                >
                  New job
                </button>
                <button
                  type="button"
                  onClick={() => setCreateRefOpen(true)}
                  className="text-xs bg-[#C8FF00] text-[#0A0A0B] font-semibold px-3 py-1.5 rounded-sm hover:bg-[#D4FF26]"
                >
                  New referral
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {error && (
              <div className="text-xs text-red-400 border border-red-500/25 bg-red-500/10 rounded-sm px-3 py-2">{error}</div>
            )}

            <motion.section variants={fadeUp} initial="hidden" animate="show" className="rounded-sm border border-white/6 bg-white/[0.015] p-4">
              <SectionHeader icon={BarChart2} title="Funnel metrics" subtitle="At-a-glance pipeline health" />
              <MetricsCards metrics={metrics} />
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-widest text-[#6B6966] mb-2">Recent referrals</p>
                {recentEnriched.length === 0 ? (
                  <p className="text-xs text-[#6B6966]">No referrals yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-sm border border-white/[0.08]">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-widest text-[#6B6966]">
                          <th className="px-4 py-2 font-medium">Candidate</th>
                          <th className="px-4 py-2 font-medium">Referred by</th>
                          <th className="px-4 py-2 font-medium">Job</th>
                          <th className="px-4 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEnriched.map((r) => (
                          <tr key={r.id} className="border-b border-white/[0.05]">
                            <td className="px-4 py-2 text-[#E8E6E1]">{r.candidateName}</td>
                            <td className="px-4 py-2 text-[#A09E9A]">{displayReferrerName(r.status, r.referrerName)}</td>
                            <td className="px-4 py-2 text-[#A09E9A]">{r.jobTitle}</td>
                            <td className="px-4 py-2 text-xs capitalize text-[#C8FF00]">{r.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.section>

            <motion.section variants={fadeUp} initial="hidden" animate="show" className="rounded-sm border border-white/6 bg-white/[0.015] p-4">
              <SectionHeader icon={Users} title="Top referrers" subtitle="Ranked by karma and successful outcomes" />
              <TopReferrersList items={topReferrers} />
            </motion.section>

            <motion.section variants={fadeUp} initial="hidden" animate="show" className="rounded-sm border border-white/6 bg-white/[0.015] p-4">
              <SectionHeader
                title="Referrer performance"
                subtitle="Score = round(100 × (0.5×hire rate + 0.3×interview rate + 0.2×avg match/100))"
              />
              {referrerPerfRows.length === 0 ? (
                <p className="text-sm text-[#6B6966]">No referral volume yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-sm border border-white/[0.08]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-widest text-[#6B6966]">
                        <th className="px-4 py-2">Referrer</th>
                        <th className="px-4 py-2">Total</th>
                        <th className="px-4 py-2">Interviews+</th>
                        <th className="px-4 py-2">Hires</th>
                        <th className="px-4 py-2">Interview %</th>
                        <th className="px-4 py-2">Hire %</th>
                        <th className="px-4 py-2">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrerPerfRows.map((r) => (
                        <tr key={r.id} className="border-b border-white/[0.05]">
                          <td className="px-4 py-2 text-[#E8E6E1]">{r.name}</td>
                          <td className="px-4 py-2 tabular-nums">{r.totalReferrals}</td>
                          <td className="px-4 py-2 tabular-nums">{r.interviewCount}</td>
                          <td className="px-4 py-2 tabular-nums">{r.hireCount}</td>
                          <td className="px-4 py-2 tabular-nums">{pct(r.interviewRate)}</td>
                          <td className="px-4 py-2 tabular-nums">{pct(r.hireRate)}</td>
                          <td className="px-4 py-2 text-[#C8FF00] tabular-nums">{r.performanceScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.section>

            <motion.section variants={fadeUp} initial="hidden" animate="show" className="rounded-sm border border-white/6 bg-white/[0.015] p-4">
              <SectionHeader title="Pipeline" subtitle="Track and update candidates through each hiring stage" />
              <PipelineView grouped={grouped} renderCard={renderPipelineCard} />
            </motion.section>

            <motion.section variants={fadeUp} initial="hidden" animate="show" className="rounded-sm border border-white/6 bg-white/[0.015] p-4">
              <SectionHeader title="All referrals" subtitle="Candidate, role, status, and privacy-safe referrer view" />
              <ReferralTable
                rows={enrichedRows}
                busyId={busyId}
                onRowAction={(id, st) => {
                  const row = enrichedRows.find((r) => r.id === id)
                  handleStatus(id, st, row?.source || 'referrals')
                }}
              />
            </motion.section>
          </main>
        </div>
      </div>

      {createJobOpen && (
        <Modal title="Create job" onClose={() => setCreateJobOpen(false)}>
          <div className="space-y-3">
            <Field
              label="Title"
              value={jobForm.title}
              onChange={(v) => setJobForm((s) => ({ ...s, title: v }))}
              placeholder="e.g. Senior Frontend Engineer"
            />
            <Field
              label="Company"
              value={jobForm.company}
              onChange={(v) => setJobForm((s) => ({ ...s, company: v }))}
              placeholder="e.g. Acme Inc"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateJobOpen(false)}
                className="text-xs text-[#A09E9A] hover:text-[#E8E6E1] border border-white/10 px-3 py-1.5 rounded-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onCreateJob}
                className="text-xs bg-[#C8FF00] text-[#0A0A0B] font-semibold px-3 py-1.5 rounded-sm hover:bg-[#D4FF26] disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </Modal>
      )}

      {createRefOpen && (
        <Modal title="Create referral" onClose={() => setCreateRefOpen(false)}>
          <div className="space-y-3">
            <Select
              label="Candidate"
              value={refForm.candidateId}
              onChange={(v) => setRefForm((s) => ({ ...s, candidateId: v }))}
              options={candidates.map((c) => ({ value: c.id, label: c.name || c.email || c.id }))}
            />
            <Select
              label="Referrer"
              value={refForm.employeeId}
              onChange={(v) => setRefForm((s) => ({ ...s, employeeId: v }))}
              options={employees.map((e) => ({ value: e.id, label: e.name || e.alias || e.id }))}
            />
            <Select
              label="Job"
              value={refForm.jobId}
              onChange={(v) => setRefForm((s) => ({ ...s, jobId: v }))}
              options={jobs.map((j) => ({ value: j.id, label: `${j.title}${j.company ? ` · ${j.company}` : ''}` }))}
            />
            <Select
              label="Status"
              value={refForm.status}
              onChange={(v) => setRefForm((s) => ({ ...s, status: v }))}
              options={REFERRAL_STATUSES.map((s) => ({ value: s, label: s }))}
            />
            <Field
              label="Match score"
              value={refForm.matchScore}
              onChange={(v) => setRefForm((s) => ({ ...s, matchScore: v }))}
              placeholder="0–100"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateRefOpen(false)}
                className="text-xs text-[#A09E9A] hover:text-[#E8E6E1] border border-white/10 px-3 py-1.5 rounded-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onCreateReferral}
                className="text-xs bg-[#C8FF00] text-[#0A0A0B] font-semibold px-3 py-1.5 rounded-sm hover:bg-[#D4FF26] disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  )
}

function NavItem({ icon: Icon, label }) {
  return (
    <div className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-[#6B6966]">
      <Icon size={13} />
      <span className="text-[13px]">{label}</span>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        {Icon ? <Icon size={15} className="text-[#C8FF00]" /> : null}
        <h2 className="text-sm font-medium text-[#E8E6E1]">{title}</h2>
      </div>
      {subtitle ? <p className="text-xs text-[#6B6966] mt-1">{subtitle}</p> : null}
    </div>
  )
}

function pct(n) {
  if (!n) return '0%'
  return `${Math.round(n * 1000) / 10}%`
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-sm border border-white/10 bg-[#0A0A0B] p-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="text-sm text-[#E8E6E1]" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#A09E9A] hover:text-[#E8E6E1] border border-white/10 px-2 py-1 rounded-sm"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[#6B6966] mb-1">{label}</p>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/3 border border-white/8 text-sm text-[#E8E6E1] placeholder-[#3D3B38] px-3 py-2 rounded-sm focus:outline-none focus:border-[#C8FF00]/50 transition-colors"
      />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[#6B6966] mb-1">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/3 border border-white/8 text-sm text-[#E8E6E1] px-3 py-2 rounded-sm focus:outline-none focus:border-[#C8FF00]/50 transition-colors"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
