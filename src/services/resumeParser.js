import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// ─── Known tech skills dictionary ───────────────────────────────────────────

const TECH_SKILLS = new Set([
  'javascript','typescript','python','java','c++','c#','go','golang','rust',
  'ruby','php','swift','kotlin','scala','r','matlab','perl','haskell','elixir',
  'dart','lua','shell','bash','powershell','sql','nosql','graphql','html','css',
  'sass','less','xml','json','yaml','markdown',
  'react','react.js','reactjs','react native','next.js','nextjs','vue','vue.js',
  'vuejs','angular','svelte','nuxt','nuxt.js','gatsby','remix','astro','solid',
  'solidjs','ember','backbone','jquery','bootstrap','tailwind','tailwindcss',
  'material ui','mui','chakra ui','ant design','styled-components','framer motion',
  'node.js','nodejs','node','express','express.js','fastify','nestjs','nest.js',
  'koa','hapi','django','flask','fastapi','spring','spring boot','springboot',
  'rails','ruby on rails','laravel','asp.net','.net','dotnet','gin','fiber','echo',
  'actix','rocket',
  'aws','amazon web services','gcp','google cloud','azure','heroku','vercel',
  'netlify','digitalocean','cloudflare','firebase','supabase',
  'docker','kubernetes','k8s','terraform','ansible','jenkins','ci/cd','github actions',
  'gitlab ci','circleci','travis ci','argo','helm','istio','prometheus','grafana',
  'datadog','new relic','elk','nginx','apache','caddy',
  'postgresql','postgres','mysql','mongodb','redis','elasticsearch','cassandra',
  'dynamodb','sqlite','mariadb','oracle','mssql','sql server','cockroachdb',
  'neo4j','couchdb','firestore','fauna','planetscale','supabase',
  'kafka','rabbitmq','sqs','sns','pubsub','celery','sidekiq','bull',
  'rest','rest api','restful','grpc','websocket','socket.io','apollo',
  'git','github','gitlab','bitbucket','svn','jira','confluence','notion',
  'linux','ubuntu','centos','macos','windows',
  'machine learning','ml','deep learning','nlp','computer vision','pytorch',
  'tensorflow','keras','scikit-learn','pandas','numpy','opencv','hugging face',
  'langchain','openai','llm',
  'figma','sketch','adobe xd','photoshop','illustrator','invision',
  'agile','scrum','kanban','tdd','bdd','ci/cd','devops','sre','microservices',
  'monolith','event-driven','serverless','api gateway','oauth','jwt','saml','sso',
  'unit testing','integration testing','e2e','jest','mocha','cypress','playwright',
  'selenium','puppeteer','vitest','pytest','junit','rspec',
  'webpack','vite','rollup','esbuild','parcel','babel','swc','turbopack',
  'storybook','chromatic',
  'redis','memcached','cdn','cloudfront','s3','ec2','lambda','ecs','fargate','rds',
  'aurora','bigquery','redshift','snowflake','databricks','airflow','dbt','spark',
  'hadoop','flink','tableau','power bi','looker','metabase',
  'android','ios','flutter','react native','xamarin','ionic','capacitor',
  'three.js','d3.js','d3','chart.js','mapbox','leaflet',
  'blockchain','solidity','ethereum','web3','smart contracts',
  'c','assembly','fortran','cobol','objective-c','groovy','clojure',
  'data structures','algorithms','system design','distributed systems',
  'design patterns','object-oriented','oop','functional programming',
])

const SKILL_ALIASES = {
  'js': 'JavaScript', 'ts': 'TypeScript', 'py': 'Python', 'rb': 'Ruby',
  'node': 'Node.js', 'react': 'React', 'vue': 'Vue.js', 'ng': 'Angular',
  'angular': 'Angular', 'k8s': 'Kubernetes', 'tf': 'Terraform',
  'aws': 'AWS', 'gcp': 'GCP', 'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL', 'mongo': 'MongoDB', 'mongodb': 'MongoDB',
  'mysql': 'MySQL', 'redis': 'Redis', 'docker': 'Docker',
  'kubernetes': 'Kubernetes', 'kafka': 'Kafka', 'golang': 'Go',
  'graphql': 'GraphQL', 'rest': 'REST', 'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS', 'next.js': 'Next.js', 'nextjs': 'Next.js',
  'express': 'Express.js', 'express.js': 'Express.js', 'fastapi': 'FastAPI',
  'django': 'Django', 'flask': 'Flask', 'spring boot': 'Spring Boot',
  'spring': 'Spring', 'firebase': 'Firebase', 'supabase': 'Supabase',
  'figma': 'Figma', 'git': 'Git', 'github': 'GitHub', 'linux': 'Linux',
  'jest': 'Jest', 'cypress': 'Cypress', 'pytorch': 'PyTorch',
  'tensorflow': 'TensorFlow', 'flutter': 'Flutter', 'swift': 'Swift',
  'kotlin': 'Kotlin', 'rust': 'Rust', 'scala': 'Scala',
  'elasticsearch': 'Elasticsearch', 'rabbitmq': 'RabbitMQ',
  'jenkins': 'Jenkins', 'terraform': 'Terraform',
  'typescript': 'TypeScript', 'javascript': 'JavaScript', 'python': 'Python',
  'java': 'Java', 'c++': 'C++', 'c#': 'C#', 'go': 'Go', 'ruby': 'Ruby',
  'php': 'PHP', 'html': 'HTML', 'css': 'CSS', 'sql': 'SQL',
  'react.js': 'React', 'reactjs': 'React', 'vue.js': 'Vue.js',
  'node.js': 'Node.js', 'nodejs': 'Node.js',
  'react native': 'React Native', 'svelte': 'Svelte',
  'vite': 'Vite', 'webpack': 'Webpack',
  'machine learning': 'Machine Learning', 'deep learning': 'Deep Learning',
  'microservices': 'Microservices', 'serverless': 'Serverless',
  'ci/cd': 'CI/CD', 'devops': 'DevOps', 'agile': 'Agile',
  'nosql': 'NoSQL', 'sass': 'Sass',
}

// ─── Section header patterns ────────────────────────────────────────────────

const SECTION_PATTERNS = {
  summary:    /^(?:summary|profile|about|about me|professional summary|career summary|objective|career objective)\s*:?\s*$/i,
  experience: /^(?:experience|work experience|professional experience|employment|employment history|work history|career history)\s*:?\s*$/i,
  education:  /^(?:education|academic|academics|qualifications|academic qualifications|educational background)\s*:?\s*$/i,
  skills:     /^(?:skills|technical skills|tech stack|technologies|core competencies|competencies|tools|tools & technologies|tools and technologies|proficiencies|expertise)\s*:?\s*$/i,
  projects:   /^(?:projects|personal projects|notable projects|side projects|key projects)\s*:?\s*$/i,
  certs:      /^(?:certifications|certificates|licenses|credentials|awards|achievements|honors)\s*:?\s*$/i,
}

// ─── PDF text extraction ────────────────────────────────────────────────────

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const lines = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    let currentLine = ''
    let lastY = null

    for (const item of content.items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 3) {
        if (currentLine.trim()) lines.push(currentLine.trim())
        currentLine = ''
      }
      currentLine += item.str
      lastY = item.transform[5]
    }
    if (currentLine.trim()) lines.push(currentLine.trim())
  }

  return lines
}

// ─── Section splitter ───────────────────────────────────────────────────────

function splitIntoSections(lines) {
  const sections = { header: [], summary: [], experience: [], education: [], skills: [], projects: [], certs: [], other: [] }
  let currentSection = 'header'

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    let matched = false
    for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(trimmed)) {
        currentSection = key
        matched = true
        break
      }
    }

    if (!matched) {
      sections[currentSection].push(trimmed)
    }
  }

  return sections
}

// ─── Extractors ─────────────────────────────────────────────────────────────

function extractEmail(lines) {
  const emailRe = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/
  for (const line of lines) {
    const m = line.match(emailRe)
    if (m) return m[0].toLowerCase()
  }
  return ''
}

function extractPhone(lines) {
  const phoneRe = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/
  for (const line of lines) {
    const m = line.match(phoneRe)
    if (m && m[0].replace(/\D/g, '').length >= 7) return m[0].trim()
  }
  return ''
}

function extractName(headerLines, email) {
  const emailPrefix = email ? email.split('@')[0] : ''

  for (const line of headerLines) {
    const clean = line.trim()
    if (!clean || clean.length < 2 || clean.length > 60) continue
    if (/@/.test(clean)) continue
    if (/^[\d(+]/.test(clean)) continue
    if (/^https?:\/\//.test(clean)) continue
    if (/linkedin|github|portfolio|website|http|www\./i.test(clean)) continue
    if (/^\d{5,}/.test(clean)) continue

    const words = clean.split(/\s+/).filter(w => w.length > 0)
    if (words.length >= 1 && words.length <= 5) {
      const allCap = words.every(w => /^[A-Z][a-zA-Z'-]*\.?$/.test(w) || /^[A-Z]+$/.test(w))
      if (allCap || words.length <= 3) {
        return clean.split(/\s+/).map(w =>
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' ')
      }
    }
  }

  return ''
}

function extractLocation(lines) {
  const locRe = /(?:^|[,|·•\-])\s*([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/
  const cityStateRe = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*,\s*([A-Z]{2})\b/
  const cityCountryRe = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*,\s*(India|USA|US|UK|Canada|Australia|Germany|Singapore|UAE|Netherlands|Ireland|Japan|France|Spain|Italy|Brazil|China|South Korea|Israel|Sweden|Switzerland|Denmark|Norway|Finland|New Zealand)/i

  for (const line of lines.slice(0, 15)) {
    const m1 = line.match(cityCountryRe)
    if (m1) return `${m1[1]}, ${m1[2]}`
    const m2 = line.match(cityStateRe)
    if (m2) return `${m2[1]}, ${m2[2]}`
    const m3 = line.match(locRe)
    if (m3) return m3[1].trim()
  }
  return ''
}

function extractSkills(sections, allLines) {
  const found = new Map()

  const addSkill = (raw) => {
    const lower = raw.toLowerCase().trim()
    if (lower.length < 1 || lower.length > 30) return
    if (TECH_SKILLS.has(lower) || SKILL_ALIASES[lower]) {
      const canonical = SKILL_ALIASES[lower] || raw.trim()
      const key = canonical.toLowerCase()
      if (!found.has(key)) found.set(key, canonical)
    }
  }

  const skillLines = sections.skills.length > 0 ? sections.skills : []
  for (const line of skillLines) {
    const tokens = line.split(/[,;|•·►▸▹→➤✓\-/\\]|\band\b/i)
    for (const token of tokens) {
      addSkill(token)
      const subTokens = token.trim().split(/\s{2,}/)
      for (const sub of subTokens) addSkill(sub)
    }
  }

  const fullText = allLines.join(' ')
  const wordBoundary = (s) => new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  for (const skill of TECH_SKILLS) {
    if (found.has(skill)) continue
    if (skill.length < 2) continue
    try {
      if (wordBoundary(skill).test(fullText)) {
        addSkill(skill)
      }
    } catch { /* skip invalid regex */ }
  }

  return [...found.values()].slice(0, 25)
}

function extractExperience(experienceLines) {
  const dateRangeRe = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(\d{4})\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(\d{4}|present|current|now)/gi

  let earliestYear = Infinity
  let latestYear = new Date().getFullYear()
  let currentRole = ''
  let firstRoleFound = false

  const titlePatterns = [
    /^((?:senior|sr\.?|junior|jr\.?|lead|principal|staff|chief|head|vp|director|manager|associate|intern)\s+)?(?:software|frontend|front-end|backend|back-end|full[\s-]?stack|web|mobile|devops|cloud|data|ml|ai|platform|systems?|site reliability|sre|qa|quality|test|security|network|database|infrastructure|product|project|program|technical|tech|engineering|ux|ui)\s*(?:engineer|developer|architect|analyst|scientist|manager|lead|consultant|designer|specialist|administrator|admin|ops)/i,
    /^(?:sde|swe|se)\s*[-–]?\s*(?:i{1,3}|[123]|intern)?/i,
    /^cto|ceo|vp of engineering|head of engineering|tech lead|team lead|engineering manager/i,
  ]

  for (let i = 0; i < experienceLines.length; i++) {
    const line = experienceLines[i]

    if (!firstRoleFound) {
      for (const pattern of titlePatterns) {
        const m = line.match(pattern)
        if (m) {
          currentRole = line.trim()
          if (currentRole.length > 50) currentRole = m[0]
          firstRoleFound = true
          break
        }
      }
    }

    let match
    const re = new RegExp(dateRangeRe.source, 'gi')
    while ((match = re.exec(line)) !== null) {
      const startYear = parseInt(match[1])
      const endStr = match[2].toLowerCase()
      const endYear = (endStr === 'present' || endStr === 'current' || endStr === 'now')
        ? new Date().getFullYear()
        : parseInt(match[2])

      if (startYear > 1970 && startYear <= new Date().getFullYear()) {
        earliestYear = Math.min(earliestYear, startYear)
      }
      if (endYear > 1970 && endYear <= new Date().getFullYear()) {
        latestYear = Math.max(latestYear, endYear)
      }
    }
  }

  const yearsExperience = earliestYear < Infinity
    ? Math.max(0, latestYear - earliestYear)
    : 0

  return { currentRole, yearsExperience }
}

function extractSummary(summaryLines) {
  if (summaryLines.length === 0) return ''
  return summaryLines.slice(0, 4).join(' ').substring(0, 300)
}

function inferLookingFor(skills, currentRole) {
  const domains = []
  const skillSet = new Set(skills.map(s => s.toLowerCase()))

  if (skillSet.has('react') || skillSet.has('vue.js') || skillSet.has('angular') || skillSet.has('svelte'))
    domains.push('Frontend')
  if (skillSet.has('node.js') || skillSet.has('django') || skillSet.has('spring') || skillSet.has('fastapi'))
    domains.push('Backend')
  if (skillSet.has('aws') || skillSet.has('gcp') || skillSet.has('azure') || skillSet.has('kubernetes'))
    domains.push('Cloud / DevOps')
  if (skillSet.has('machine learning') || skillSet.has('pytorch') || skillSet.has('tensorflow'))
    domains.push('ML / AI')
  if (skillSet.has('flutter') || skillSet.has('react native') || skillSet.has('swift') || skillSet.has('kotlin'))
    domains.push('Mobile')
  if (skillSet.has('postgresql') || skillSet.has('mongodb') || skillSet.has('kafka') || skillSet.has('elasticsearch'))
    domains.push('Data / Infrastructure')

  return domains.length > 0 ? domains.join(', ') : ''
}

// ─── Main parser ────────────────────────────────────────────────────────────

export async function parseResume(file) {
  const lines = await extractTextFromPDF(file)
  if (lines.length === 0) {
    throw new Error('Could not extract any text from this PDF. Make sure it is not a scanned image.')
  }

  const sections = splitIntoSections(lines)

  const email   = extractEmail(lines)
  const name    = extractName(sections.header, email)
  const phone   = extractPhone(lines)
  const location = extractLocation(lines)
  const skills  = extractSkills(sections, lines)
  const { currentRole, yearsExperience } = extractExperience(
    sections.experience.length > 0 ? sections.experience : lines
  )
  const bio      = extractSummary(sections.summary)
  const lookingFor = inferLookingFor(skills, currentRole)

  return {
    name:            name || '',
    email:           email || '',
    phone:           phone || '',
    currentRole:     currentRole || '',
    yearsExperience: yearsExperience || 0,
    location:        location || '',
    lookingFor:      lookingFor || '',
    skills:          skills,
    bio:             bio || '',
    rawLineCount:    lines.length,
    sectionsFound:   Object.entries(sections)
      .filter(([k, v]) => v.length > 0 && k !== 'header' && k !== 'other')
      .map(([k]) => k),
  }
}
