"""Deterministic skill-gap suggestions when Gemini is unavailable."""

from __future__ import annotations

from engines.recommendation_engine import ensure_array, normalise

ROLE_STACKS: dict[str, list[str]] = {
    "frontend": ["TypeScript", "React", "Next.js", "GraphQL", "Testing", "Accessibility"],
    "backend": ["PostgreSQL", "Redis", "Docker", "Kafka", "API design", "Observability"],
    "fullstack": ["Node.js", "PostgreSQL", "Docker", "Kubernetes", "System design", "GraphQL"],
    "data": ["Python", "SQL", "Spark", "Airflow", "Data modeling", "Statistics"],
}


def _infer_track(profile: dict) -> str:
    text = " ".join(
        [
            str(profile.get("lookingFor") or ""),
            str(profile.get("currentRole") or ""),
            str(profile.get("bio") or ""),
        ]
    ).lower()
    if any(x in text for x in ("frontend", "react", "ui ", " ux", "css")):
        return "frontend"
    if any(x in text for x in ("backend", "api", "microservice", "database")):
        return "backend"
    if any(x in text for x in ("data", "ml", "machine learning", "analytics")):
        return "data"
    return "fullstack"


def _skill_present(candidate_norm: set[str], label: str) -> bool:
    n = normalise(label)
    if n in candidate_norm:
        return True
    lab = label.lower()
    for c in candidate_norm:
        if lab in c or c in lab:
            return True
    return False


def heuristic_skill_gaps(profile: dict | None) -> list[dict]:
    profile = profile or {}
    skills_raw = ensure_array(profile.get("skills"))
    candidate_norm = {normalise(s) for s in skills_raw if s}

    track = _infer_track(profile)
    stack = ROLE_STACKS.get(track, ROLE_STACKS["fullstack"])
    missing = [s for s in stack if not _skill_present(candidate_norm, s)][:5]

    if len(missing) < 2:
        extra = ["Kubernetes", "CI/CD", "System design", "GraphQL", "Security basics"]
        for s in extra:
            if not _skill_present(candidate_norm, s) and s not in missing:
                missing.append(s)
            if len(missing) >= 4:
                break

    your_match = min(94, 38 + min(len(candidate_norm) * 4, 40))
    potential = min(98, your_match + 8 + len(missing) * 3)

    role_title = (profile.get("lookingFor") or profile.get("currentRole") or "Software Engineer").strip() or "Software Engineer"

    return [
        {
            "role": role_title,
            "company_tier": "Typical expectations",
            "missing": missing[:5],
            "your_match": your_match,
            "potential": potential,
            "rationale": "Heuristic gap analysis from your listed skills vs common stacks for your target track.",
        }
    ]
