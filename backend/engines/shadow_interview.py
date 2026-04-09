"""
Shadow Interview Engine — Python port.
Generates personalized technical + behavioral questions, evaluates answers.
"""

from __future__ import annotations
import random
import re
from .recommendation_engine import normalise

# ── Question pools ───────────────────────────────────────────────────────────

QUESTION_POOLS: dict[str, list[dict]] = {
    "react": [
        {"q": "Explain the difference between useEffect cleanup and unmounting. When would cleanup run without the component unmounting?", "tier": "mid"},
        {"q": "How would you architect state management for a large dashboard with real-time data? Walk through your decision process.", "tier": "senior"},
        {"q": "Describe a performance bottleneck you encountered in a React app and how you resolved it.", "tier": "mid"},
        {"q": "What are React Server Components and how do they change the data-fetching paradigm?", "tier": "senior"},
        {"q": "How do you handle complex form state with validation across multiple steps? Describe your approach.", "tier": "mid"},
    ],
    "javascript": [
        {"q": "Explain the event loop in JavaScript. How do microtasks and macrotasks differ in scheduling?", "tier": "mid"},
        {"q": "What are the trade-offs between Proxy-based reactivity and explicit setState patterns?", "tier": "senior"},
        {"q": "Describe how you would implement a debounce function. What edge cases would you handle?", "tier": "junior"},
        {"q": "How does prototypal inheritance work in JavaScript and when would you use it over class syntax?", "tier": "mid"},
    ],
    "typescript": [
        {"q": "Explain the difference between type and interface in TypeScript. When would you choose one over the other?", "tier": "mid"},
        {"q": "How would you type a higher-order function that wraps any async function with retry logic?", "tier": "senior"},
        {"q": "What are conditional types and how have you used them to build flexible library APIs?", "tier": "senior"},
    ],
    "node": [
        {"q": "How would you handle a memory leak in a long-running Node.js service? Describe your debugging process.", "tier": "senior"},
        {"q": "Explain the difference between worker threads and child processes in Node. When would you use each?", "tier": "mid"},
        {"q": "How do streams work in Node.js and when would you prefer them over loading data into memory?", "tier": "mid"},
    ],
    "python": [
        {"q": "Explain the GIL in Python. How does it affect multi-threaded applications and what workarounds exist?", "tier": "senior"},
        {"q": "How would you design an ETL pipeline in Python for processing millions of records daily?", "tier": "senior"},
        {"q": "What are Python decorators and how would you implement one that caches function results with a TTL?", "tier": "mid"},
    ],
    "sql": [
        {"q": "How would you optimize a slow query that joins 4+ tables with millions of rows? Walk through your approach.", "tier": "senior"},
        {"q": "Explain the difference between a clustered and non-clustered index. When would each be appropriate?", "tier": "mid"},
        {"q": "How do you handle database migrations in a zero-downtime deployment scenario?", "tier": "senior"},
    ],
    "docker": [
        {"q": "Explain multi-stage Docker builds and how they reduce image size. Give a real-world example.", "tier": "mid"},
        {"q": "How would you debug a container that starts but immediately exits with no error logs?", "tier": "mid"},
    ],
    "kubernetes": [
        {"q": "Explain how a Kubernetes pod gets scheduled and what happens when it fails a liveness probe.", "tier": "senior"},
        {"q": "How would you design a zero-downtime deployment strategy on Kubernetes?", "tier": "senior"},
    ],
    "aws": [
        {"q": "Compare Lambda, ECS, and EKS for deploying microservices. What factors drive your choice?", "tier": "senior"},
        {"q": "How would you architect a system on AWS to handle 10x traffic spikes without pre-provisioning?", "tier": "senior"},
    ],
    "system_design": [
        {"q": "Design a URL shortener that handles 100M redirects per day. Walk through your architecture choices.", "tier": "senior"},
        {"q": "How would you design a real-time notification system that scales to millions of concurrent users?", "tier": "senior"},
        {"q": "Design a rate limiter for an API gateway. What algorithm would you use and why?", "tier": "mid"},
    ],
    "general_tech": [
        {"q": "What is your approach to writing maintainable code in a fast-moving team? Give specific examples.", "tier": "mid"},
        {"q": "Describe a time you had to make a significant technical trade-off. What did you choose and why?", "tier": "mid"},
        {"q": "How do you approach debugging a production issue you have never seen before?", "tier": "mid"},
        {"q": "Explain the CAP theorem and how it influenced a real architectural decision you made.", "tier": "senior"},
        {"q": "How do you decide between building a feature in-house versus using a third-party service?", "tier": "mid"},
    ],
}

BEHAVIORAL_QUESTIONS = [
    {"q": "Tell me about a project where requirements changed significantly mid-development. How did you adapt?", "focus": "adaptability"},
    {"q": "Describe a time you had a disagreement with a teammate about a technical approach. How was it resolved?", "focus": "collaboration"},
    {"q": "Tell me about a time you had to deliver under tight deadlines. What trade-offs did you make?", "focus": "prioritization"},
    {"q": "Describe your most impactful contribution to a team. What made it significant?", "focus": "impact"},
    {"q": "How do you handle receiving critical feedback on your code or design decisions?", "focus": "growth"},
    {"q": "Tell me about a failure or mistake in your career. What did you learn from it?", "focus": "resilience"},
]

SKILL_POOL_MAP: dict[str, str] = {
    "react": "react", "react.js": "react", "reactjs": "react", "nextjs": "react", "next.js": "react",
    "vue": "react", "angular": "react", "svelte": "react",
    "javascript": "javascript", "js": "javascript",
    "typescript": "typescript", "ts": "typescript",
    "node": "node", "node.js": "node", "nodejs": "node", "express": "node", "nestjs": "node",
    "python": "python", "django": "python", "flask": "python", "fastapi": "python",
    "sql": "sql", "postgresql": "sql", "mysql": "sql", "mongodb": "sql",
    "docker": "docker",
    "kubernetes": "kubernetes", "k8s": "kubernetes",
    "aws": "aws", "gcp": "aws", "azure": "aws", "terraform": "aws",
    "system design": "system_design", "distributed systems": "system_design", "architecture": "system_design",
}


def generate_questions(
    candidate_skills: list[str] | None = None,
    target_role: str = "",
    years_experience: int = 0,
) -> dict:
    skills = candidate_skills or []
    tier = "senior" if years_experience >= 5 else "mid" if years_experience >= 2 else "junior"

    pool_hits: dict[str, list[str]] = {}
    for skill in skills:
        key = skill.lower().strip()
        pool = SKILL_POOL_MAP.get(key)
        if pool and pool in QUESTION_POOLS:
            pool_hits.setdefault(pool, []).append(skill)

    tech_questions: list[dict] = []
    used_pools: set[str] = set()

    sorted_pools = sorted(pool_hits.items(), key=lambda x: len(x[1]), reverse=True)

    for pool_name, _ in sorted_pools:
        if len(tech_questions) >= 4:
            break
        if pool_name in used_pools:
            continue
        questions = QUESTION_POOLS[pool_name]
        tiered = [q for q in questions if q["tier"] in (tier, "mid")]
        available = tiered or questions
        pick = random.choice(available)
        tech_questions.append({
            "text": pick["q"],
            "type": "technical",
            "domain": pool_name,
            "tier": pick["tier"],
        })
        used_pools.add(pool_name)

    attempts = 0
    while len(tech_questions) < 4 and attempts < 15:
        pick = random.choice(QUESTION_POOLS["general_tech"])
        if not any(q["text"] == pick["q"] for q in tech_questions):
            tech_questions.append({
                "text": pick["q"],
                "type": "technical",
                "domain": "general",
                "tier": pick["tier"],
            })
        attempts += 1

    behavioral = random.choice(BEHAVIORAL_QUESTIONS)
    questions = tech_questions[:4] + [{
        "text": behavioral["q"],
        "type": "behavioral",
        "domain": behavioral["focus"],
        "tier": "any",
    }]

    return {
        "questions": questions,
        "meta": {
            "targetRole": target_role,
            "candidateSkillCount": len(skills),
            "tier": tier,
            "poolsUsed": list(used_pools),
        },
    }


# ── Answer evaluation ────────────────────────────────────────────────────────

TECH_KEYWORDS: dict[str, list[str]] = {
    "react": ["component", "hook", "state", "effect", "render", "virtual dom", "reconciliation", "memo", "context", "suspense", "ssr", "hydration", "fiber"],
    "javascript": ["closure", "prototype", "event loop", "promise", "async", "callback", "scope", "hoisting", "this", "module", "proxy", "generator", "symbol"],
    "typescript": ["type", "interface", "generic", "union", "intersection", "conditional", "infer", "mapped", "utility", "discriminated", "strict", "narrowing"],
    "node": ["event loop", "stream", "buffer", "cluster", "worker", "middleware", "express", "async", "non-blocking", "v8", "libuv", "module"],
    "python": ["decorator", "generator", "comprehension", "gil", "asyncio", "metaclass", "descriptor", "context manager", "iterator", "dunder", "pip", "virtual env"],
    "sql": ["index", "join", "query plan", "normalize", "transaction", "acid", "deadlock", "partition", "sharding", "replication", "migration", "view"],
    "docker": ["image", "container", "layer", "volume", "network", "compose", "dockerfile", "multi-stage", "registry", "orchestration"],
    "kubernetes": ["pod", "deployment", "service", "ingress", "configmap", "secret", "namespace", "helm", "operator", "hpa", "probe", "rollout"],
    "aws": ["lambda", "ec2", "s3", "rds", "dynamodb", "sqs", "sns", "cloudformation", "iam", "vpc", "ecs", "fargate", "cdn", "cloudfront"],
    "system_design": ["scalability", "availability", "consistency", "partition", "cache", "load balancer", "message queue", "database", "api", "microservice", "cdn", "sharding"],
    "general": ["trade-off", "architecture", "pattern", "testing", "monitoring", "ci/cd", "documentation", "refactor", "performance", "security", "maintainability"],
    "behavioral": ["team", "collaborate", "deadline", "challenge", "learn", "feedback", "communicate", "adapt", "prioritize", "impact", "failure", "growth", "resolve", "conflict"],
}


def _evaluate_answer(answer: str, question: dict) -> dict:
    if not answer or not answer.strip():
        return {"technical": 0, "communication": 0, "confidence": 0, "keywords": [], "depth": "empty"}

    text = answer.strip()
    words = text.split()
    sentences = [s for s in re.split(r"[.!?]+", text) if s.strip()]
    lower = text.lower()

    domain = question.get("domain", "general")
    relevant_kw = TECH_KEYWORDS.get(domain, []) + TECH_KEYWORDS.get("general", [])
    if question.get("type") == "behavioral":
        relevant_kw += TECH_KEYWORDS.get("behavioral", [])

    found = [kw for kw in relevant_kw if kw in lower]
    density = len(found) / len(relevant_kw) if relevant_kw else 0

    has_example = bool(re.search(r"for example|for instance|in my|i built|we implemented|at my|in production|real.?world|project", text, re.I))
    has_numbers = bool(re.search(r"\d+%|\d+ (users|requests|ms|seconds|million|thousand|times|commits)", text, re.I))
    has_comparison = bool(re.search(r"compared to|versus|trade.?off|on the other hand|alternatively|however|whereas", text, re.I))
    has_structure = len(sentences) >= 3

    technical = min(density * 60, 40) + (15 if has_example else 0) + (10 if has_numbers else 0) + (10 if has_comparison else 0) + min(len(words) / 150, 1) * 15 + (10 if has_structure else 0)
    technical = round(max(0, min(100, technical)))

    avg_sent = len(words) / max(len(sentences), 1)
    communication = (30 if 8 <= avg_sent <= 25 else 15 if avg_sent > 25 else 10)
    communication += 25 if has_structure else (15 if len(sentences) >= 2 else 5)
    communication += 20 if len(words) >= 30 else (10 if len(words) >= 15 else 0)
    has_transitions = bool(re.search(r"first|second|then|next|finally|additionally|moreover|furthermore|because|therefore", text, re.I))
    communication += 15 if has_transitions else 0
    communication += 5 if text[0].isupper() else 0
    communication += 5 if text.endswith((".","!")) else 0
    communication = round(max(0, min(100, communication)))

    hedge_count = len(re.findall(r"i think|maybe|probably|i guess|not sure|might be|could be|i believe", text, re.I))
    confidence = max(0, 30 - hedge_count * 10)
    confidence += 25 if has_example else 0
    confidence += 15 if has_numbers else 0
    assertive = bool(re.search(r"i implemented|i designed|i led|i built|we shipped|i chose|the key|the solution|the approach", text, re.I))
    confidence += 20 if assertive else 0
    confidence += 10 if len(words) >= 50 else 0
    confidence = round(max(0, min(100, confidence)))

    wc = len(words)
    depth = "deep" if wc >= 100 else "moderate" if wc >= 40 else "surface" if wc >= 15 else "minimal"

    return {"technical": technical, "communication": communication, "confidence": confidence, "keywords": found, "depth": depth}


def evaluate_interview(questions: list[dict], answers: list[str]) -> dict:
    evals = []
    for i, q in enumerate(questions):
        ans = answers[i] if i < len(answers) else ""
        evals.append({"question": q, "answer": ans, "scores": _evaluate_answer(ans, q)})

    tech_evals = [e for e in evals if e["question"].get("type") == "technical"]
    behav_eval = next((e for e in evals if e["question"].get("type") == "behavioral"), None)

    avg_tech = round(sum(e["scores"]["technical"] for e in tech_evals) / max(len(tech_evals), 1))
    avg_comm = round(sum(e["scores"]["communication"] for e in evals) / max(len(evals), 1))
    avg_conf = round(sum(e["scores"]["confidence"] for e in evals) / max(len(evals), 1))

    behav_score = round(
        behav_eval["scores"]["communication"] * 0.4
        + behav_eval["scores"]["confidence"] * 0.4
        + behav_eval["scores"]["technical"] * 0.2
    ) if behav_eval else 50

    overall = round(avg_tech * 0.45 + avg_comm * 0.25 + avg_conf * 0.15 + behav_score * 0.15)

    strengths, weaknesses = [], []
    if avg_tech >= 70:
        strengths.append("Strong technical depth across interview questions")
    elif avg_tech < 40:
        weaknesses.append("Technical answers lack sufficient depth and specificity")
    if avg_comm >= 70:
        strengths.append("Clear, well-structured communication style")
    elif avg_comm < 40:
        weaknesses.append("Answers could be more structured and articulate")
    if avg_conf >= 70:
        strengths.append("Confident delivery with concrete examples")
    elif avg_conf < 40:
        weaknesses.append("Responses show hesitancy — more assertive examples would help")
    if behav_score >= 70:
        strengths.append("Strong behavioral signals — team-oriented mindset")
    elif behav_score < 40:
        weaknesses.append("Behavioral response needs more specific, real-world examples")

    deep_ct = sum(1 for e in evals if e["scores"]["depth"] == "deep")
    if deep_ct >= 3:
        strengths.append(f"{deep_ct} of {len(evals)} answers showed exceptional depth")
    weak_ct = sum(1 for e in evals if e["scores"]["depth"] in ("minimal", "surface"))
    if weak_ct >= 2:
        weaknesses.append(f"{weak_ct} answers were too brief — elaboration needed")

    top_domains = list({e["question"]["domain"] for e in tech_evals if e["scores"]["technical"] >= 60 and e["question"]["domain"] != "general"})
    if top_domains:
        strengths.append(f"Particularly strong in: {', '.join(top_domains)}")

    if not strengths:
        strengths.append("Completed the interview — baseline engagement demonstrated")
    if not weaknesses:
        weaknesses.append("No significant weaknesses detected")

    REC_MAP = {
        "strong_yes": ("#C8FF00", "Strong Yes"),
        "yes": ("#10B981", "Yes"),
        "maybe": ("#F59E0B", "Maybe"),
        "no": ("#EF4444", "No"),
    }
    if overall >= 80:
        rec = "strong_yes"
    elif overall >= 60:
        rec = "yes"
    elif overall >= 40:
        rec = "maybe"
    else:
        rec = "no"

    if overall >= 80:
        summary = "Exceptional interview performance. The candidate demonstrated deep technical knowledge, communicated ideas clearly, and provided concrete examples from real-world experience. This is a high-confidence referral."
    elif overall >= 60:
        summary = "Solid interview performance with good technical foundations. Some areas could be stronger, but the overall signal is positive. The candidate shows readiness for the role with minor gaps."
    elif overall >= 40:
        summary = "Mixed interview performance. While the candidate shows some relevant knowledge, several answers lacked depth or specificity. Consider whether the gaps are addressable through onboarding."
    else:
        summary = "Below-average interview performance. The answers suggest the candidate may not be fully prepared for the technical demands of this role at this time. Additional preparation is recommended."

    return {
        "technicalScore": avg_tech,
        "communicationScore": avg_comm,
        "confidenceScore": avg_conf,
        "behavioralScore": behav_score,
        "overallScore": overall,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendation": rec,
        "recColor": REC_MAP[rec][0],
        "recLabel": REC_MAP[rec][1],
        "aiSummary": summary,
        "perQuestion": [
            {
                "question": e["question"]["text"],
                "type": e["question"].get("type"),
                "domain": e["question"].get("domain"),
                "depth": e["scores"]["depth"],
                "techScore": e["scores"]["technical"],
                "commScore": e["scores"]["communication"],
                "confScore": e["scores"]["confidence"],
                "keywordsFound": len(e["scores"]["keywords"]),
            }
            for e in evals
        ],
    }
