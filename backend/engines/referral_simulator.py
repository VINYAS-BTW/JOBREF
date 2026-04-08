"""
Referral Simulator — Python port.
Predicts interview/hire probability, detects risks, generates explanations.
"""

from __future__ import annotations
import math
from .recommendation_engine import normalise, ensure_array

CRITICAL_SKILLS: dict[str, list[str]] = {
    "Senior Frontend Engineer":  ["react", "typescript", "javascript", "css", "nextjs", "vue", "angular"],
    "Senior Backend Engineer":   ["node", "python", "java", "go", "postgresql", "mongodb", "redis", "graphql"],
    "Full Stack Engineer":       ["react", "node", "typescript", "postgresql", "mongodb", "docker"],
    "Staff Software Engineer":   ["system design", "distributed systems", "kubernetes", "aws", "architecture"],
    "DevOps Engineer":           ["docker", "kubernetes", "terraform", "aws", "gcp", "cicd", "linux"],
    "ML Engineer":               ["python", "pytorch", "tensorflow", "ml", "deep-learning", "pandas"],
    "Data Engineer":             ["python", "sql", "spark", "airflow", "kafka", "aws", "dbt"],
    "Mobile Engineer":           ["react-native", "flutter", "swift", "kotlin", "ios", "android"],
    "Frontend Engineer":         ["react", "javascript", "typescript", "css", "html", "vue"],
    "Backend Engineer":          ["node", "python", "java", "express", "django", "postgresql"],
    "Software Engineer":         ["javascript", "python", "react", "node", "sql", "git"],
    "Platform Engineer":         ["kubernetes", "docker", "terraform", "aws", "linux", "monitoring"],
    "Security Engineer":         ["security", "linux", "python", "networking", "aws", "penetration-testing"],
    "Product Manager":           ["product", "analytics", "sql", "a/b-testing", "roadmap"],
    "Engineering Manager":       ["leadership", "system-design", "agile", "architecture", "mentoring"],
}


def _find_critical_skills(target_role: str) -> list[str]:
    for key in CRITICAL_SKILLS:
        if key.lower() in target_role.lower() or target_role.lower() in key.lower():
            return CRITICAL_SKILLS[key]
    return CRITICAL_SKILLS["Software Engineer"]


def _skill_match_score(candidate_skills: list[str], required: list[str]) -> float:
    c = ensure_array(candidate_skills)
    r = ensure_array(required)
    if not r:
        return 1.0
    c_set = {normalise(s) for s in c}
    matched = [s for s in r if normalise(s) in c_set]
    return len(matched) / len(r)


def _experience_score(years) -> float:
    try:
        y = int(years) if years is not None else 0
    except (ValueError, TypeError):
        y = 0
    return min(y / 10, 1.0)


def _github_score(candidate: dict) -> float:
    score = 0.3
    if candidate.get("githubConnected"):
        score += 0.3
    skill_count = len(ensure_array(candidate.get("skills")))
    score += min(skill_count / 10, 0.3)
    if len(candidate.get("bio") or "") > 50:
        score += 0.1
    return min(score, 1.0)


def _cosine_similarity(candidate_skills, employee_stack) -> float:
    c = [normalise(s) for s in ensure_array(candidate_skills)]
    e = [normalise(s) for s in ensure_array(employee_stack)]
    all_skills = list(set(c + e))
    if not all_skills:
        return 0.0

    vec_a = [1 if s in c else 0 for s in all_skills]
    vec_b = [1 if s in e else 0 for s in all_skills]

    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a * a for a in vec_a))
    mag_b = math.sqrt(sum(b * b for b in vec_b))
    mag = mag_a * mag_b
    return dot / mag if mag else 0.0


def _map_prediction(score: float) -> dict:
    if score >= 0.8:
        return {"interviewProbability": 83, "hireProbability": 50}
    if score >= 0.6:
        return {"interviewProbability": 60, "hireProbability": 30}
    return {"interviewProbability": 35, "hireProbability": 13}


def _detect_risks(
    exp_score: float,
    skill_match: float,
    gh_score: float,
    candidate_skills: list[str],
    critical: list[str],
    target_role: str,
) -> list[dict]:
    risks = []
    if exp_score < 0.4:
        risks.append({"type": "experience", "severity": "medium", "label": "Low experience", "detail": "Candidate has fewer years than typically required."})
    if skill_match < 0.5:
        risks.append({"type": "skill_match", "severity": "high", "label": "Skill mismatch", "detail": f"Less than half the key skills for {target_role} are present."})
    if gh_score < 0.3:
        risks.append({"type": "proof", "severity": "low", "label": "Low project proof", "detail": "Limited evidence of hands-on project work."})

    c_norm = {normalise(s) for s in ensure_array(candidate_skills)}
    for cs in critical[:3]:
        if normalise(cs) not in c_norm:
            risks.append({"type": "missing_critical", "severity": "high", "label": f"Missing critical skill: {cs}", "detail": f"{cs} is commonly required for {target_role}."})

    skill_cats = {_cat(s) for s in c_norm}
    if len(skill_cats - {"other"}) <= 1 and len(c_norm) > 3:
        risks.append({"type": "narrow", "severity": "low", "label": "Narrow specialization", "detail": "Skills concentrated in a single category."})

    return risks


def _cat(norm_skill: str) -> str:
    from .recommendation_engine import get_skill_category
    return get_skill_category(norm_skill)


def _generate_explanation(
    score: float, candidate: dict, target_role: str,
    matched_critical: list[str], missing_critical: list[str],
    risks: list[dict],
) -> dict:
    years = candidate.get("yearsExperience", 0)
    skills = ensure_array(candidate.get("skills"))
    name = candidate.get("name", "The candidate")

    if score >= 0.8:
        evaluation = f"{name} is an excellent fit for {target_role}. Strong skill alignment and solid experience create high referral confidence."
    elif score >= 0.6:
        evaluation = f"{name} shows good potential for {target_role}. Core competencies are present with some gaps that may be addressable."
    elif score >= 0.4:
        evaluation = f"{name} has partial alignment with {target_role}. Several key areas need strengthening before a confident referral."
    else:
        evaluation = f"{name} may not be the strongest fit for {target_role} at this time. Significant skill or experience gaps exist."

    strengths = []
    if matched_critical:
        strengths.append(f"Has critical skills: {', '.join(matched_critical[:4])}")
    if years and int(years) >= 3:
        strengths.append(f"{years} years of industry experience")
    if len(skills) >= 6:
        strengths.append(f"Broad tech stack ({len(skills)} skills)")
    if candidate.get("githubConnected"):
        strengths.append("GitHub profile connected — verifiable work")
    if not strengths:
        strengths.append("Completed profile — baseline engagement shown")

    weaknesses = []
    if missing_critical:
        weaknesses.append(f"Missing: {', '.join(missing_critical[:3])}")
    for r in risks:
        if r["severity"] == "high" and r["type"] != "missing_critical":
            weaknesses.append(r["label"])
    if not weaknesses:
        weaknesses.append("No major red flags detected")

    if missing_critical:
        suggestion = f"Consider gaining experience in {missing_critical[0]} to strengthen candidacy for {target_role}."
    elif risks:
        suggestion = f"Address the identified risk factors to improve referral confidence for {target_role}."
    else:
        suggestion = f"Strong profile — proceed with the referral for {target_role} with confidence."

    return {"evaluation": evaluation, "strengths": strengths, "weaknesses": weaknesses, "suggestion": suggestion}


# ── Main ─────────────────────────────────────────────────────────────────────

def simulate_referral(candidate: dict, employee: dict, target_role: str | None = None) -> dict | None:
    if not candidate or not employee:
        return None

    role = target_role or (ensure_array(employee.get("activeReqs")) or ["Software Engineer"])[0]
    critical = _find_critical_skills(role)

    c_skills = ensure_array(candidate.get("skills"))
    e_stack = ensure_array(employee.get("stack"))

    cosine = _cosine_similarity(c_skills, e_stack)
    exp = _experience_score(candidate.get("yearsExperience"))
    skill_match = _skill_match_score(c_skills, critical)
    gh = _github_score(candidate)

    final = 0.5 * cosine + 0.2 * exp + 0.2 * skill_match + 0.1 * gh
    final = max(0.0, min(1.0, final))

    prediction = _map_prediction(final)

    c_norm = {normalise(s) for s in c_skills}
    matched_crit = [s for s in critical if normalise(s) in c_norm]
    missing_crit = [s for s in critical if normalise(s) not in c_norm]

    risks = _detect_risks(exp, skill_match, gh, c_skills, critical, role)
    explanation = _generate_explanation(final, candidate, role, matched_crit, missing_crit, risks)

    return {
        "matchScore": round(final * 100),
        "interviewProbability": prediction["interviewProbability"],
        "hireProbability": prediction["hireProbability"],
        "riskFactors": risks,
        "explanation": explanation,
        "factors": {
            "cosineSimilarity": round(cosine * 100),
            "experienceScore": round(exp * 100),
            "skillMatchScore": round(skill_match * 100),
            "githubScore": round(gh * 100),
        },
        "meta": {
            "targetRole": role,
            "criticalSkills": critical,
            "candidateSkillCount": len(c_skills),
            "matchedCritical": matched_crit,
            "missingCritical": missing_crit,
        },
    }


def simulate_improvement(
    candidate: dict, employee: dict, target_role: str,
    added_skills: list[str] | None = None, added_years: int = 0,
) -> dict | None:
    modified = {**candidate}
    skills = list(ensure_array(modified.get("skills")))
    skills.extend(added_skills or [])
    modified["skills"] = skills

    try:
        yrs = int(modified.get("yearsExperience", 0))
    except (ValueError, TypeError):
        yrs = 0
    modified["yearsExperience"] = yrs + added_years

    return simulate_referral(modified, employee, target_role)
