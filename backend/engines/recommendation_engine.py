"""
Recommendation Engine v2 — Python port.
Multi-factor weighted scoring for candidate <-> employee matching.
Handles skill aliases, fuzzy matching, domain inference, scoring floors.
"""

from __future__ import annotations
import re
import math
from typing import Any

# ── Skill alias resolution ──────────────────────────────────────────────────

SKILL_ALIASES: dict[str, str] = {
    "reactjs": "react", "react.js": "react", "react js": "react",
    "vuejs": "vue", "vue.js": "vue", "vue js": "vue", "vue3": "vue", "vue2": "vue",
    "angularjs": "angular", "angular.js": "angular", "angular2": "angular",
    "nextjs": "nextjs", "next.js": "nextjs", "next js": "nextjs",
    "nuxtjs": "nuxt", "nuxt.js": "nuxt",
    "nodejs": "node", "node.js": "node", "node js": "node",
    "expressjs": "express", "express.js": "express",
    "nestjs": "nestjs", "nest.js": "nestjs",
    "fastify.js": "fastify",
    "tailwindcss": "tailwind", "tailwind css": "tailwind", "tailwind-css": "tailwind",
    "material ui": "material-ui", "materialui": "material-ui", "mui": "material-ui",
    "chakra": "chakra-ui", "chakra ui": "chakra-ui",
    "styled components": "styled-components", "styledcomponents": "styled-components",
    "framer motion": "framer-motion", "framermotion": "framer-motion",
    "typescript": "typescript", "ts": "typescript",
    "javascript": "javascript", "js": "javascript", "ecmascript": "javascript", "es6": "javascript",
    "python3": "python", "py": "python",
    "golang": "go", "go lang": "go",
    "c++": "cpp", "cplusplus": "cpp",
    "c#": "csharp", "c sharp": "csharp",
    "ruby on rails": "rails", "ror": "rails",
    "react native": "react-native", "reactnative": "react-native", "rn": "react-native",
    "postgresql": "postgresql", "postgres": "postgresql", "pg": "postgresql",
    "mongodb": "mongodb", "mongo": "mongodb",
    "dynamodb": "dynamodb", "dynamo": "dynamodb",
    "elasticsearch": "elasticsearch", "elastic": "elasticsearch",
    "scikit learn": "scikit-learn", "sklearn": "scikit-learn",
    "tensorflow": "tensorflow", "tf": "tensorflow",
    "pytorch": "pytorch", "torch": "pytorch",
    "hugging face": "huggingface", "hugging-face": "huggingface",
    "k8s": "kubernetes", "kube": "kubernetes",
    "github actions": "github-actions", "gh actions": "github-actions",
    "gitlab ci": "gitlab-ci", "gitlab-ci/cd": "gitlab-ci",
    "ci/cd": "cicd", "ci cd": "cicd",
    "amazon web services": "aws",
    "google cloud": "gcp", "google cloud platform": "gcp",
    "machine learning": "ml", "machine-learning": "ml",
    "deep learning": "deep-learning", "dl": "deep-learning",
    "natural language processing": "nlp",
    "computer vision": "computer-vision", "cv": "computer-vision",
    "data science": "data-science",
    "graphql": "graphql", "gql": "graphql",
    "rest api": "rest", "restful": "rest", "rest apis": "rest",
    "asp.net": "aspnet", "asp net": "aspnet", ".net": "dotnet", "dotnet": "dotnet",
    "spring boot": "spring-boot", "springboot": "spring-boot",
    "testing library": "testing-library", "react testing library": "testing-library",
    "html5": "html", "html 5": "html",
    "css3": "css", "css 3": "css",
    "sass": "sass", "scss": "sass",
}


def normalise(skill: str | None) -> str:
    if not skill:
        return ""
    cleaned = skill.lower().strip().replace("(", "").replace(")", "")
    if cleaned in SKILL_ALIASES:
        return SKILL_ALIASES[cleaned]
    dashed = re.sub(r"[\s.]+", "-", cleaned)
    if dashed in SKILL_ALIASES:
        return SKILL_ALIASES[dashed]
    return dashed


def ensure_array(val: Any) -> list[str]:
    if isinstance(val, list):
        return val
    if isinstance(val, str) and val.strip():
        return [s.strip() for s in val.split(",") if s.strip()]
    return []


# ── Skill categories ────────────────────────────────────────────────────────

SKILL_CATEGORIES: dict[str, set[str]] = {
    "frontend": {
        "react", "vue", "angular", "svelte", "nextjs", "nuxt", "gatsby", "remix",
        "html", "css", "tailwind", "sass", "bootstrap", "material-ui", "chakra-ui",
        "styled-components", "framer-motion", "webpack", "vite", "babel", "eslint",
        "storybook", "cypress", "playwright", "jest", "testing-library",
    },
    "backend": {
        "node", "express", "nestjs", "fastify", "django", "flask", "fastapi",
        "spring", "spring-boot", "rails", "laravel", "phoenix", "gin", "fiber", "echo",
        "aspnet", "dotnet", "graphql", "rest", "grpc", "websocket", "kafka", "rabbitmq",
        "celery", "sidekiq",
    },
    "database": {
        "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "firebase",
        "supabase", "dynamodb", "cassandra", "neo4j", "sqlite", "prisma", "sequelize",
        "typeorm", "mongoose", "drizzle",
    },
    "devops": {
        "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ansible", "jenkins",
        "github-actions", "gitlab-ci", "circleci", "nginx", "linux", "bash", "shell",
        "prometheus", "grafana", "datadog", "vercel", "netlify", "heroku", "cloudflare",
        "cicd",
    },
    "languages": {
        "javascript", "typescript", "python", "java", "cpp", "csharp", "go", "rust",
        "ruby", "php", "swift", "kotlin", "scala", "r", "dart", "elixir", "haskell",
        "perl", "lua", "sql",
    },
    "ml": {
        "tensorflow", "pytorch", "scikit-learn", "keras", "pandas", "numpy",
        "jupyter", "opencv", "huggingface", "langchain", "llm", "ml", "ai",
        "deep-learning", "nlp", "computer-vision",
        "data-science", "spark", "hadoop", "airflow", "dbt",
    },
    "mobile": {
        "react-native", "flutter", "swift", "swiftui", "kotlin", "android", "ios",
        "expo", "capacitor", "ionic",
    },
}


def get_skill_category(norm_skill: str) -> str:
    for cat, skills in SKILL_CATEGORIES.items():
        if norm_skill in skills:
            return cat
    return "other"


# ── Factor 1: Skill Match (40 %) ────────────────────────────────────────────

def compute_skill_score(
    candidate_skills: list[str] | str | None = None,
    employee_stack: list[str] | str | None = None,
) -> dict:
    c_raw = ensure_array(candidate_skills)
    e_raw = ensure_array(employee_stack)

    if not c_raw and not e_raw:
        return {"score": 50, "matched": [], "missing": [], "categoryOverlap": {}}
    if not c_raw or not e_raw:
        return {"score": 15, "matched": [], "missing": [normalise(s) for s in e_raw], "categoryOverlap": {}}

    c_norm = {normalise(s) for s in c_raw if normalise(s)}
    e_norm = {normalise(s) for s in e_raw if normalise(s)}

    matched = [s for s in c_norm if s in e_norm]
    missing = [s for s in e_norm if s not in c_norm]
    direct_overlap = len(matched) / len(e_norm) if e_norm else 0

    c_cats: dict[str, int] = {}
    e_cats: dict[str, int] = {}
    for s in c_norm:
        c = get_skill_category(s)
        c_cats[c] = c_cats.get(c, 0) + 1
    for s in e_norm:
        c = get_skill_category(s)
        e_cats[c] = e_cats.get(c, 0) + 1

    cat_match = 0.0
    cat_total = 0
    category_overlap: dict[str, int] = {}
    for cat, e_count in e_cats.items():
        if cat == "other":
            continue
        c_count = c_cats.get(cat, 0)
        overlap = min(c_count / e_count, 1.0) if c_count > 0 else 0.0
        category_overlap[cat] = round(overlap * 100)
        cat_match += overlap * e_count
        cat_total += e_count
    category_score = cat_match / cat_total if cat_total else 0.0

    fuzzy_bonus = 0.0
    for ms in missing:
        for cs in c_norm:
            if cs in ms or ms in cs:
                fuzzy_bonus += 0.5
                break
            if get_skill_category(ms) == get_skill_category(cs) and get_skill_category(ms) != "other":
                fuzzy_bonus += 0.25
                break
    fuzzy_rate = min(fuzzy_bonus / len(e_norm), 0.3) if e_norm else 0.0

    breadth_bonus = min(len(c_norm) / 12, 1.0) * 0.1

    score = round(min(100, max(0,
        (direct_overlap * 0.50 + category_score * 0.30 + fuzzy_rate * 0.10 + breadth_bonus) * 100
    )))

    return {"score": score, "matched": matched, "missing": missing, "categoryOverlap": category_overlap}


# ── Factor 2: Domain / Role Fit (20 %) ──────────────────────────────────────

ROLE_KEYWORDS: dict[str, list[str]] = {
    "frontend":  ["frontend", "front-end", "front end", "ui", "ux", "react", "vue", "angular", "web developer"],
    "backend":   ["backend", "back-end", "back end", "server", "api", "microservice", "infrastructure", "node", "django", "flask"],
    "fullstack": ["fullstack", "full-stack", "full stack", "software engineer", "swe", "sde", "developer"],
    "mobile":    ["mobile", "ios", "android", "react native", "flutter", "app developer"],
    "devops":    ["devops", "sre", "platform", "infrastructure", "cloud", "reliability", "site reliability"],
    "data":      ["data", "ml", "machine learning", "ai", "analytics", "scientist", "data engineer", "deep learning"],
    "security":  ["security", "cybersecurity", "infosec", "pen test", "appsec"],
}

STACK_DOMAIN_MAP: dict[str, list[str]] = {
    "frontend": ["react", "vue", "angular", "svelte", "nextjs", "nuxt", "html", "css", "tailwind", "framer-motion"],
    "backend":  ["node", "express", "nestjs", "django", "flask", "fastapi", "spring", "rails", "graphql", "rest", "kafka"],
    "mobile":   ["react-native", "flutter", "swift", "kotlin", "android", "ios", "expo"],
    "devops":   ["docker", "kubernetes", "aws", "gcp", "azure", "terraform", "jenkins", "github-actions", "linux"],
    "data":     ["tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "spark", "hadoop", "ml", "ai", "data-science"],
    "database": ["postgresql", "mysql", "mongodb", "redis", "elasticsearch", "firebase", "dynamodb", "prisma"],
}


def _extract_role_domains(text: str | None) -> set[str]:
    if not text:
        return set()
    lower = text.lower()
    return {domain for domain, kws in ROLE_KEYWORDS.items() if any(kw in lower for kw in kws)}


def _infer_domains_from_stack(stack: list[str] | str | None = None) -> set[str]:
    norms = [normalise(s) for s in ensure_array(stack)]
    domains: set[str] = set()
    for domain, skills in STACK_DOMAIN_MAP.items():
        if any(s in norms for s in skills):
            domains.add(domain)
    return domains


def compute_domain_score(candidate: dict, employee: dict) -> dict:
    c_domains = (
        _extract_role_domains(candidate.get("lookingFor"))
        | _extract_role_domains(candidate.get("currentRole"))
        | _infer_domains_from_stack(candidate.get("skills"))
    )

    emp_reqs = ensure_array(employee.get("activeReqs"))
    e_domains: set[str] = set()
    for req in emp_reqs:
        e_domains |= _extract_role_domains(req)
    if not e_domains:
        e_domains = _infer_domains_from_stack(employee.get("stack"))

    if not c_domains and not e_domains:
        return {"score": 50, "matchedRoles": [], "insight": "Domains not specified — neutral match"}
    if not c_domains or not e_domains:
        return {"score": 40, "matchedRoles": [], "insight": "Insufficient role data"}

    overlap = c_domains & e_domains
    match_rate = len(overlap) / max(len(e_domains), 1)

    affinity_bonus = 0.0
    if "fullstack" in c_domains and e_domains & {"frontend", "backend"}:
        affinity_bonus = 0.3
    if "fullstack" in e_domains and c_domains & {"frontend", "backend"}:
        affinity_bonus = 0.3

    matched_roles = [r for r in emp_reqs if _extract_role_domains(r) & c_domains]

    score = round(min(100, (match_rate + affinity_bonus) * 100))
    if matched_roles:
        insight = f"Aligns with: {', '.join(matched_roles)}"
    elif overlap:
        insight = f"Domain overlap: {', '.join(overlap)}"
    else:
        insight = "Low role overlap"

    return {"score": score, "matchedRoles": matched_roles, "insight": insight}


# ── Factor 3: Experience Alignment (15 %) ────────────────────────────────────

SENIORITY_KEYWORDS: dict[str, dict] = {
    "junior":    {"keywords": ["junior", "jr", "intern", "entry", "associate", "graduate", "trainee"], "range": (0, 2)},
    "mid":       {"keywords": ["mid", "intermediate", "engineer ii", "sde ii", "swe ii", "software engineer"], "range": (2, 5)},
    "senior":    {"keywords": ["senior", "sr", "lead", "principal", "staff", "architect", "expert"], "range": (5, 15)},
    "executive": {"keywords": ["director", "vp", "head of", "cto", "ceo", "manager", "head", "chief"], "range": (8, 30)},
}


def compute_experience_score(candidate: dict, employee: dict) -> dict:
    raw = candidate.get("yearsExperience")
    try:
        years = int(raw) if raw is not None else None
    except (ValueError, TypeError):
        years = None

    if years is None:
        return {"score": 50, "insight": "Experience not specified"}

    emp_reqs = ensure_array(employee.get("activeReqs"))
    req_text = " ".join(emp_reqs).lower()

    best_fit: float | None = None
    matched_level: str | None = None

    for level, info in SENIORITY_KEYWORDS.items():
        if any(kw in req_text for kw in info["keywords"]):
            lo, hi = info["range"]
            if lo <= years <= hi:
                fit = 1.0
            elif lo - 1 <= years <= hi + 2:
                fit = 0.75
            else:
                mid = (lo + hi) / 2
                fit = max(0.2, 1 - abs(years - mid) / 10)
            if best_fit is None or fit > best_fit:
                best_fit = fit
                matched_level = level

    if best_fit is not None:
        return {
            "score": round(best_fit * 100),
            "insight": f"{years} yrs — {matched_level}-level fit ({round(best_fit * 100)}%)",
        }

    curve = min(years / 8, 1.0) * 0.6 + 0.35
    return {"score": round(curve * 100), "insight": f"{years} years of experience"}


# ── Factor 4: Referrer Credibility (15 %) ────────────────────────────────────

def compute_credibility_score(reputation: float = 3.5, total_refs: int = 0) -> dict:
    rep_norm = (min(reputation, 5) / 5) * 100
    ref_norm = min(total_refs / 15, 1) * 100
    score = round(rep_norm * 0.55 + ref_norm * 0.35 + 10)

    if total_refs >= 10 and reputation >= 4:
        tier = "Top Referrer"
    elif total_refs >= 5 or reputation >= 3.5:
        tier = "Active Referrer"
    elif total_refs >= 1:
        tier = "Verified Referrer"
    else:
        tier = "New Referrer"

    return {"score": min(100, score), "tier": tier, "reputation": round(reputation, 1), "totalRefs": total_refs}


# ── Factor 5: Activity Signal (10 %) ────────────────────────────────────────

def compute_activity_score(profile: dict) -> dict:
    stack = ensure_array(profile.get("stack"))
    reqs = ensure_array(profile.get("activeReqs"))
    skills = ensure_array(profile.get("skills"))

    signals = 0.0
    max_signals = 0.0

    combined = len(stack) + len(skills)
    signals += min(combined / 8, 1.0)
    max_signals += 1

    signals += min(len(reqs) / 3, 1.0)
    max_signals += 1

    if profile.get("bio"):
        signals += 0.5
        max_signals += 0.5
    if profile.get("currentRole") or profile.get("company"):
        signals += 0.5
        max_signals += 0.5

    score = round((signals / max_signals) * 100) if max_signals else 30
    return {"score": max(15, score)}


# ── Tier ─────────────────────────────────────────────────────────────────────

def get_tier(score: int) -> dict:
    if score >= 85:
        return {"label": "Perfect Match", "color": "#C8FF00", "emoji": "star"}
    if score >= 70:
        return {"label": "Strong Match", "color": "#34d399", "emoji": "fire"}
    if score >= 50:
        return {"label": "Good Match", "color": "#fbbf24", "emoji": "thumbsup"}
    if score >= 30:
        return {"label": "Partial Match", "color": "#6B6966", "emoji": "wave"}
    return {"label": "Low Match", "color": "#3D3B38", "emoji": "none"}


# ── Weights ──────────────────────────────────────────────────────────────────

WEIGHTS = {"skill": 0.40, "domain": 0.20, "experience": 0.15, "credibility": 0.15, "activity": 0.10}
EMP_WEIGHTS = {"skill": 0.40, "domain": 0.20, "experience": 0.15, "profileDepth": 0.15, "activity": 0.10}


# ── Candidate → Employees ────────────────────────────────────────────────────

def generate_recommendations(
    candidate_profile: dict,
    employees: list[dict],
    existing_requests: list[dict] | None = None,
) -> list[dict]:
    if not candidate_profile:
        return []

    requested_ids = {r.get("employeeId") for r in (existing_requests or [])}
    results = []

    for emp in employees:
        if emp.get("uid") == candidate_profile.get("uid"):
            continue
        if emp.get("id") == candidate_profile.get("id"):
            continue

        skill = compute_skill_score(candidate_profile.get("skills"), emp.get("stack"))
        domain = compute_domain_score(candidate_profile, emp)
        experience = compute_experience_score(candidate_profile, emp)
        credibility = compute_credibility_score(emp.get("reputation", 3.5), emp.get("totalRefs", 0))
        activity = compute_activity_score(emp)

        raw = (
            skill["score"] * WEIGHTS["skill"]
            + domain["score"] * WEIGHTS["domain"]
            + experience["score"] * WEIGHTS["experience"]
            + credibility["score"] * WEIGHTS["credibility"]
            + activity["score"] * WEIGHTS["activity"]
        )
        ai_score = round(min(99, max(5, raw)))
        tier = get_tier(ai_score)

        results.append({
            "id": emp.get("id"),
            "alias": emp.get("alias") or emp.get("visibleAs") or "Anonymous Referrer",
            "stack": ensure_array(emp.get("stack")),
            "activeReqs": ensure_array(emp.get("activeReqs")),
            "companyTier": emp.get("companyTier", ""),
            "reputation": emp.get("reputation", 3.5),
            "totalRefs": emp.get("totalRefs", 0),
            "requested": emp.get("id") in requested_ids,
            "aiScore": ai_score,
            "tier": tier,
            "breakdown": {
                "skill":       {**skill, "weight": WEIGHTS["skill"]},
                "domain":      {**domain, "weight": WEIGHTS["domain"]},
                "experience":  {**experience, "weight": WEIGHTS["experience"]},
                "credibility": {**credibility, "weight": WEIGHTS["credibility"]},
                "activity":    {**activity, "weight": WEIGHTS["activity"]},
            },
            "matchedSkills": [s.replace("-", " ") for s in skill["matched"]],
            "missingSkills": [s.replace("-", " ") for s in skill["missing"][:6]],
            "matchedRoles": domain["matchedRoles"],
        })

    results.sort(key=lambda r: r["aiScore"], reverse=True)
    return results


# ── Employer helpers ─────────────────────────────────────────────────────────

def _compute_profile_depth(candidate: dict) -> dict:
    total = 7
    filled = sum(1 for f in ["name", "email", "currentRole", "yearsExperience", "location", "bio"]
                 if candidate.get(f))
    if ensure_array(candidate.get("skills")):
        filled += 1

    base = (filled / total) * 65
    skill_bonus = min(len(ensure_array(candidate.get("skills"))) / 6, 1) * 25
    bio_bonus = 10 if len(candidate.get("bio") or "") > 40 else 0
    return {
        "score": round(min(100, base + skill_bonus + bio_bonus)),
        "filled": filled,
        "total": total,
        "insight": "Complete profile" if filled >= 6 else f"{filled}/{total} fields filled",
    }


def _compute_candidate_activity(candidate: dict) -> dict:
    skills = ensure_array(candidate.get("skills"))
    score = 0.0
    score += min(len(skills) / 6, 1) * 40
    score += 20 if candidate.get("bio") else 0
    score += 20 if candidate.get("currentRole") else 0
    score += 20 if candidate.get("lookingFor") else 0
    return {"score": round(max(10, score))}


def score_candidate(candidate: dict, employee: dict) -> dict | None:
    if not candidate or not employee:
        return None

    skill = compute_skill_score(candidate.get("skills"), employee.get("stack"))
    domain = compute_domain_score(candidate, employee)
    experience = compute_experience_score(candidate, employee)
    depth = _compute_profile_depth(candidate)
    activity = _compute_candidate_activity(candidate)

    raw = (
        skill["score"] * EMP_WEIGHTS["skill"]
        + domain["score"] * EMP_WEIGHTS["domain"]
        + experience["score"] * EMP_WEIGHTS["experience"]
        + depth["score"] * EMP_WEIGHTS["profileDepth"]
        + activity["score"] * EMP_WEIGHTS["activity"]
    )
    ai_score = round(min(99, max(5, raw)))
    return {
        "aiScore": ai_score,
        "tier": get_tier(ai_score),
        "breakdown": {
            "skill":       {**skill, "weight": EMP_WEIGHTS["skill"]},
            "domain":      {**domain, "weight": EMP_WEIGHTS["domain"]},
            "experience":  {**experience, "weight": EMP_WEIGHTS["experience"]},
            "profileDepth": {**depth, "weight": EMP_WEIGHTS["profileDepth"]},
            "activity":    {**activity, "weight": EMP_WEIGHTS["activity"]},
        },
        "matchedSkills": [s.replace("-", " ") for s in skill["matched"]],
        "missingSkills": [s.replace("-", " ") for s in skill["missing"][:6]],
        "matchedRoles": domain["matchedRoles"],
    }


def generate_employer_recommendations(employee: dict, candidates: list[dict]) -> list[dict]:
    if not employee or not candidates:
        return []

    results = []
    for cand in candidates:
        if cand.get("uid") == employee.get("uid") or cand.get("id") == employee.get("id"):
            continue
        scoring = score_candidate(cand, employee)
        if not scoring:
            continue

        cid_short = (cand.get("id") or "")[:4].upper()
        results.append({
            "id": cand.get("id"),
            "uid": cand.get("uid"),
            "alias": f"Candidate #{cid_short}",
            "name": cand.get("name", "Unknown"),
            "email": cand.get("email", ""),
            "skills": ensure_array(cand.get("skills")),
            "currentRole": cand.get("currentRole", ""),
            "yearsExperience": cand.get("yearsExperience"),
            "location": cand.get("location", ""),
            "lookingFor": cand.get("lookingFor", ""),
            "bio": cand.get("bio", ""),
            **scoring,
        })

    results.sort(key=lambda r: r["aiScore"], reverse=True)
    return results
