// ─── AI Referral Simulator ───────────────────────────────────────────────────
// Predicts interview/hire probability, detects risks, generates explanations.
// Runs entirely client-side. Can be replaced with a FastAPI + OpenAI backend
// by swapping simulateReferral() to hit POST /simulate-referral instead.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Skill taxonomy for weighted matching ───────────────────────────────────

const CRITICAL_SKILLS = {
  'Senior Frontend Engineer':    ['react','typescript','javascript','css','nextjs','vue','angular'],
  'Senior Backend Engineer':     ['node','python','java','go','postgresql','mongodb','redis','graphql'],
  'Full Stack Engineer':         ['react','node','typescript','postgresql','mongodb','docker'],
  'Staff Software Engineer':     ['system design','distributed systems','kubernetes','aws','architecture'],
  'DevOps Engineer':             ['docker','kubernetes','terraform','aws','gcp','ci/cd','linux'],
  'ML Engineer':                 ['python','pytorch','tensorflow','ml','deep-learning','pandas'],
  'Data Engineer':               ['python','sql','spark','airflow','kafka','aws','dbt'],
  'Mobile Engineer':             ['react-native','flutter','swift','kotlin','ios','android'],
  'Frontend Engineer':           ['react','javascript','typescript','css','html','vue'],
  'Backend Engineer':            ['node','python','java','express','django','postgresql'],
  'Software Engineer':           ['javascript','python','react','node','sql','git'],
  'Platform Engineer':           ['kubernetes','docker','terraform','aws','linux','monitoring'],
  'Security Engineer':           ['security','linux','python','networking','aws','penetration-testing'],
  'Product Manager':             ['product','analytics','sql','a/b-testing','roadmap'],
  'Engineering Manager':         ['leadership','system-design','agile','architecture','mentoring'],
}

import { normalise, ensureArray } from './recommendationEngine'

function findCriticalSkills(targetRole) {
  const roleKey = Object.keys(CRITICAL_SKILLS).find(
    k => k.toLowerCase().includes(targetRole.toLowerCase()) ||
         targetRole.toLowerCase().includes(k.toLowerCase())
  )
  return roleKey ? CRITICAL_SKILLS[roleKey] : CRITICAL_SKILLS['Software Engineer']
}

// ─── Core scoring (matches spec section 3) ──────────────────────────────────

function computeSkillMatchScore(candidateSkills, requiredSkills) {
  const cArr = ensureArray(candidateSkills)
  const rArr = ensureArray(requiredSkills)
  if (!rArr.length) return 1
  const cSet = new Set(cArr.map(normalise))
  const matched = rArr.filter(s => cSet.has(normalise(s)))
  return matched.length / rArr.length
}

function computeExperienceScore(years) {
  const y = typeof years === 'string' ? parseInt(years) : (years || 0)
  return Math.min(y / 10, 1)
}

function computeGithubScore(candidateProfile) {
  let score = 0.3
  if (candidateProfile.githubConnected) score += 0.3
  const skillCount = candidateProfile.skills?.length || 0
  score += Math.min(skillCount / 10, 0.3) * 1
  if (candidateProfile.bio && candidateProfile.bio.length > 50) score += 0.1
  return Math.min(score, 1)
}

function computeCosineSimilarity(candidateSkills = [], employeeStack = []) {
  const cArr = ensureArray(candidateSkills).map(normalise)
  const eArr = ensureArray(employeeStack).map(normalise)
  const allSkills = [...new Set([...cArr, ...eArr])]

  if (allSkills.length === 0) return 0

  const vecA = allSkills.map(s => cArr.includes(s) ? 1 : 0)
  const vecB = allSkills.map(s => eArr.includes(s) ? 1 : 0)

  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < allSkills.length; i++) {
    dot  += vecA[i] * vecB[i]
    magA += vecA[i] * vecA[i]
    magB += vecB[i] * vecB[i]
  }

  const mag = Math.sqrt(magA) * Math.sqrt(magB)
  return mag === 0 ? 0 : dot / mag
}

// ─── Prediction mapping (spec section 4) ────────────────────────────────────

function mapPrediction(score) {
  if (score >= 0.8) {
    return { interviewProb: 0.825, hireProb: 0.50 }
  } else if (score >= 0.6) {
    return { interviewProb: 0.60, hireProb: 0.30 }
  } else if (score >= 0.4) {
    return { interviewProb: 0.35, hireProb: 0.125 }
  } else {
    return { interviewProb: 0.20, hireProb: 0.05 }
  }
}

// ─── Risk factor detection (spec section 5) ─────────────────────────────────

function detectRiskFactors(experienceScore, skillMatchScore, githubScore, candidateSkills, criticalSkills) {
  const risks = []

  if (experienceScore < 0.4) {
    risks.push({
      type: 'experience',
      severity: experienceScore < 0.2 ? 'high' : 'medium',
      label: 'Low experience',
      detail: `Only ${Math.round(experienceScore * 10)} years — role typically requires 4+ years`,
    })
  }

  if (skillMatchScore < 0.5) {
    risks.push({
      type: 'skills',
      severity: skillMatchScore < 0.3 ? 'high' : 'medium',
      label: 'Skill mismatch',
      detail: `Only ${Math.round(skillMatchScore * 100)}% of required skills matched`,
    })
  }

  if (githubScore < 0.3) {
    risks.push({
      type: 'proof',
      severity: 'medium',
      label: 'Low project proof',
      detail: 'Limited verifiable work artifacts (GitHub, portfolio)',
    })
  }

  const cSet = new Set(candidateSkills.map(normalise))
  const missingCritical = criticalSkills.filter(s => !cSet.has(normalise(s)))
  if (missingCritical.length > 0 && missingCritical.length <= 3) {
    missingCritical.forEach(skill => {
      risks.push({
        type: 'critical_skill',
        severity: 'high',
        label: `Missing critical skill: ${skill}`,
        detail: `This skill is commonly required for the target role`,
      })
    })
  } else if (missingCritical.length > 3) {
    risks.push({
      type: 'critical_skill',
      severity: 'high',
      label: `Missing ${missingCritical.length} critical skills`,
      detail: `Including: ${missingCritical.slice(0, 3).join(', ')}`,
    })
  }

  const cSkills = candidateSkills.map(normalise)
  const hasOnlyOneCategory = (() => {
    const categories = new Set()
    const catMap = {
      frontend: ['react','vue','angular','svelte','nextjs','css','html','tailwind'],
      backend: ['node','express','django','flask','spring','rails','fastapi'],
      infra: ['docker','kubernetes','aws','terraform','gcp','azure'],
    }
    for (const s of cSkills) {
      for (const [cat, keywords] of Object.entries(catMap)) {
        if (keywords.includes(s)) categories.add(cat)
      }
    }
    return categories.size <= 1 && cSkills.length > 2
  })()

  if (hasOnlyOneCategory) {
    risks.push({
      type: 'depth',
      severity: 'low',
      label: 'Narrow specialization',
      detail: 'Skills concentrated in a single domain — may limit versatility',
    })
  }

  return risks.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2)
  })
}

// ─── Explanation generation (spec section 6 — template-based) ────────────────

function generateExplanation({
  candidateProfile, targetRole, matchScore, experienceScore,
  skillMatchScore, githubScore, risks, criticalSkills, interviewProb, hireProb,
}) {
  const name = candidateProfile.name || 'This candidate'
  const years = candidateProfile.yearsExperience || 0
  const skills = candidateProfile.skills || []
  const cSet = new Set(skills.map(normalise))
  const matchedCritical = criticalSkills.filter(s => cSet.has(normalise(s)))
  const missingCritical = criticalSkills.filter(s => !cSet.has(normalise(s)))
  const pctScore = Math.round(matchScore * 100)

  let evaluation = ''
  if (matchScore >= 0.8) {
    evaluation = `${name} is an exceptionally strong candidate for the ${targetRole} role. With ${years} years of experience and deep coverage of the required stack, this referral carries a high probability of progressing to offer stage.`
  } else if (matchScore >= 0.6) {
    evaluation = `${name} shows solid alignment with the ${targetRole} role. There are some gaps to address, but the core competencies are present and the overall signal is positive.`
  } else if (matchScore >= 0.4) {
    evaluation = `${name} has partial overlap with the ${targetRole} requirements. The referral is possible but would benefit from addressing key skill gaps before proceeding.`
  } else {
    evaluation = `${name} has limited alignment with the ${targetRole} role at this time. The current skill set and experience level suggest this may not be the optimal match.`
  }

  const strengths = []
  if (experienceScore >= 0.7) strengths.push(`Strong experience (${years} years) well-suited for this seniority level`)
  if (matchedCritical.length >= 3) strengths.push(`Covers ${matchedCritical.length} of ${criticalSkills.length} critical skills: ${matchedCritical.slice(0, 4).join(', ')}`)
  if (githubScore >= 0.6) strengths.push('Solid proof-of-work signals from project/contribution activity')
  if (skills.length >= 6) strengths.push(`Broad skill set (${skills.length} technologies) indicates versatility`)
  if (candidateProfile.bio) strengths.push('Well-articulated professional summary')
  if (strengths.length === 0) strengths.push('Demonstrates foundational technical knowledge')

  const weaknesses = []
  if (missingCritical.length > 0) weaknesses.push(`Missing key skills: ${missingCritical.slice(0, 3).join(', ')}`)
  if (experienceScore < 0.4) weaknesses.push(`Limited experience (${years} years) for this level`)
  if (githubScore < 0.3) weaknesses.push('Weak verifiable project evidence')
  if (skills.length < 3) weaknesses.push('Narrow skill set may limit adaptability')
  if (weaknesses.length === 0) weaknesses.push('No major red flags detected')

  let suggestion = ''
  if (missingCritical.length > 0 && matchScore >= 0.5) {
    suggestion = `Consider asking the candidate about their experience with ${missingCritical[0]} during the initial screen — they may have unlisted exposure.`
  } else if (experienceScore < 0.4 && skillMatchScore >= 0.6) {
    suggestion = `Despite lower experience, the skill alignment is promising. A technical assessment could validate depth beyond years.`
  } else if (matchScore >= 0.7) {
    suggestion = `Strong signal — prioritize this candidate in the pipeline to avoid losing them to competing offers.`
  } else if (matchScore >= 0.4) {
    suggestion = `This candidate could be a fit for a more junior variant of the role, or could grow into it with mentorship.`
  } else {
    suggestion = `Consider holding this referral and revisiting if the candidate upskills in the missing areas.`
  }

  return { evaluation, strengths, weaknesses, suggestion }
}

// ─── Improvement simulation ─────────────────────────────────────────────────

export function simulateImprovement(currentResult, addedSkills = [], addedYears = 0) {
  const modifiedProfile = {
    ...currentResult._candidateProfile,
    skills: [...(currentResult._candidateProfile.skills || []), ...addedSkills],
    yearsExperience: (currentResult._candidateProfile.yearsExperience || 0) + addedYears,
  }

  return simulateReferral(modifiedProfile, currentResult._employeeProfile, currentResult._targetRole)
}

// ─── Main: simulateReferral ─────────────────────────────────────────────────

export function simulateReferral(candidateProfile, employeeProfile, targetRole) {
  if (!candidateProfile || !employeeProfile) return null

  const activeRole = targetRole || employeeProfile.activeReqs?.[0] || 'Software Engineer'
  const criticalSkills = findCriticalSkills(activeRole)
  const candidateSkills = candidateProfile.skills || []
  const employeeStack = employeeProfile.stack || []

  const cosineSim = computeCosineSimilarity(candidateSkills, employeeStack)
  const experienceScore = computeExperienceScore(candidateProfile.yearsExperience)
  const skillMatchScore = computeSkillMatchScore(candidateSkills, criticalSkills)
  const githubScore = computeGithubScore(candidateProfile)

  const matchScore = Math.min(1, Math.max(0,
    (0.5 * cosineSim) +
    (0.2 * experienceScore) +
    (0.2 * skillMatchScore) +
    (0.1 * githubScore)
  ))

  const { interviewProb, hireProb } = mapPrediction(matchScore)

  const risks = detectRiskFactors(
    experienceScore, skillMatchScore, githubScore,
    candidateSkills, criticalSkills,
  )

  const explanation = generateExplanation({
    candidateProfile, targetRole: activeRole, matchScore,
    experienceScore, skillMatchScore, githubScore,
    risks, criticalSkills, interviewProb, hireProb,
  })

  return {
    matchScore:           Math.round(matchScore * 100),
    interviewProbability: Math.round(interviewProb * 100),
    hireProbability:      Math.round(hireProb * 100),

    riskFactors: risks,

    explanation,

    factors: {
      cosineSimilarity: Math.round(cosineSim * 100),
      experienceScore:  Math.round(experienceScore * 100),
      skillMatchScore:  Math.round(skillMatchScore * 100),
      githubScore:      Math.round(githubScore * 100),
    },

    meta: {
      targetRole: activeRole,
      criticalSkills,
      candidateSkillCount: candidateSkills.length,
      matchedCritical: criticalSkills.filter(s => new Set(candidateSkills.map(normalise)).has(normalise(s))),
      missingCritical: criticalSkills.filter(s => !new Set(candidateSkills.map(normalise)).has(normalise(s))),
    },

    _candidateProfile: candidateProfile,
    _employeeProfile:  employeeProfile,
    _targetRole:       activeRole,
  }
}
