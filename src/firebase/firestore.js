import {
  doc, getDoc, updateDoc,
  collection, query, where, orderBy, onSnapshot,
  addDoc, serverTimestamp, increment,
} from 'firebase/firestore'
import { db } from './config'

// ─── Candidate Profile ──────────────────────────────────────────────────────

export function subscribeCandidateProfile(uid, callback) {
  return onSnapshot(doc(db, 'candidateProfiles', uid), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export async function getCandidateProfile(uid) {
  const snap = await getDoc(doc(db, 'candidateProfiles', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function updateCandidateProfile(uid, data) {
  return updateDoc(doc(db, 'candidateProfiles', uid), data)
}

// ─── Employee Profile ───────────────────────────────────────────────────────

export function subscribeEmployeeProfile(uid, callback) {
  return onSnapshot(doc(db, 'employeeProfiles', uid), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

async function getEmployeeProfile(uid) {
  const snap = await getDoc(doc(db, 'employeeProfiles', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function updateEmployeeProfile(uid, data) {
  return updateDoc(doc(db, 'employeeProfiles', uid), data)
}

// ─── Discover: All Employee Profiles (for candidates) ───────────────────────

export function subscribeAllEmployees(callback) {
  const q = query(collection(db, 'employeeProfiles'), orderBy('reputation', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── Discover: All Candidate Profiles (for employees to compute AI matches) ─

export function subscribeAllCandidates(callback) {
  const q = query(collection(db, 'candidateProfiles'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── Referral Requests ──────────────────────────────────────────────────────

export async function createReferralRequest({ candidateId, employeeId, targetRole, pitch, match }) {
  const ref = await addDoc(collection(db, 'referralRequests'), {
    candidateId,
    employeeId,
    targetRole,
    pitch,
    match,
    status:    'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await updateDoc(doc(db, 'candidateProfiles', candidateId), {
    tokens: increment(-1),
  })

  return ref.id
}

export function subscribeCandidateRequests(candidateId, callback) {
  const q = query(
    collection(db, 'referralRequests'),
    where('candidateId', '==', candidateId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function subscribeEmployeeInbox(employeeId, callback) {
  const q = query(
    collection(db, 'referralRequests'),
    where('employeeId', '==', employeeId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

async function updateRequestStatus(requestId, status) {
  return updateDoc(doc(db, 'referralRequests', requestId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function acceptRequest(requestId, employeeId) {
  await updateRequestStatus(requestId, 'accepted')

  const reqSnap = await getDoc(doc(db, 'referralRequests', requestId))
  if (!reqSnap.exists()) return

  const reqData = reqSnap.data()
  const candidateProfile = await getCandidateProfile(reqData.candidateId)

  await addDoc(collection(db, 'pipeline'), {
    employeeId,
    candidateId:    reqData.candidateId,
    candidateAlias: `Candidate #${reqData.candidateId.substring(0, 4).toUpperCase()}`,
    candidateName:  candidateProfile?.name || 'Unknown',
    role:           reqData.targetRole,
    match:          reqData.match,
    status:         'referred',
    stage:          1,
    bounty:         0,
    createdAt:      serverTimestamp(),
  })

  await updateDoc(doc(db, 'employeeProfiles', employeeId), {
    totalRefs:  increment(1),
    reputation: increment(0.05),
  })

  await addDoc(collection(db, 'activity'), {
    userId:    reqData.candidateId,
    type:      'accepted',
    text:      `Your referral request was accepted!`,
    createdAt: serverTimestamp(),
  })
}

export async function declineRequest(requestId) {
  return updateRequestStatus(requestId, 'declined')
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

export function subscribeEmployeePipeline(employeeId, callback) {
  const q = query(
    collection(db, 'pipeline'),
    where('employeeId', '==', employeeId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── Activity Feed ──────────────────────────────────────────────────────────

export function subscribeActivity(userId, callback) {
  const q = query(
    collection(db, 'activity'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── Shadow Interviews ──────────────────────────────────────────────────────

export function subscribeCandidateShadowInterviews(candidateId, callback) {
  const q = query(
    collection(db, 'shadowInterviews'),
    where('candidateId', '==', candidateId),
  )
  return onSnapshot(q, snap => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    callback(docs)
  })
}

export function subscribeEmployeeShadowInterviews(employeeId, callback) {
  const q = query(
    collection(db, 'shadowInterviews'),
    where('employeeId', '==', employeeId),
  )
  return onSnapshot(q, snap => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    callback(docs)
  })
}

