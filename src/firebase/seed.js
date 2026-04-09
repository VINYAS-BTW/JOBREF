import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config'

const DEMO_EMPLOYEES = [
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
    name: 'Alex Rivera',
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
    name: 'Jordan Lee',
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
    name: 'Sam Okonkwo',
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
    name: 'Taylor Morgan',
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
    name: 'Riley Chen',
    email: 'emp5@demo.refhire.io',
  },
  {
    id: 'demo-emp-6',
    alias: 'ML Eng @ Applied AI',
    company: 'Applied AI Labs',
    companyTier: 'Series-A',
    stack: ['Python', 'PyTorch', 'Ray'],
    activeReqs: ['ML Engineer', 'Research Engineer'],
    reputation: 4.5,
    totalRefs: 11,
    totalBounty: 2900,
    pendingBounty: 900,
    visibleAs: 'ML Eng @ Applied AI',
    name: 'Casey Nguyen',
    email: 'emp6@demo.refhire.io',
  },
  {
    id: 'demo-emp-7',
    alias: 'Security @ Enterprise SaaS',
    company: 'SecureCloud',
    companyTier: 'Enterprise',
    stack: ['Rust', 'AWS', 'K8s'],
    activeReqs: ['Security Engineer'],
    reputation: 4.4,
    totalRefs: 9,
    totalBounty: 2400,
    pendingBounty: 600,
    visibleAs: 'Security @ Enterprise SaaS',
    name: 'Morgan Blake',
    email: 'emp7@demo.refhire.io',
  },
  {
    id: 'demo-emp-8',
    alias: 'Mobile Lead @ Consumer App',
    company: 'Pulse Mobile',
    companyTier: 'Series-C',
    stack: ['Swift', 'Kotlin', 'GraphQL'],
    activeReqs: ['iOS Engineer', 'Android Engineer'],
    reputation: 4.55,
    totalRefs: 16,
    totalBounty: 4100,
    pendingBounty: 1500,
    visibleAs: 'Mobile Lead @ Consumer App',
    name: 'Jamie Patel',
    email: 'emp8@demo.refhire.io',
  },
  {
    id: 'demo-emp-9',
    alias: 'Data Platform @ Growth Co',
    company: 'Growth Co',
    companyTier: 'Series-B',
    stack: ['Spark', 'dbt', 'Snowflake'],
    activeReqs: ['Data Engineer'],
    reputation: 4.35,
    totalRefs: 13,
    totalBounty: 3300,
    pendingBounty: 1100,
    visibleAs: 'Data Platform @ Growth Co',
    name: 'Quinn Foster',
    email: 'emp9@demo.refhire.io',
  },
  {
    id: 'demo-emp-10',
    alias: 'Product Eng @ Marketplace',
    company: 'Marketplace Inc',
    companyTier: 'Public',
    stack: ['React', 'Go', 'Postgres'],
    activeReqs: ['Full-Stack Engineer'],
    reputation: 4.62,
    totalRefs: 18,
    totalBounty: 4700,
    pendingBounty: 2000,
    visibleAs: 'Product Eng @ Marketplace',
    name: 'Drew Alvarez',
    email: 'emp10@demo.refhire.io',
  },
]

const DEMO_CANDIDATES = [
  { id: 'demo-cand-1', name: 'David Chen', email: 'david.c@dev.io', currentRole: 'Senior Frontend Engineer', yearsExperience: 6, skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'Figma'], bio: 'Led frontend infra at a 50-person Series B startup.', githubConnected: true, leetcodeConnected: true, tokens: 3 },
  { id: 'demo-cand-2', name: 'Sarah Jenkins', email: 's.jenkins@sys.dev', currentRole: 'Backend Engineer', yearsExperience: 4, skills: ['Go', 'Python', 'Kafka', 'PostgreSQL', 'AWS'], bio: 'Backend engineer with 4 years in distributed systems.', githubConnected: true, leetcodeConnected: true, tokens: 2 },
  { id: 'demo-cand-3', name: 'Marcus Silva', email: 'marcus@silva.net', currentRole: 'Full-Stack Engineer', yearsExperience: 2, skills: ['React', 'Rails', 'PostgreSQL', 'Redis', 'Docker'], bio: 'Full-stack generalist with 2 years at a YC company.', githubConnected: true, leetcodeConnected: false, tokens: 3 },
  { id: 'demo-cand-4', name: 'Elena Rostova', email: 'elena.r@dev.io', currentRole: 'Staff Engineer', yearsExperience: 8, skills: ['Go', 'gRPC', 'K8s', 'AWS'], bio: 'Platform and reliability focus.', githubConnected: true, leetcodeConnected: true, tokens: 3 },
  { id: 'demo-cand-5', name: 'James Kim', email: 'j.kim@sys.dev', currentRole: 'Senior Backend Engineer', yearsExperience: 5, skills: ['Java', 'Spring', 'Kafka', 'Postgres'], bio: 'High-throughput services.', githubConnected: true, leetcodeConnected: false, tokens: 2 },
  { id: 'demo-cand-6', name: 'Priya Patel', email: 'priya.p@fe.io', currentRole: 'Frontend Engineer', yearsExperience: 3, skills: ['React', 'TypeScript', 'CSS', 'Jest'], bio: 'Design systems and performance.', githubConnected: true, leetcodeConnected: true, tokens: 3 },
  { id: 'demo-cand-7', name: 'Leo Marsh', email: 'leo.m@ops.dev', currentRole: 'DevOps Engineer', yearsExperience: 4, skills: ['Terraform', 'AWS', 'Go', 'K8s'], bio: 'SRE-minded builder.', githubConnected: true, leetcodeConnected: false, tokens: 2 },
  { id: 'demo-cand-8', name: 'Nina Brooks', email: 'nina.b@data.io', currentRole: 'Data Engineer', yearsExperience: 5, skills: ['Python', 'Spark', 'Airflow', 'Snowflake'], bio: 'Pipelines and analytics.', githubConnected: false, leetcodeConnected: false, tokens: 3 },
  { id: 'demo-cand-9', name: 'Omar Haddad', email: 'omar.h@sec.io', currentRole: 'Security Engineer', yearsExperience: 6, skills: ['Rust', 'AWS', 'Threat modeling'], bio: 'AppSec and cloud security.', githubConnected: true, leetcodeConnected: false, tokens: 2 },
  { id: 'demo-cand-10', name: 'Hannah Wu', email: 'hannah.w@ml.io', currentRole: 'ML Engineer', yearsExperience: 4, skills: ['Python', 'PyTorch', 'CUDA'], bio: 'Model training and serving.', githubConnected: true, leetcodeConnected: true, tokens: 3 },
  { id: 'demo-cand-11', name: 'Chris Vaughn', email: 'chris.v@mobile.io', currentRole: 'iOS Engineer', yearsExperience: 3, skills: ['Swift', 'SwiftUI', 'Combine'], bio: 'Consumer mobile apps.', githubConnected: true, leetcodeConnected: false, tokens: 3 },
  { id: 'demo-cand-12', name: 'Ava Thompson', email: 'ava.t@android.io', currentRole: 'Android Engineer', yearsExperience: 3, skills: ['Kotlin', 'Jetpack', 'Compose'], bio: 'Play Store featured apps.', githubConnected: true, leetcodeConnected: false, tokens: 2 },
  { id: 'demo-cand-13', name: 'Noah Ibrahim', email: 'noah.i@fs.io', currentRole: 'Full-Stack Engineer', yearsExperience: 2, skills: ['Next.js', 'Node', 'Postgres'], bio: 'Early-stage startup experience.', githubConnected: true, leetcodeConnected: true, tokens: 3 },
  { id: 'demo-cand-14', name: 'Mia Santos', email: 'mia.s@pm.io', currentRole: 'Product Engineer', yearsExperience: 4, skills: ['React', 'Python', 'SQL'], bio: 'Shipping experiments quickly.', githubConnected: true, leetcodeConnected: false, tokens: 2 },
  { id: 'demo-cand-15', name: 'Ethan Cole', email: 'ethan.c@infra.io', currentRole: 'Platform Engineer', yearsExperience: 7, skills: ['Go', 'K8s', 'Istio'], bio: 'Service mesh and observability.', githubConnected: true, leetcodeConnected: true, tokens: 3 },
  { id: 'demo-cand-16', name: 'Zoe Martin', email: 'zoe.m@ux.io', currentRole: 'UI Engineer', yearsExperience: 3, skills: ['React', 'Figma', 'Storybook'], bio: 'Accessible UI systems.', githubConnected: true, leetcodeConnected: false, tokens: 3 },
  { id: 'demo-cand-17', name: 'Ben Carter', email: 'ben.c@api.io', currentRole: 'API Engineer', yearsExperience: 5, skills: ['Go', 'OpenAPI', 'Postgres'], bio: 'Public API design.', githubConnected: true, leetcodeConnected: true, tokens: 2 },
  { id: 'demo-cand-18', name: 'Lily Zhang', email: 'lily.z@db.io', currentRole: 'Database Engineer', yearsExperience: 6, skills: ['Postgres', 'Redis', 'Rust'], bio: 'Storage internals.', githubConnected: false, leetcodeConnected: false, tokens: 3 },
  { id: 'demo-cand-19', name: "Ryan O'Neil", email: 'ryan.o@edge.io', currentRole: 'Edge Engineer', yearsExperience: 4, skills: ['CDN', 'Rust', 'Wasm'], bio: 'Low-latency delivery.', githubConnected: true, leetcodeConnected: false, tokens: 2 },
  { id: 'demo-cand-20', name: 'Grace Adler', email: 'grace.a@qa.io', currentRole: 'Test Engineer', yearsExperience: 3, skills: ['Playwright', 'TypeScript', 'CI'], bio: 'Quality at speed.', githubConnected: true, leetcodeConnected: true, tokens: 3 },
]

const DEMO_JOBS = [
  { id: 'job-1', title: 'Senior Frontend Engineer', company: 'FinTech Corp' },
  { id: 'job-2', title: 'Staff Backend Engineer', company: 'SaaS Corp' },
  { id: 'job-3', title: 'Full-Stack Engineer', company: 'YC Startup' },
  { id: 'job-4', title: 'ML Engineer', company: 'Applied AI Labs' },
  { id: 'job-5', title: 'Security Engineer', company: 'SecureCloud' },
  { id: 'job-6', title: 'Mobile Engineer (iOS)', company: 'Pulse Mobile' },
  { id: 'job-7', title: 'Data Engineer', company: 'Growth Co' },
  { id: 'job-8', title: 'Platform Engineer', company: 'Marketplace Inc' },
]

/** Deterministic pipeline mix for hiring committee demo (30 rows). */
const REFERRAL_DEMO_SPECS = [
  ['requested', 62], ['approved', 71], ['interview', 78], ['hired', 88], ['rejected', 55],
  ['approved', 66], ['interview', 74], ['hired', 91], ['requested', 58], ['interview', 69],
  ['hired', 84], ['approved', 73], ['rejected', 52], ['interview', 77], ['requested', 64],
  ['hired', 89], ['approved', 68], ['interview', 72], ['rejected', 48], ['hired', 93],
  ['approved', 70], ['interview', 76], ['requested', 60], ['hired', 86], ['approved', 67],
  ['interview', 75], ['rejected', 54], ['hired', 90], ['interview', 79], ['approved', 65],
  ['requested', 59], ['hired', 92],
]

function seedKarmaForStatus(status) {
  if (status === 'interview') return 10
  if (status === 'hired') return 35
  return 0
}

export async function seedDemoEmployees() {
  const sentinel = await getDoc(doc(db, '_meta', 'seeded'))
  if (sentinel.exists()) return false

  for (const emp of DEMO_EMPLOYEES) {
    const { id, ...data } = emp
    await setDoc(doc(db, 'employeeProfiles', id), {
      uid: id,
      ...data,
      karmaScore: 0,
      successfulReferrals: 0,
      anonymousSince: serverTimestamp(),
      createdAt: serverTimestamp(),
    })
  }

  for (const cand of DEMO_CANDIDATES) {
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

/**
 * Jobs, referrals, and karma backfill for the hiring committee dashboard.
 * Safe to call on every hiring login; runs once per project.
 */
export async function seedHiringCommitteeDemo() {
  const flag = await getDoc(doc(db, '_meta', 'hiringCommitteeSeeded'))
  if (flag.exists()) return false

  for (const emp of DEMO_EMPLOYEES) {
    const { id, ...data } = emp
    await setDoc(
      doc(db, 'employeeProfiles', id),
      {
        uid: id,
        ...data,
        karmaScore: 0,
        successfulReferrals: 0,
        anonymousSince: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    )
  }

  for (const cand of DEMO_CANDIDATES) {
    const { id, ...data } = cand
    await setDoc(
      doc(db, 'candidateProfiles', id),
      {
        uid: id,
        ...data,
        location: '',
        lookingFor: '',
        tokenResetDate: new Date(Date.now() + 30 * 86400000),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    )
  }

  for (const job of DEMO_JOBS) {
    const { id, ...fields } = job
    await setDoc(doc(db, 'jobs', id), {
      ...fields,
      createdAt: serverTimestamp(),
    })
  }

  const empIds = DEMO_EMPLOYEES.map((e) => e.id)
  const candIds = DEMO_CANDIDATES.map((c) => c.id)
  const jobIds = DEMO_JOBS.map((j) => j.id)

  const karmaByEmp = Object.fromEntries(empIds.map((id) => [id, 0]))
  const hiresByEmp = Object.fromEntries(empIds.map((id) => [id, 0]))

  const batch = writeBatch(db)

  for (let i = 0; i < REFERRAL_DEMO_SPECS.length; i++) {
    const [status, matchScore] = REFERRAL_DEMO_SPECS[i]
    const employeeId = empIds[i % empIds.length]
    const candidateId = candIds[(i * 3) % candIds.length]
    const jobId = jobIds[i % jobIds.length]
    const ref = doc(db, 'referrals', `demo-referral-${i + 1}`)
    batch.set(ref, {
      candidateId,
      employeeId,
      jobId,
      status,
      matchScore,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    karmaByEmp[employeeId] += seedKarmaForStatus(status)
    if (status === 'hired') hiresByEmp[employeeId] += 1
  }

  await batch.commit()

  for (const empId of empIds) {
    await setDoc(
      doc(db, 'employeeProfiles', empId),
      {
        karmaScore: karmaByEmp[empId],
        successfulReferrals: hiresByEmp[empId],
      },
      { merge: true }
    )
  }

  const metrics = REFERRAL_DEMO_SPECS.reduce(
    (acc, [status]) => {
      acc.total += 1
      if (status === 'interview' || status === 'hired') acc.interviews += 1
      if (status === 'hired') acc.hires += 1
      return acc
    },
    { total: 0, interviews: 0, hires: 0 }
  )

  await setDoc(doc(db, 'dashboard_stats', 'main'), {
    totalReferrals: metrics.total,
    totalInterviews: metrics.interviews,
    totalHires: metrics.hires,
    hireConversion: metrics.total ? metrics.hires / metrics.total : 0,
    updatedAt: serverTimestamp(),
  })

  await setDoc(doc(db, '_meta', 'hiringCommitteeSeeded'), { seededAt: serverTimestamp() })
  return true
}

export async function seedDemoDataForCandidate(candidateUid) {
  const activityItems = [
    { type: 'view', text: 'Your profile was viewed by a referrer' },
    { type: 'match', text: 'New high-confidence match found — 91%' },
    { type: 'token', text: 'Monthly tokens reset — 3 available' },
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
    { candidateAlias: 'Candidate #F4A1', candidateName: 'Elena Rostova', role: 'Staff Engineer', match: 88, status: 'hired', stage: 4, bounty: 4200 },
    { candidateAlias: 'Candidate #G2C3', candidateName: 'James Kim', role: 'Senior Backend', match: 71, status: 'offer_extended', stage: 3, bounty: 2800 },
    { candidateAlias: 'Candidate #H9B7', candidateName: 'Priya Patel', role: 'Frontend Engineer', match: 65, status: 'interviewing', stage: 2, bounty: 1500 },
    { candidateAlias: 'Candidate #K2M8', candidateName: 'Leo Marsh', role: 'DevOps Engineer', match: 55, status: 'declined', stage: 1, bounty: 0 },
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
