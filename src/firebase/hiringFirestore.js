import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  documentId,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  increment,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config'

export const REFERRAL_STATUSES = ['requested', 'approved', 'interview', 'hired', 'rejected']
export const PIPELINE_STATUSES = ['referred', 'interviewing', 'offer_extended', 'hired', 'declined']

export function subscribeReferrals(callback) {
  const q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    () => callback([])
  )
}

export function subscribePipeline(callback) {
  const q = query(collection(db, 'pipeline'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => callback([])
  )
}

export function pipelineToReferralStatus(pipelineStatus) {
  switch (pipelineStatus) {
    case 'referred':
      return 'approved'
    case 'interviewing':
    case 'offer_extended':
      return 'interview'
    case 'hired':
      return 'hired'
    case 'declined':
      return 'rejected'
    default:
      return 'requested'
  }
}

export function referralToPipelineStatus(refStatus) {
  switch (refStatus) {
    case 'interview':
      return 'interviewing'
    case 'hired':
      return 'hired'
    case 'rejected':
      return 'declined'
    case 'approved':
      return 'referred'
    default:
      return 'referred'
  }
}

export function subscribeJobs(callback) {
  const q = query(collection(db, 'jobs'), orderBy('title'))
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    () => callback([])
  )
}

export function subscribeEmployeeProfilesForLeaderboard(callback) {
  // Avoid requiring a `karmaScore` field or composite indexes; sort client-side.
  return onSnapshot(
    collection(db, 'employeeProfiles'),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    () => callback([])
  )
}

export function subscribeEmployeeProfiles(callback) {
  return onSnapshot(
    collection(db, 'employeeProfiles'),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => callback([])
  )
}

export async function fetchReferralsOnce() {
  const q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function fetchReferralsByEmployeeOnce(employeeId) {
  const q = query(
    collection(db, 'referrals'),
    where('employeeId', '==', employeeId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createJob({ title, company }) {
  if (!title?.trim()) throw new Error('Job title is required')
  const ref = await addDoc(collection(db, 'jobs'), {
    title: title.trim(),
    company: (company || '').trim(),
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function createReferral({ candidateId, employeeId, jobId, status = 'requested', matchScore }) {
  if (!candidateId) throw new Error('Candidate is required')
  if (!employeeId) throw new Error('Referrer is required')
  if (!jobId) throw new Error('Job is required')
  if (!REFERRAL_STATUSES.includes(status)) throw new Error('Invalid status')
  const scoreNum = matchScore === '' || matchScore == null ? null : Number(matchScore)
  if (scoreNum != null && (!Number.isFinite(scoreNum) || scoreNum < 0 || scoreNum > 100)) {
    throw new Error('Match score must be 0–100')
  }

  const ref = await addDoc(collection(db, 'referrals'), {
    candidateId,
    employeeId,
    jobId,
    status,
    matchScore: scoreNum == null ? null : Math.round(scoreNum),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

async function deleteByIdPrefix(colName, prefix, pageSize = 200) {
  const start = prefix
  const end = `${prefix}\uf8ff`
  while (true) {
    const q = query(collection(db, colName), where(documentId(), '>=', start), where(documentId(), '<=', end), limit(pageSize))
    const snap = await getDocs(q)
    if (snap.empty) break
    const batch = writeBatch(db)
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    if (snap.size < pageSize) break
  }
}

export async function purgeDemoData() {
  // Known demo prefixes / ids created by earlier seeds.
  await deleteByIdPrefix('employeeProfiles', 'demo-')
  await deleteByIdPrefix('candidateProfiles', 'demo-')
  await deleteByIdPrefix('referrals', 'demo-')

  // Demo jobs were written with fixed ids `job-1..job-8` in the earlier seed.
  for (let i = 1; i <= 8; i++) {
    await deleteDoc(doc(db, 'jobs', `job-${i}`))
  }

  // Seed metadata flags.
  await deleteDoc(doc(db, '_meta', 'seeded'))
  await deleteDoc(doc(db, '_meta', 'hiringCommitteeSeeded'))
}

/**
 * @param {string} referralId
 * @param {'requested'|'approved'|'interview'|'hired'|'rejected'} newStatus
 */
export async function updateReferralStatus(referralId, newStatus) {
  if (!REFERRAL_STATUSES.includes(newStatus)) {
    throw new Error('Invalid status')
  }

  const refRef = doc(db, 'referrals', referralId)

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(refRef)
    if (!snap.exists()) throw new Error('Referral not found')

    const data = snap.data()
    const prev = data.status

    transaction.update(refRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    })

    let karmaDelta = 0
    if (newStatus === 'interview' && prev !== 'interview' && prev !== 'hired') {
      karmaDelta += 10
    }
    if (newStatus === 'hired' && prev !== 'hired') {
      karmaDelta += 25
    }

    const empRef = doc(db, 'employeeProfiles', data.employeeId)
    const empSnap = await transaction.get(empRef)
    if (!empSnap.exists()) return

    const patch = {}
    if (karmaDelta > 0) {
      patch.karmaScore = increment(karmaDelta)
    }
    if (newStatus === 'hired' && prev !== 'hired') {
      patch.successfulReferrals = increment(1)
    }
    if (Object.keys(patch).length > 0) {
      transaction.update(empRef, patch)
    }
  })
}

export async function updatePipelineStatus(pipelineId, newReferralStatus) {
  if (!REFERRAL_STATUSES.includes(newReferralStatus)) throw new Error('Invalid status')

  const pipeRef = doc(db, 'pipeline', pipelineId)
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(pipeRef)
    if (!snap.exists()) throw new Error('Pipeline item not found')
    const data = snap.data()
    const prevPipeline = data.status
    const prevReferral = pipelineToReferralStatus(prevPipeline)
    const nextPipeline = referralToPipelineStatus(newReferralStatus)

    transaction.update(pipeRef, {
      status: nextPipeline,
      updatedAt: serverTimestamp(),
    })

    let karmaDelta = 0
    if (newReferralStatus === 'interview' && prevReferral !== 'interview' && prevReferral !== 'hired') {
      karmaDelta += 10
    }
    if (newReferralStatus === 'hired' && prevReferral !== 'hired') {
      karmaDelta += 25
    }

    const employeeId = data.employeeId
    if (!employeeId) return
    const empRef = doc(db, 'employeeProfiles', employeeId)
    const empSnap = await transaction.get(empRef)
    if (!empSnap.exists()) return

    const patch = {}
    if (karmaDelta > 0) patch.karmaScore = increment(karmaDelta)
    if (newReferralStatus === 'hired' && prevReferral !== 'hired') patch.successfulReferrals = increment(1)
    if (Object.keys(patch).length > 0) transaction.update(empRef, patch)
  })
}

export function safeDiv(num, den) {
  if (!den) return 0
  return num / den
}

/** interview_count includes hires (reached interview stage). */
export function referrerMetricsForEmployee(employeeId, referrals) {
  const mine = referrals.filter((r) => r.employeeId === employeeId)
  const total = mine.length
  const interviewCount = mine.filter((r) => r.status === 'interview' || r.status === 'hired').length
  const hireCount = mine.filter((r) => r.status === 'hired').length
  const interviewRate = safeDiv(interviewCount, total)
  const hireRate = safeDiv(hireCount, total)
  const scored = mine.filter((r) => typeof r.matchScore === 'number')
  const avgMatch =
    scored.length === 0 ? 0 : scored.reduce((s, r) => s + r.matchScore, 0) / scored.length
  const raw = 0.5 * hireRate + 0.3 * interviewRate + 0.2 * (avgMatch / 100)
  const performanceScore = Math.round(Math.min(1, Math.max(0, raw)) * 100)
  return {
    totalReferrals: total,
    interviewCount,
    hireCount,
    interviewRate,
    hireRate,
    avgMatchScore: avgMatch,
    performanceScore,
  }
}

export function aggregateDashboardMetrics(rows) {
  const total = rows.length
  const totalInterviews = rows.filter((r) => r.status === 'interview' || r.status === 'hired').length
  const totalHires = rows.filter((r) => r.status === 'hired').length
  return {
    totalReferrals: total,
    totalInterviews,
    totalHires,
    hireConversion: safeDiv(totalHires, total),
  }
}

export function displayReferrerName(status, employeeName) {
  if (status === 'requested') return 'Anonymous Employee'
  return employeeName || 'Unknown referrer'
}
