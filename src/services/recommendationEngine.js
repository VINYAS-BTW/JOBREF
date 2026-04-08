// ─── Recommendation Engine v2 ────────────────────────────────────────────────
// Multi-factor weighted scoring for candidate↔employee matching.
// Handles skill aliases, fuzzy matching, domain inference from stack,
// and sensible fallbacks for sparse profiles.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Skill alias resolution ─────────────────────────────────────────────────
// Maps every known variant to a single canonical form so "React.js", "ReactJS",
// and "react" all resolve to "react".

const SKILL_ALIASES = {
  'reactjs': 'react', 'react.js': 'react', 'react js': 'react',
  'vuejs': 'vue', 'vue.js': 'vue', 'vue js': 'vue', 'vue3': 'vue', 'vue2': 'vue',
  'angularjs': 'angular', 'angular.js': 'angular', 'angular2': 'angular',
  'nextjs': 'nextjs', 'next.js': 'nextjs', 'next js': 'nextjs',
  'nuxtjs': 'nuxt', 'nuxt.js': 'nuxt',
  'nodejs': 'node', 'node.js': 'node', 'node js': 'node',
  'expressjs': 'express', 'express.js': 'express',
  'nestjs': 'nestjs', 'nest.js': 'nestjs',
  'fastify.js': 'fastify',
  'tailwindcss': 'tailwind', 'tailwind css': 'tailwind', 'tailwind-css': 'tailwind',
  'material ui': 'material-ui', 'materialui': 'material-ui', 'mui': 'material-ui',
  'chakra': 'chakra-ui', 'chakra ui': 'chakra-ui',
  'styled components': 'styled-components', 'styledcomponents': 'styled-components',
  'framer motion': 'framer-motion', 'framermotion': 'framer-motion',
  'typescript': 'typescript', 'ts': 'typescript',
  'javascript': 'javascript', 'js': 'javascript', 'ecmascript': 'javascript', 'es6': 'javascript',
  'python3': 'python', 'py': 'python',
  'golang': 'go', 'go lang': 'go',
  'c++': 'cpp', 'cplusplus': 'cpp',
  'c#': 'csharp', 'c sharp': 'csharp',
  'ruby on rails': 'rails', 'ror': 'rails',
  'react native': 'react-native', 'reactnative': 'react-native', 'rn': 'react-native',
  'postgresql': 'postgresql', 'postgres': 'postgresql', 'pg': 'postgresql',
  'mongodb': 'mongodb', 'mongo': 'mongodb',
  'dynamodb': 'dynamodb', 'dynamo': 'dynamodb',
  'elasticsearch': 'elasticsearch', 'elastic': 'elasticsearch', 'es': 'elasticsearch',
  'scikit learn': 'scikit-learn', 'sklearn': 'scikit-learn',
  'tensorflow': 'tensorflow', 'tf': 'tensorflow',
  'pytorch': 'pytorch', 'torch': 'pytorch',
  'hugging face': 'huggingface', 'hugging-face': 'huggingface',
  'k8s': 'kubernetes', 'kube': 'kubernetes',
  'github actions': 'github-actions', 'gh actions': 'github-actions',
  'gitlab ci': 'gitlab-ci', 'gitlab-ci/cd': 'gitlab-ci',
  'ci/cd': 'cicd', 'ci cd': 'cicd',
  'amazon web services': 'aws',
  'google cloud': 'gcp', 'google cloud platform': 'gcp',
  'machine learning': 'ml', 'machine-learning': 'ml',
  'deep learning': 'deep-learning', 'dl': 'deep-learning',
  'natural language processing': 'nlp',
  'computer vision': 'computer-vision', 'cv': 'computer-vision',
  'data science': 'data-science',
  'graphql': 'graphql', 'gql': 'graphql',
  'rest api': 'rest', 'restful': 'rest', 'rest apis': 'rest',
  'asp.net': 'aspnet', 'asp net': 'aspnet', '.net': 'dotnet', 'dotnet': 'dotnet',
  'spring boot': 'spring-boot', 'springboot': 'spring-boot',
  'testing library': 'testing-library', 'react testing library': 'testing-library',
  'html5': 'html', 'html 5': 'html',
  'css3': 'css', 'css 3': 'css',
  'sass': 'sass', 'scss': 'sass',
}

function normalise(skill) {
  if (!skill) return ''
  const cleaned = skill.toLowerCase().trim().replace(/[()]/g, '')
  if (SKILL_ALIASES[cleaned]) return SKILL_ALIASES[cleaned]
  const dashed = cleaned.replace(/[\s.]+/g, '-')
  if (SKILL_ALIASES[dashed]) return SKILL_ALIASES[dashed]
  return dashed
}

function ensureArray(val) {
  if (Array.isArray(val)) return val
  if (typeof val === 'string' && val.trim()) return val.split(',').map(s => s.trim()).filter(Boolean)
  return []
}

// ─── Skill categories ───────────────────────────────────────────────────────

const SKILL_CATEGORIES = {
  frontend: new Set([
    'react','vue','angular','svelte','nextjs','nuxt','gatsby','remix',
    'html','css','tailwind','sass','bootstrap','material-ui','chakra-ui',
    'styled-components','framer-motion','webpack','vite','babel','eslint',
    'storybook','cypress','playwright','jest','testing-library',
  ]),
  backend: new Set([
    'node','express','nestjs','fastify','django','flask','fastapi',
    'spring','spring-boot','rails','laravel','phoenix','gin','fiber','echo',
    'aspnet','dotnet','graphql','rest','grpc','websocket','kafka','rabbitmq',
    'celery','sidekiq',
  ]),
  database: new Set([
    'postgresql','mysql','mongodb','redis','elasticsearch','firebase',
    'supabase','dynamodb','cassandra','neo4j','sqlite','prisma','sequelize',
    'typeorm','mongoose','drizzle',
  ]),
  devops: new Set([
    'docker','kubernetes','aws','gcp','azure','terraform','ansible','jenkins',
    'github-actions','gitlab-ci','circleci','nginx','linux','bash','shell',
    'prometheus','grafana','datadog','vercel','netlify','heroku','cloudflare',
    'cicd',
  ]),
  languages: new Set([
    'javascript','typescript','python','java','cpp','csharp','go','rust',
    'ruby','php','swift','kotlin','scala','r','dart','elixir','haskell',
    'perl','lua','sql',
  ]),
  ml: new Set([
    'tensorflow','pytorch','scikit-learn','keras','pandas','numpy',
    'jupyter','opencv','huggingface','langchain','llm','ml','ai',
    'deep-learning','nlp','computer-vision',
    'data-science','spark','hadoop','airflow','dbt',
  ]),
  mobile: new Set([
    'react-native','flutter','swift','swiftui','kotlin','android','ios',
    'expo','capacitor','ionic',
  ]),
}

function getSkillCategory(normSkill) {
  for (const [cat, set] of Object.entries(SKILL_CATEGORIES)) {
    if (set.has(normSkill)) return cat
  }
  return 'other'
}

// ─── Factor 1: Skill Match (40%) ────────────────────────────────────────────

function computeSkillScore(candidateSkills = [], employeeStack = []) {
  const cRaw = ensureArray(candidateSkills)
  const eRaw = ensureArray(employeeStack)

  if (!cRaw.length && !eRaw.length) return { score: 50, matched: [], missing: [], categoryOverlap: {} }
  if (!cRaw.length || !eRaw.length) return { score: 15, matched: [], missing: eRaw.map(normalise), categoryOverlap: {} }

  const cNorm = new Set(cRaw.map(normalise).filter(Boolean))
  const eNorm = new Set(eRaw.map(normalise).filter(Boolean))

  // Direct exact match (after alias resolution)
  const matched = [...cNorm].filter(s => eNorm.has(s))
  const missing = [...eNorm].filter(s => !cNorm.has(s))
  const directOverlap = eNorm.size > 0 ? matched.length / eNorm.size : 0

  // Category-level overlap (frontend↔frontend even with different frameworks)
  const cCats = {}
  const eCats = {}
  for (const s of cNorm) { const c = getSkillCategory(s); cCats[c] = (cCats[c] || 0) + 1 }
  for (const s of eNorm) { const c = getSkillCategory(s); eCats[c] = (eCats[c] || 0) + 1 }

  let catMatchScore = 0
  let catTotal = 0
  const categoryOverlap = {}
  for (const cat of Object.keys(eCats)) {
    if (cat === 'other') continue
    const eCount = eCats[cat]
    const cCount = cCats[cat] || 0
    const overlap = cCount > 0 ? Math.min(cCount / eCount, 1) : 0
    categoryOverlap[cat] = Math.round(overlap * 100)
    catMatchScore += overlap * eCount
    catTotal += eCount
  }
  const categoryScore = catTotal > 0 ? catMatchScore / catTotal : 0

  // Partial / fuzzy matching — catch near-misses
  let fuzzyBonus = 0
  for (const ms of missing) {
    for (const cs of cNorm) {
      if (cs.includes(ms) || ms.includes(cs)) { fuzzyBonus += 0.5; break }
      if (getSkillCategory(ms) === getSkillCategory(cs) && getSkillCategory(ms) !== 'other') {
        fuzzyBonus += 0.25; break
      }
    }
  }
  const fuzzyRate = eNorm.size > 0 ? Math.min(fuzzyBonus / eNorm.size, 0.3) : 0

  // Breadth bonus: candidate has wide skill set
  const breadthBonus = Math.min(cNorm.size / 12, 1) * 0.1

  const score = Math.round(
    Math.min(100, Math.max(0,
      (directOverlap * 0.50 + categoryScore * 0.30 + fuzzyRate * 0.10 + breadthBonus) * 100
    ))
  )

  return { score, matched, missing, categoryOverlap }
}

// ─── Factor 2: Domain / Role Fit (20%) ──────────────────────────────────────

const ROLE_KEYWORDS = {
  frontend:  ['frontend','front-end','front end','ui','ux','react','vue','angular','web developer'],
  backend:   ['backend','back-end','back end','server','api','microservice','infrastructure','node','django','flask'],
  fullstack: ['fullstack','full-stack','full stack','software engineer','swe','sde','developer'],
  mobile:    ['mobile','ios','android','react native','flutter','app developer'],
  devops:    ['devops','sre','platform','infrastructure','cloud','reliability','site reliability'],
  data:      ['data','ml','machine learning','ai','analytics','scientist','data engineer','deep learning'],
  security:  ['security','cybersecurity','infosec','pen test','appsec'],
}

const STACK_DOMAIN_MAP = {
  frontend: ['react','vue','angular','svelte','nextjs','nuxt','html','css','tailwind','framer-motion'],
  backend:  ['node','express','nestjs','django','flask','fastapi','spring','rails','graphql','rest','kafka'],
  mobile:   ['react-native','flutter','swift','kotlin','android','ios','expo'],
  devops:   ['docker','kubernetes','aws','gcp','azure','terraform','jenkins','github-actions','linux'],
  data:     ['tensorflow','pytorch','scikit-learn','pandas','numpy','spark','hadoop','ml','ai','data-science'],
  database: ['postgresql','mysql','mongodb','redis','elasticsearch','firebase','dynamodb','prisma'],
}

function extractRoleDomains(text) {
  if (!text) return new Set()
  const lower = text.toLowerCase()
  const domains = new Set()
  for (const [domain, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) domains.add(domain)
  }
  return domains
}

function inferDomainsFromStack(stack = []) {
  const norms = ensureArray(stack).map(normalise)
  const domains = new Set()
  for (const [domain, skills] of Object.entries(STACK_DOMAIN_MAP)) {
    const hits = skills.filter(s => norms.includes(s)).length
    if (hits >= 1) domains.add(domain)
  }
  return domains
}

function computeDomainScore(candidateProfile, employeeProfile) {
  const candidateDomains = new Set([
    ...extractRoleDomains(candidateProfile.lookingFor),
    ...extractRoleDomains(candidateProfile.currentRole),
    ...inferDomainsFromStack(candidateProfile.skills),
  ])

  const empActiveReqs = ensureArray(employeeProfile.activeReqs)
  const employeeDomains = new Set()

  if (empActiveReqs.length > 0) {
    for (const req of empActiveReqs) {
      for (const d of extractRoleDomains(req)) employeeDomains.add(d)
    }
  }
  // Infer from stack when activeReqs is empty or produced no domains
  if (employeeDomains.size === 0) {
    for (const d of inferDomainsFromStack(employeeProfile.stack)) employeeDomains.add(d)
  }

  if (candidateDomains.size === 0 && employeeDomains.size === 0) {
    return { score: 50, matchedRoles: [], insight: 'Domains not specified — neutral match' }
  }
  if (candidateDomains.size === 0 || employeeDomains.size === 0) {
    return { score: 40, matchedRoles: [], insight: 'Insufficient role data' }
  }

  const overlap = [...candidateDomains].filter(d => employeeDomains.has(d))
  const matchRate = overlap.length / Math.max(employeeDomains.size, 1)

  // Cross-domain affinity (fullstack counts as both frontend + backend)
  let affinityBonus = 0
  if (candidateDomains.has('fullstack') && (employeeDomains.has('frontend') || employeeDomains.has('backend'))) affinityBonus = 0.3
  if (employeeDomains.has('fullstack') && (candidateDomains.has('frontend') || candidateDomains.has('backend'))) affinityBonus = 0.3

  const matchedRoles = empActiveReqs.filter(req => {
    const reqDomains = extractRoleDomains(req)
    return [...reqDomains].some(d => candidateDomains.has(d))
  })

  const score = Math.round(Math.min(100, (matchRate + affinityBonus) * 100))
  const insight = matchedRoles.length > 0
    ? `Aligns with: ${matchedRoles.join(', ')}`
    : overlap.length > 0
      ? `Domain overlap: ${overlap.join(', ')}`
      : 'Low role overlap'

  return { score, matchedRoles, insight }
}

// ─── Factor 3: Experience Alignment (15%) ───────────────────────────────────

const SENIORITY_KEYWORDS = {
  junior:    { keywords: ['junior','jr','intern','entry','associate','graduate','trainee'], range: [0, 2] },
  mid:       { keywords: ['mid','intermediate','engineer ii','sde ii','swe ii','software engineer'], range: [2, 5] },
  senior:    { keywords: ['senior','sr','lead','principal','staff','architect','expert'], range: [5, 15] },
  executive: { keywords: ['director','vp','head of','cto','ceo','manager','head','chief'], range: [8, 30] },
}

function computeExperienceScore(candidateProfile, employeeProfile) {
  const years = typeof candidateProfile.yearsExperience === 'string'
    ? parseInt(candidateProfile.yearsExperience)
    : candidateProfile.yearsExperience

  if (!years && years !== 0) return { score: 50, insight: 'Experience not specified' }

  const empActiveReqs = ensureArray(employeeProfile.activeReqs)
  const reqText = empActiveReqs.join(' ').toLowerCase()

  let bestFit = null
  let matchedLevel = null

  for (const [level, { keywords, range }] of Object.entries(SENIORITY_KEYWORDS)) {
    if (keywords.some(kw => reqText.includes(kw))) {
      const [min, max] = range
      let fit
      if (years >= min && years <= max) fit = 1.0
      else if (years >= min - 1 && years <= max + 2) fit = 0.75
      else fit = Math.max(0.2, 1 - Math.abs(years - (min + max) / 2) / 10)

      if (bestFit === null || fit > bestFit) {
        bestFit = fit
        matchedLevel = level
      }
    }
  }

  if (bestFit !== null) {
    return {
      score: Math.round(bestFit * 100),
      insight: `${years} yrs — ${matchedLevel}-level fit (${Math.round(bestFit * 100)}%)`,
    }
  }

  // No seniority keywords found — use a smooth curve based on experience
  const experienceCurve = Math.min(years / 8, 1) * 0.6 + 0.35
  return {
    score: Math.round(experienceCurve * 100),
    insight: `${years} years of experience`,
  }
}

// ─── Factor 4: Referrer Credibility (15%) ───────────────────────────────────

function computeCredibilityScore(reputation = 3.5, totalRefs = 0) {
  const repNorm = (Math.min(reputation, 5) / 5) * 100
  const refNorm = Math.min(totalRefs / 15, 1) * 100
  const score = Math.round(repNorm * 0.55 + refNorm * 0.35 + 10)

  let tier = 'New Referrer'
  if (totalRefs >= 10 && reputation >= 4) tier = 'Top Referrer'
  else if (totalRefs >= 5 || reputation >= 3.5) tier = 'Active Referrer'
  else if (totalRefs >= 1) tier = 'Verified Referrer'

  return { score: Math.min(100, score), tier, reputation: Math.round(reputation * 10) / 10, totalRefs }
}

// ─── Factor 5: Activity Signal (10%) ────────────────────────────────────────

function computeActivityScore(profileData) {
  let signals = 0
  let maxSignals = 0

  const stack = ensureArray(profileData.stack)
  const activeReqs = ensureArray(profileData.activeReqs)
  const skills = ensureArray(profileData.skills)

  if (stack.length || skills.length) {
    signals += Math.min((stack.length + skills.length) / 8, 1)
    maxSignals++
  } else {
    maxSignals++
  }

  if (activeReqs.length) { signals += Math.min(activeReqs.length / 3, 1); maxSignals++ }
  else { maxSignals++ }

  if (profileData.bio) { signals += 0.5; maxSignals += 0.5 }
  if (profileData.currentRole || profileData.company) { signals += 0.5; maxSignals += 0.5 }

  const score = maxSignals > 0 ? Math.round((signals / maxSignals) * 100) : 30
  return { score: Math.max(15, score) }
}

// ─── Recommendation tier ────────────────────────────────────────────────────

function getTier(score) {
  if (score >= 85) return { label: 'Perfect Match', color: '#C8FF00', emoji: 'star' }
  if (score >= 70) return { label: 'Strong Match', color: '#34d399', emoji: 'fire' }
  if (score >= 50) return { label: 'Good Match', color: '#fbbf24', emoji: 'thumbsup' }
  if (score >= 30) return { label: 'Partial Match', color: '#6B6966', emoji: 'wave' }
  return { label: 'Low Match', color: '#3D3B38', emoji: 'none' }
}

// ─── Main: Generate Recommendations (Candidate → Employees) ─────────────────

const WEIGHTS = {
  skill:      0.40,
  domain:     0.20,
  experience: 0.15,
  credibility:0.15,
  activity:   0.10,
}

export function generateRecommendations(candidateProfile, employees, existingRequests = []) {
  if (!candidateProfile) return []

  const requestedIds = new Set(existingRequests.map(r => r.employeeId))

  const recommendations = employees
    .filter(emp => emp.uid !== candidateProfile.uid && emp.id !== candidateProfile.id)
    .map(emp => {
      const skill = computeSkillScore(candidateProfile.skills, emp.stack)
      const domain = computeDomainScore(candidateProfile, emp)
      const experience = computeExperienceScore(candidateProfile, emp)
      const credibility = computeCredibilityScore(emp.reputation, emp.totalRefs)
      const activity = computeActivityScore(emp)

      const rawScore =
        skill.score      * WEIGHTS.skill +
        domain.score     * WEIGHTS.domain +
        experience.score * WEIGHTS.experience +
        credibility.score* WEIGHTS.credibility +
        activity.score   * WEIGHTS.activity

      const aiScore = Math.round(Math.min(99, Math.max(5, rawScore)))
      const tier = getTier(aiScore)

      return {
        id:        emp.id,
        alias:     emp.alias || emp.visibleAs || 'Anonymous Referrer',
        stack:     ensureArray(emp.stack),
        activeReqs: ensureArray(emp.activeReqs),
        companyTier: emp.companyTier || '',
        reputation: emp.reputation || 3.5,
        totalRefs:  emp.totalRefs || 0,
        requested:  requestedIds.has(emp.id),

        aiScore,
        tier,

        breakdown: {
          skill:       { ...skill, weight: WEIGHTS.skill },
          domain:      { ...domain, weight: WEIGHTS.domain },
          experience:  { ...experience, weight: WEIGHTS.experience },
          credibility: { ...credibility, weight: WEIGHTS.credibility },
          activity:    { ...activity, weight: WEIGHTS.activity },
        },

        matchedSkills: skill.matched.map(s => s.replace(/-/g, ' ')),
        missingSkills: skill.missing.slice(0, 6).map(s => s.replace(/-/g, ' ')),
        matchedRoles:  domain.matchedRoles,
      }
    })
    .sort((a, b) => b.aiScore - a.aiScore)

  return recommendations
}

// ─── Employer-side: Score candidates against employer's stack/roles ──────────

const EMP_WEIGHTS = {
  skill:       0.40,
  domain:      0.20,
  experience:  0.15,
  profileDepth:0.15,
  activity:    0.10,
}

function computeProfileDepthScore(candidateProfile) {
  let filled = 0
  const total = 7
  if (candidateProfile.name) filled++
  if (candidateProfile.email) filled++
  if (candidateProfile.currentRole) filled++
  if (candidateProfile.yearsExperience) filled++
  if (candidateProfile.location) filled++
  if (candidateProfile.bio) filled++
  if (ensureArray(candidateProfile.skills).length > 0) filled++

  const baseScore = (filled / total) * 65
  const skillBonus = Math.min(ensureArray(candidateProfile.skills).length / 6, 1) * 25
  const bioBonus = (candidateProfile.bio?.length || 0) > 40 ? 10 : 0

  return {
    score: Math.round(Math.min(100, baseScore + skillBonus + bioBonus)),
    filled,
    total,
    insight: filled >= 6 ? 'Complete profile' : `${filled}/${total} fields filled`,
  }
}

function computeCandidateActivityScore(candidateProfile) {
  const skills = ensureArray(candidateProfile.skills)
  const hasBio = !!candidateProfile.bio
  const hasRole = !!candidateProfile.currentRole
  const hasLookingFor = !!candidateProfile.lookingFor

  let score = 0
  score += Math.min(skills.length / 6, 1) * 40
  score += hasBio ? 20 : 0
  score += hasRole ? 20 : 0
  score += hasLookingFor ? 20 : 0
  return { score: Math.round(Math.max(10, score)) }
}

export function scoreCandidate(candidateProfile, employeeProfile) {
  if (!candidateProfile || !employeeProfile) return null

  const skill = computeSkillScore(candidateProfile.skills, employeeProfile.stack)
  const domain = computeDomainScore(candidateProfile, employeeProfile)
  const experience = computeExperienceScore(candidateProfile, employeeProfile)
  const profileDepth = computeProfileDepthScore(candidateProfile)
  const activity = computeCandidateActivityScore(candidateProfile)

  const rawScore =
    skill.score       * EMP_WEIGHTS.skill +
    domain.score      * EMP_WEIGHTS.domain +
    experience.score  * EMP_WEIGHTS.experience +
    profileDepth.score* EMP_WEIGHTS.profileDepth +
    activity.score    * EMP_WEIGHTS.activity

  const aiScore = Math.round(Math.min(99, Math.max(5, rawScore)))
  const tier = getTier(aiScore)

  return {
    aiScore,
    tier,
    breakdown: {
      skill:       { ...skill, weight: EMP_WEIGHTS.skill },
      domain:      { ...domain, weight: EMP_WEIGHTS.domain },
      experience:  { ...experience, weight: EMP_WEIGHTS.experience },
      profileDepth:{ ...profileDepth, weight: EMP_WEIGHTS.profileDepth },
      activity:    { ...activity, weight: EMP_WEIGHTS.activity },
    },
    matchedSkills: skill.matched.map(s => s.replace(/-/g, ' ')),
    missingSkills: skill.missing.slice(0, 6).map(s => s.replace(/-/g, ' ')),
    matchedRoles:  domain.matchedRoles,
  }
}

export function generateEmployerRecommendations(employeeProfile, candidates) {
  if (!employeeProfile || !candidates.length) return []

  return candidates
    .filter(c => c.uid !== employeeProfile.uid && c.id !== employeeProfile.id)
    .map(cand => {
      const scoring = scoreCandidate(cand, employeeProfile)
      if (!scoring) return null

      const candidateIdShort = (cand.id || '').substring(0, 4).toUpperCase()

      return {
        id:             cand.id,
        uid:            cand.uid,
        alias:          `Candidate #${candidateIdShort}`,
        name:           cand.name || 'Unknown',
        email:          cand.email || '',
        skills:         ensureArray(cand.skills),
        currentRole:    cand.currentRole || '',
        yearsExperience:cand.yearsExperience,
        location:       cand.location || '',
        lookingFor:     cand.lookingFor || '',
        bio:            cand.bio || '',

        ...scoring,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.aiScore - a.aiScore)
}

export { WEIGHTS, EMP_WEIGHTS, getTier, normalise, ensureArray }
