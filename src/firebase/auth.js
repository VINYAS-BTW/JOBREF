import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

const githubProvider = new GithubAuthProvider()

export async function registerWithEmail(email, password, name, role, extra = {}) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName: name })

  await setDoc(doc(db, 'users', user.uid), {
    uid:       user.uid,
    email,
    name,
    role,
    createdAt: serverTimestamp(),
    ...(role === 'employee'
      ? { karmaScore: 0, totalReferrals: 0, successfulReferrals: 0 }
      : {}),
  })

  if (role === 'candidate') {
    await setDoc(doc(db, 'candidateProfiles', user.uid), {
      uid:               user.uid,
      name,
      email,
      currentRole:       '',
      yearsExperience:   0,
      location:          '',
      lookingFor:        '',
      skills:            [],
      bio:               '',
      githubConnected:   false,
      leetcodeConnected: false,
      tokens:            3,
      tokenResetDate:    new Date(Date.now() + 30 * 86400000),
      createdAt:         serverTimestamp(),
    })
  } else if (role === 'employee') {
    await setDoc(doc(db, 'employeeProfiles', user.uid), {
      uid:            user.uid,
      name,
      email,
      alias:          extra.company ? `${name} @ ${extra.company}` : name,
      company:        extra.company || '',
      companyTier:    '',
      stack:          extra.stack ? extra.stack.split(',').map(s => s.trim()).filter(Boolean) : [],
      activeReqs:     [],
      reputation:     3.5,
      totalRefs:      0,
      totalBounty:    0,
      pendingBounty:  0,
      visibleAs:      extra.company ? `Employee @ ${extra.company}` : 'Anonymous Referrer',
      anonymousSince: serverTimestamp(),
      createdAt:      serverTimestamp(),
      karmaScore:       0,
      successfulReferrals: 0,
    })
  }

  return user
}

export async function loginWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function loginWithGithub() {
  const { user } = await signInWithPopup(auth, githubProvider)

  const userDoc = await getDoc(doc(db, 'users', user.uid))
  if (!userDoc.exists()) {
    return { user, needsRole: true }
  }

  return { user, needsRole: false, role: userDoc.data().role }
}

export async function completeGithubProfile(user, role, extra = {}) {
  const name = user.displayName || user.email?.split('@')[0] || 'User'

  await setDoc(doc(db, 'users', user.uid), {
    uid:       user.uid,
    email:     user.email,
    name,
    role,
    createdAt: serverTimestamp(),
    ...(role === 'employee'
      ? { karmaScore: 0, totalReferrals: 0, successfulReferrals: 0 }
      : {}),
  })

  if (role === 'candidate') {
    await setDoc(doc(db, 'candidateProfiles', user.uid), {
      uid:               user.uid,
      name,
      email:             user.email,
      currentRole:       '',
      yearsExperience:   0,
      location:          '',
      lookingFor:        '',
      skills:            [],
      bio:               '',
      githubConnected:   true,
      leetcodeConnected: false,
      tokens:            3,
      tokenResetDate:    new Date(Date.now() + 30 * 86400000),
      createdAt:         serverTimestamp(),
    })
  } else if (role === 'employee') {
    await setDoc(doc(db, 'employeeProfiles', user.uid), {
      uid:            user.uid,
      name,
      email:          user.email,
      alias:          name,
      company:        extra.company || '',
      companyTier:    '',
      stack:          [],
      activeReqs:     [],
      reputation:     3.5,
      totalRefs:      0,
      totalBounty:    0,
      pendingBounty:  0,
      visibleAs:      'Anonymous Referrer',
      anonymousSince: serverTimestamp(),
      createdAt:      serverTimestamp(),
      karmaScore:       0,
      successfulReferrals: 0,
    })
  }
}

export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data().role : null
}

export function signOut() {
  return firebaseSignOut(auth)
}
