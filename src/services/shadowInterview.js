// ─── Shadow Interview: AI-Powered Pre-Referral Validation ───────────────────
// Generates personalized technical + behavioral questions, evaluates answers.
// Runs client-side. Swap generateQuestions/evaluateAnswers to hit a FastAPI
// backend (POST /shadow-interview/generate, /evaluate) for real LLM support.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Question pools by skill domain ─────────────────────────────────────────

const QUESTION_POOLS = {
  react: [
    { q: 'Explain the difference between useEffect cleanup and unmounting. When would cleanup run without the component unmounting?', tier: 'mid' },
    { q: 'How would you architect state management for a large dashboard with real-time data? Walk through your decision process.', tier: 'senior' },
    { q: 'Describe a performance bottleneck you encountered in a React app and how you resolved it.', tier: 'mid' },
    { q: 'What are React Server Components and how do they change the data-fetching paradigm?', tier: 'senior' },
    { q: 'How do you handle complex form state with validation across multiple steps? Describe your approach.', tier: 'mid' },
  ],
  javascript: [
    { q: 'Explain the event loop in JavaScript. How do microtasks and macrotasks differ in scheduling?', tier: 'mid' },
    { q: 'What are the trade-offs between Proxy-based reactivity and explicit setState patterns?', tier: 'senior' },
    { q: 'Describe how you would implement a debounce function. What edge cases would you handle?', tier: 'junior' },
    { q: 'How does prototypal inheritance work in JavaScript and when would you use it over class syntax?', tier: 'mid' },
  ],
  typescript: [
    { q: 'Explain the difference between type and interface in TypeScript. When would you choose one over the other?', tier: 'mid' },
    { q: 'How would you type a higher-order function that wraps any async function with retry logic?', tier: 'senior' },
    { q: 'What are conditional types and how have you used them to build flexible library APIs?', tier: 'senior' },
  ],
  node: [
    { q: 'How would you handle a memory leak in a long-running Node.js service? Describe your debugging process.', tier: 'senior' },
    { q: 'Explain the difference between worker threads and child processes in Node. When would you use each?', tier: 'mid' },
    { q: 'How do streams work in Node.js and when would you prefer them over loading data into memory?', tier: 'mid' },
  ],
  python: [
    { q: 'Explain the GIL in Python. How does it affect multi-threaded applications and what workarounds exist?', tier: 'senior' },
    { q: 'How would you design an ETL pipeline in Python for processing millions of records daily?', tier: 'senior' },
    { q: 'What are Python decorators and how would you implement one that caches function results with a TTL?', tier: 'mid' },
  ],
  sql: [
    { q: 'How would you optimize a slow query that joins 4+ tables with millions of rows? Walk through your approach.', tier: 'senior' },
    { q: 'Explain the difference between a clustered and non-clustered index. When would each be appropriate?', tier: 'mid' },
    { q: 'How do you handle database migrations in a zero-downtime deployment scenario?', tier: 'senior' },
  ],
  docker: [
    { q: 'Explain multi-stage Docker builds and how they reduce image size. Give a real-world example.', tier: 'mid' },
    { q: 'How would you debug a container that starts but immediately exits with no error logs?', tier: 'mid' },
  ],
  kubernetes: [
    { q: 'Explain how a Kubernetes pod gets scheduled and what happens when it fails a liveness probe.', tier: 'senior' },
    { q: 'How would you design a zero-downtime deployment strategy on Kubernetes?', tier: 'senior' },
  ],
  aws: [
    { q: 'Compare Lambda, ECS, and EKS for deploying microservices. What factors drive your choice?', tier: 'senior' },
    { q: 'How would you architect a system on AWS to handle 10x traffic spikes without pre-provisioning?', tier: 'senior' },
  ],
  system_design: [
    { q: 'Design a URL shortener that handles 100M redirects per day. Walk through your architecture choices.', tier: 'senior' },
    { q: 'How would you design a real-time notification system that scales to millions of concurrent users?', tier: 'senior' },
    { q: 'Design a rate limiter for an API gateway. What algorithm would you use and why?', tier: 'mid' },
  ],
  general_tech: [
    { q: 'What is your approach to writing maintainable code in a fast-moving team? Give specific examples.', tier: 'mid' },
    { q: 'Describe a time you had to make a significant technical trade-off. What did you choose and why?', tier: 'mid' },
    { q: 'How do you approach debugging a production issue you have never seen before?', tier: 'mid' },
    { q: 'Explain the CAP theorem and how it influenced a real architectural decision you made.', tier: 'senior' },
    { q: 'How do you decide between building a feature in-house versus using a third-party service?', tier: 'mid' },
  ],
}

const BEHAVIORAL_QUESTIONS = [
  { q: 'Tell me about a project where requirements changed significantly mid-development. How did you adapt?', focus: 'adaptability' },
  { q: 'Describe a time you had a disagreement with a teammate about a technical approach. How was it resolved?', focus: 'collaboration' },
  { q: 'Tell me about a time you had to deliver under tight deadlines. What trade-offs did you make?', focus: 'prioritization' },
  { q: 'Describe your most impactful contribution to a team. What made it significant?', focus: 'impact' },
  { q: 'How do you handle receiving critical feedback on your code or design decisions?', focus: 'growth' },
  { q: 'Tell me about a failure or mistake in your career. What did you learn from it?', focus: 'resilience' },
]

// ─── Skill-to-pool mapping ──────────────────────────────────────────────────

const SKILL_POOL_MAP = {
  'react': 'react', 'react.js': 'react', 'reactjs': 'react', 'nextjs': 'react', 'next.js': 'react',
  'vue': 'react', 'angular': 'react', 'svelte': 'react',
  'javascript': 'javascript', 'js': 'javascript',
  'typescript': 'typescript', 'ts': 'typescript',
  'node': 'node', 'node.js': 'node', 'nodejs': 'node', 'express': 'node', 'nestjs': 'node',
  'python': 'python', 'django': 'python', 'flask': 'python', 'fastapi': 'python',
  'sql': 'sql', 'postgresql': 'sql', 'mysql': 'sql', 'mongodb': 'sql',
  'docker': 'docker',
  'kubernetes': 'kubernetes', 'k8s': 'kubernetes',
  'aws': 'aws', 'gcp': 'aws', 'azure': 'aws', 'terraform': 'aws',
  'system design': 'system_design', 'distributed systems': 'system_design', 'architecture': 'system_design',
}

function mapSkillToPool(skill) {
  return SKILL_POOL_MAP[skill.toLowerCase().trim()] || null
}

// ─── Question generation ────────────────────────────────────────────────────

export function generateQuestions(candidateSkills = [], targetRole = '', yearsExperience = 0) {
  const tier = yearsExperience >= 5 ? 'senior' : yearsExperience >= 2 ? 'mid' : 'junior'

  const poolHits = new Map()
  for (const skill of candidateSkills) {
    const pool = mapSkillToPool(skill)
    if (pool && QUESTION_POOLS[pool]) {
      if (!poolHits.has(pool)) poolHits.set(pool, [])
      poolHits.get(pool).push(skill)
    }
  }

  const technicalQuestions = []
  const usedPools = new Set()

  const sortedPools = [...poolHits.entries()].sort((a, b) => b[1].length - a[1].length)

  for (const [pool] of sortedPools) {
    if (technicalQuestions.length >= 4) break
    const questions = QUESTION_POOLS[pool]
    const tiered = questions.filter(q => q.tier === tier || q.tier === 'mid')
    const available = tiered.length > 0 ? tiered : questions
    const pick = available[Math.floor(Math.random() * available.length)]
    if (pick && !usedPools.has(pool)) {
      technicalQuestions.push({
        text: pick.q,
        type: 'technical',
        domain: pool,
        tier: pick.tier,
      })
      usedPools.add(pool)
    }
  }

  while (technicalQuestions.length < 4) {
    const genPool = QUESTION_POOLS.general_tech
    const pick = genPool[Math.floor(Math.random() * genPool.length)]
    const already = technicalQuestions.some(q => q.text === pick.q)
    if (!already) {
      technicalQuestions.push({
        text: pick.q,
        type: 'technical',
        domain: 'general',
        tier: pick.tier,
      })
    }
    if (technicalQuestions.length >= 10) break
  }

  const behavioral = BEHAVIORAL_QUESTIONS[Math.floor(Math.random() * BEHAVIORAL_QUESTIONS.length)]

  const questions = [
    ...technicalQuestions.slice(0, 4),
    { text: behavioral.q, type: 'behavioral', domain: behavioral.focus, tier: 'any' },
  ]

  return {
    questions,
    meta: {
      targetRole,
      candidateSkillCount: candidateSkills.length,
      tier,
      poolsUsed: [...usedPools],
    },
  }
}

// ─── Answer evaluation ──────────────────────────────────────────────────────

const TECH_KEYWORDS = {
  react: ['component','hook','state','effect','render','virtual dom','reconciliation','memo','context','suspense','ssr','hydration','fiber'],
  javascript: ['closure','prototype','event loop','promise','async','callback','scope','hoisting','this','module','proxy','generator','symbol'],
  typescript: ['type','interface','generic','union','intersection','conditional','infer','mapped','utility','discriminated','strict','narrowing'],
  node: ['event loop','stream','buffer','cluster','worker','middleware','express','async','non-blocking','v8','libuv','module'],
  python: ['decorator','generator','comprehension','gil','asyncio','metaclass','descriptor','context manager','iterator','dunder','pip','virtual env'],
  sql: ['index','join','query plan','normalize','transaction','acid','deadlock','partition','sharding','replication','migration','view'],
  docker: ['image','container','layer','volume','network','compose','dockerfile','multi-stage','registry','orchestration'],
  kubernetes: ['pod','deployment','service','ingress','configmap','secret','namespace','helm','operator','hpa','probe','rollout'],
  aws: ['lambda','ec2','s3','rds','dynamodb','sqs','sns','cloudformation','iam','vpc','ecs','fargate','cdn','cloudfront'],
  system_design: ['scalability','availability','consistency','partition','cache','load balancer','message queue','database','api','microservice','cdn','sharding'],
  general: ['trade-off','architecture','pattern','testing','monitoring','ci/cd','documentation','refactor','performance','security','maintainability'],
  behavioral: ['team','collaborate','deadline','challenge','learn','feedback','communicate','adapt','prioritize','impact','failure','growth','resolve','conflict'],
}

function evaluateAnswer(answer, question) {
  if (!answer || answer.trim().length === 0) {
    return { technical: 0, communication: 0, confidence: 0, keywords: [], depth: 'empty' }
  }

  const text = answer.trim()
  const words = text.split(/\s+/)
  const sentences = text.split(/[.!?]+/).filter(Boolean)
  const lower = text.toLowerCase()

  const domain = question.domain || 'general'
  const relevantKeywords = [
    ...(TECH_KEYWORDS[domain] || []),
    ...(TECH_KEYWORDS.general || []),
    ...(question.type === 'behavioral' ? TECH_KEYWORDS.behavioral : []),
  ]

  const foundKeywords = relevantKeywords.filter(kw => lower.includes(kw))
  const keywordDensity = relevantKeywords.length > 0 ? foundKeywords.length / relevantKeywords.length : 0

  const hasExample = /for example|for instance|in my|i built|we implemented|at my|in production|real.?world|project/i.test(text)
  const hasNumbers = /\d+%|\d+ (users|requests|ms|seconds|million|thousand|times|commits)/i.test(text)
  const hasComparison = /compared to|versus|trade.?off|on the other hand|alternatively|however|whereas/i.test(text)
  const hasStructure = sentences.length >= 3

  let technical = 0
  technical += Math.min(keywordDensity * 60, 40)
  technical += hasExample ? 15 : 0
  technical += hasNumbers ? 10 : 0
  technical += hasComparison ? 10 : 0
  technical += Math.min(words.length / 150, 1) * 15
  technical += hasStructure ? 10 : 0
  technical = Math.round(Math.min(100, Math.max(0, technical)))

  let communication = 0
  const avgSentenceLen = words.length / Math.max(sentences.length, 1)
  communication += avgSentenceLen >= 8 && avgSentenceLen <= 25 ? 30 : avgSentenceLen > 25 ? 15 : 10
  communication += hasStructure ? 25 : sentences.length >= 2 ? 15 : 5
  communication += words.length >= 30 ? 20 : words.length >= 15 ? 10 : 0
  const hasTransitions = /first|second|then|next|finally|additionally|moreover|furthermore|because|therefore/i.test(text)
  communication += hasTransitions ? 15 : 0
  communication += text[0] === text[0]?.toUpperCase() ? 5 : 0
  communication += text.endsWith('.') || text.endsWith('!') ? 5 : 0
  communication = Math.round(Math.min(100, Math.max(0, communication)))

  let confidence = 0
  const hedging = /i think|maybe|probably|i guess|not sure|might be|could be|i believe/gi
  const hedgeCount = (text.match(hedging) || []).length
  confidence += Math.max(0, 30 - hedgeCount * 10)
  confidence += hasExample ? 25 : 0
  confidence += hasNumbers ? 15 : 0
  const assertive = /i implemented|i designed|i led|i built|we shipped|i chose|the key|the solution|the approach/i.test(text)
  confidence += assertive ? 20 : 0
  confidence += words.length >= 50 ? 10 : 0
  confidence = Math.round(Math.min(100, Math.max(0, confidence)))

  const depth = words.length >= 100 ? 'deep' : words.length >= 40 ? 'moderate' : words.length >= 15 ? 'surface' : 'minimal'

  return { technical, communication, confidence, keywords: foundKeywords, depth }
}

// ─── Full evaluation ────────────────────────────────────────────────────────

export function evaluateInterview(questions, answers) {
  const evals = questions.map((q, i) => ({
    question: q,
    answer: answers[i] || '',
    scores: evaluateAnswer(answers[i] || '', q),
  }))

  const techEvals = evals.filter(e => e.question.type === 'technical')
  const behavEval = evals.find(e => e.question.type === 'behavioral')

  const avgTech = techEvals.length > 0
    ? Math.round(techEvals.reduce((s, e) => s + e.scores.technical, 0) / techEvals.length)
    : 0

  const avgComm = evals.length > 0
    ? Math.round(evals.reduce((s, e) => s + e.scores.communication, 0) / evals.length)
    : 0

  const avgConf = evals.length > 0
    ? Math.round(evals.reduce((s, e) => s + e.scores.confidence, 0) / evals.length)
    : 0

  const behavioralScore = behavEval ? Math.round(
    (behavEval.scores.communication * 0.4) +
    (behavEval.scores.confidence * 0.4) +
    (behavEval.scores.technical * 0.2)
  ) : 50

  const overallScore = Math.round(
    (avgTech * 0.45) + (avgComm * 0.25) + (avgConf * 0.15) + (behavioralScore * 0.15)
  )

  const strengths = []
  const weaknesses = []

  if (avgTech >= 70) strengths.push('Strong technical depth across interview questions')
  else if (avgTech < 40) weaknesses.push('Technical answers lack sufficient depth and specificity')

  if (avgComm >= 70) strengths.push('Clear, well-structured communication style')
  else if (avgComm < 40) weaknesses.push('Answers could be more structured and articulate')

  if (avgConf >= 70) strengths.push('Confident delivery with concrete examples')
  else if (avgConf < 40) weaknesses.push('Responses show hesitancy — more assertive examples would help')

  if (behavioralScore >= 70) strengths.push('Strong behavioral signals — team-oriented mindset')
  else if (behavioralScore < 40) weaknesses.push('Behavioral response needs more specific, real-world examples')

  const deepAnswers = evals.filter(e => e.scores.depth === 'deep').length
  if (deepAnswers >= 3) strengths.push(`${deepAnswers} of ${evals.length} answers showed exceptional depth`)

  const weakAnswers = evals.filter(e => e.scores.depth === 'minimal' || e.scores.depth === 'surface').length
  if (weakAnswers >= 2) weaknesses.push(`${weakAnswers} answers were too brief — elaboration needed`)

  const topDomains = [...new Set(techEvals.filter(e => e.scores.technical >= 60).map(e => e.question.domain))].filter(d => d !== 'general')
  if (topDomains.length > 0) strengths.push(`Particularly strong in: ${topDomains.join(', ')}`)

  if (strengths.length === 0) strengths.push('Completed the interview — baseline engagement demonstrated')
  if (weaknesses.length === 0) weaknesses.push('No significant weaknesses detected')

  let recommendation, recColor
  if (overallScore >= 80) { recommendation = 'strong_yes'; recColor = '#C8FF00' }
  else if (overallScore >= 60) { recommendation = 'yes'; recColor = '#10B981' }
  else if (overallScore >= 40) { recommendation = 'maybe'; recColor = '#F59E0B' }
  else { recommendation = 'no'; recColor = '#EF4444' }

  const REC_LABELS = { strong_yes: 'Strong Yes', yes: 'Yes', maybe: 'Maybe', no: 'No' }

  let aiSummary = ''
  if (overallScore >= 80) {
    aiSummary = `Exceptional interview performance. The candidate demonstrated deep technical knowledge, communicated ideas clearly, and provided concrete examples from real-world experience. This is a high-confidence referral.`
  } else if (overallScore >= 60) {
    aiSummary = `Solid interview performance with good technical foundations. Some areas could be stronger, but the overall signal is positive. The candidate shows readiness for the role with minor gaps.`
  } else if (overallScore >= 40) {
    aiSummary = `Mixed interview performance. While the candidate shows some relevant knowledge, several answers lacked depth or specificity. Consider whether the gaps are addressable through onboarding.`
  } else {
    aiSummary = `Below-average interview performance. The answers suggest the candidate may not be fully prepared for the technical demands of this role at this time. Additional preparation is recommended.`
  }

  return {
    technicalScore: avgTech,
    communicationScore: avgComm,
    confidenceScore: avgConf,
    behavioralScore,
    overallScore,
    strengths,
    weaknesses,
    recommendation,
    recColor,
    recLabel: REC_LABELS[recommendation],
    aiSummary,
    perQuestion: evals.map(e => ({
      question: e.question.text,
      type: e.question.type,
      domain: e.question.domain,
      depth: e.scores.depth,
      techScore: e.scores.technical,
      commScore: e.scores.communication,
      confScore: e.scores.confidence,
      keywordsFound: e.scores.keywords.length,
    })),
  }
}
