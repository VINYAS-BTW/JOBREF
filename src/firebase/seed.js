import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

export async function seedDemoEmployees() {
  const sentinel = await getDoc(doc(db, '_meta', 'seeded'))
  if (sentinel.exists()) return false

  const employees = [
    {
      id: 'demo-emp-1',
      alias: 'Senior SWE @ Series-B Fintech',
      company: 'FinTech Corp',
      companyTier: 'Series-B',
      stack: ['React', 'Node.js', 'AWS'],
      activeReqs: ['Senior Frontend Engineer', 'Full-Stack Developer'],
      reputation: 4.8,
      totalRefs: 14,
      totalBounty: 3500,
      pendingBounty: 2800,
      visibleAs: 'Senior SWE @ Series-B Fintech',
      name: 'Demo Employee 1',
      email: 'emp1@demo.refhire.io',
    },
    {
      id: 'demo-emp-2',
      alias: 'Staff Eng @ Public SaaS Co.',
      company: 'SaaS Corp',
      companyTier: 'Public',
      stack: ['TypeScript', 'Go', 'GCP'],
      activeReqs: ['Staff Backend Engineer'],
      reputation: 4.6,
      totalRefs: 22,
      totalBounty: 5200,
      pendingBounty: 1800,
      visibleAs: 'Staff Eng @ Public SaaS Co.',
      name: 'Demo Employee 2',
      email: 'emp2@demo.refhire.io',
    },
    {
      id: 'demo-emp-3',
      alias: 'Senior Frontend @ FinTech Unicorn',
      company: 'FinTech Unicorn',
      companyTier: 'Unicorn',
      stack: ['React', 'TypeScript', 'GraphQL'],
      activeReqs: ['Frontend Architect', 'React Engineer'],
      reputation: 4.9,
      totalRefs: 8,
      totalBounty: 2100,
      pendingBounty: 0,
      visibleAs: 'Senior Frontend @ FinTech Unicorn',
      name: 'Demo Employee 3',
      email: 'emp3@demo.refhire.io',
    },
    {
      id: 'demo-emp-4',
      alias: 'Backend Lead @ YC S22',
      company: 'YC Startup',
      companyTier: 'YC',
      stack: ['Python', 'FastAPI', 'Redis'],
      activeReqs: ['Backend Engineer (Python)'],
      reputation: 4.3,
      totalRefs: 31,
      totalBounty: 8400,
      pendingBounty: 3200,
      visibleAs: 'Backend Lead @ YC S22',
      name: 'Demo Employee 4',
      email: 'emp4@demo.refhire.io',
    },
    {
      id: 'demo-emp-5',
      alias: 'Platform Eng @ FAANG Adjacent',
      company: 'Big Tech Inc',
      companyTier: 'FAANG+',
      stack: ['Go', 'K8s', 'Terraform'],
      activeReqs: ['Site Reliability Engineer', 'DevOps Lead'],
      reputation: 4.7,
      totalRefs: 19,
      totalBounty: 6100,
      pendingBounty: 2400,
      visibleAs: 'Platform Eng @ FAANG Adjacent',
      name: 'Demo Employee 5',
      email: 'emp5@demo.refhire.io',
    },
  ]

  for (const emp of employees) {
    const { id, ...data } = emp
    await setDoc(doc(db, 'employeeProfiles', id), {
      uid: id,
      ...data,
      anonymousSince: serverTimestamp(),
      createdAt: serverTimestamp(),
    })
  }

  const demoCandidates = [
    {
      id: 'demo-cand-1',
      name: 'David Chen',
      email: 'david.c@dev.io',
      currentRole: 'Senior Frontend Engineer',
      yearsExperience: 6,
      skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'Figma'],
      bio: 'Led frontend infra at a 50-person Series B startup.',
      githubConnected: true,
      leetcodeConnected: true,
      tokens: 3,
    },
    {
      id: 'demo-cand-2',
      name: 'Sarah Jenkins',
      email: 's.jenkins@sys.dev',
      currentRole: 'Backend Engineer',
      yearsExperience: 4,
      skills: ['Go', 'Python', 'Kafka', 'PostgreSQL', 'AWS'],
      bio: 'Backend engineer with 4 years in distributed systems.',
      githubConnected: true,
      leetcodeConnected: true,
      tokens: 2,
    },
    {
      id: 'demo-cand-3',
      name: 'Marcus Silva',
      email: 'marcus@silva.net',
      currentRole: 'Full-Stack Engineer',
      yearsExperience: 2,
      skills: ['React', 'Rails', 'PostgreSQL', 'Redis', 'Docker'],
      bio: 'Full-stack generalist with 2 years at a YC company.',
      githubConnected: true,
      leetcodeConnected: false,
      tokens: 3,
    },
  ]

  for (const cand of demoCandidates) {
    const { id, ...data } = cand
    await setDoc(doc(db, 'candidateProfiles', id), {
      uid: id,
      ...data,
      location: '',
      lookingFor: '',
      tokenResetDate: new Date(Date.now() + 30 * 86400000),
      createdAt: serverTimestamp(),
    })
  }

  await setDoc(doc(db, '_meta', 'seeded'), { seededAt: serverTimestamp() })
  return true
}

export async function seedDemoDataForCandidate(candidateUid) {
  const activityItems = [
    { type: 'view',     text: 'Your profile was viewed by a referrer' },
    { type: 'match',    text: 'New high-confidence match found — 91%' },
    { type: 'token',    text: 'Monthly tokens reset — 3 available' },
  ]

  for (const item of activityItems) {
    await addDoc(collection(db, 'activity'), {
      userId: candidateUid,
      type: item.type,
      text: item.text,
      createdAt: serverTimestamp(),
    })
  }
}

export async function seedDemoDataForEmployee(employeeUid) {
  const pipelineItems = [
    { candidateAlias: 'Candidate #F4A1', candidateName: 'Elena Rostova', role: 'Staff Engineer',     match: 88, status: 'hired',          stage: 4, bounty: 4200 },
    { candidateAlias: 'Candidate #G2C3', candidateName: 'James Kim',     role: 'Senior Backend',      match: 71, status: 'offer_extended', stage: 3, bounty: 2800 },
    { candidateAlias: 'Candidate #H9B7', candidateName: 'Priya Patel',   role: 'Frontend Engineer',   match: 65, status: 'interviewing',   stage: 2, bounty: 1500 },
    { candidateAlias: 'Candidate #K2M8', candidateName: 'Leo Marsh',     role: 'DevOps Engineer',     match: 55, status: 'declined',        stage: 1, bounty: 0    },
  ]

  for (const item of pipelineItems) {
    await addDoc(collection(db, 'pipeline'), {
      employeeId: employeeUid,
      candidateId: `demo-pipeline-${item.candidateAlias}`,
      ...item,
      createdAt: serverTimestamp(),
    })
  }
}
