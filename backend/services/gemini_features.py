"""
Gemini for Shadow Interview (questions + evaluation) and Skill Gap Navigator.
Resume parsing does not use this module — use engines.resume_parser only.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

logger = logging.getLogger(__name__)

_DEFAULT_MODEL = "gemini-2.0-flash"


def _api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()


def _model_name() -> str:
    return (os.getenv("GEMINI_MODEL") or _DEFAULT_MODEL).strip() or _DEFAULT_MODEL


def _strip_fence(text: str) -> str:
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.I)
    t = re.sub(r"\s*```\s*$", "", t)
    return t.strip()


def _generate(prompt: str) -> str | None:
    key = _api_key()
    if not key:
        return None
    try:
        import google.generativeai as genai
    except ImportError:
        logger.warning("google-generativeai not installed; Gemini features disabled")
        return None

    genai.configure(api_key=key)
    model = genai.GenerativeModel(_model_name())
    try:
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.35},
        )
    except Exception as e:
        logger.warning("Gemini request failed: %s", e)
        return None

    try:
        return response.text
    except ValueError:
        logger.warning("Gemini returned no text")
        return None


def _parse_json_object(raw: str | None) -> dict[str, Any] | None:
    if not raw:
        return None
    try:
        data = json.loads(_strip_fence(raw))
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError as e:
        logger.warning("Gemini JSON parse error: %s", e)
        return None


def try_generate_shadow_questions(
    candidate_skills: list[str] | None,
    target_role: str,
    years_experience: int,
) -> dict[str, Any] | None:
    skills = candidate_skills or []
    tier = "senior" if years_experience >= 5 else "mid" if years_experience >= 2 else "junior"
    prompt = f"""You write shadow interview questions for hiring. Return ONLY valid JSON (no markdown fences).

Shape:
{{
  "questions": [
    {{"text": "string", "type": "technical", "domain": "short-label", "tier": "junior"|"mid"|"senior"}},
    ... exactly 4 technical ...
    {{"text": "string", "type": "behavioral", "domain": "behavioral", "tier": "any"}}
  ],
  "meta": {{
    "targetRole": "{target_role}",
    "candidateSkillCount": {len(skills)},
    "tier": "{tier}",
    "poolsUsed": ["string"]
  }}
}}

Rules:
- Exactly 5 questions: 4 technical tailored to the candidate skills and target role, 1 behavioral.
- Technical difficulty should match years of experience (~{years_experience} years): use tier "{tier}" for most technical questions.
- Questions must be specific and non-generic where possible.
- Candidate skills (may be empty): {json.dumps(skills[:40])}
- Target role: {target_role or "Software Engineer"}
"""
    data = _parse_json_object(_generate(prompt))
    if not data:
        return None
    qs = data.get("questions")
    if not isinstance(qs, list) or len(qs) != 5:
        return None
    out_q = []
    for q in qs:
        if not isinstance(q, dict):
            return None
        text = str(q.get("text") or "").strip()
        if not text:
            return None
        out_q.append(
            {
                "text": text,
                "type": str(q.get("type") or "technical"),
                "domain": str(q.get("domain") or "general"),
                "tier": str(q.get("tier") or "mid"),
            }
        )
    beh = [x for x in out_q if x["type"] == "behavioral"]
    if len(beh) != 1:
        return None
    meta = data.get("meta")
    if not isinstance(meta, dict):
        meta = {}
    meta.setdefault("targetRole", target_role)
    meta.setdefault("candidateSkillCount", len(skills))
    meta.setdefault("tier", tier)
    meta.setdefault("poolsUsed", [])
    return {"questions": out_q, "meta": meta}


_REC_ALLOWED = frozenset({"strong_yes", "yes", "maybe", "no"})
_REC_STYLE = {
    "strong_yes": ("#C8FF00", "Strong Yes"),
    "yes": ("#10B981", "Yes"),
    "maybe": ("#F59E0B", "Maybe"),
    "no": ("#EF4444", "No"),
}


def try_evaluate_shadow_interview(questions: list[dict], answers: list[str]) -> dict[str, Any] | None:
    qa_blocks = []
    for i, q in enumerate(questions):
        qt = q.get("text", "")
        ans = answers[i] if i < len(answers) else ""
        qa_blocks.append(f"Q{i+1} ({q.get('type')} / {q.get('domain')}): {qt}\nA{i+1}: {ans}")
    blob = "\n\n".join(qa_blocks)

    prompt = f"""You evaluate a technical interview. Return ONLY valid JSON (no markdown).

{blob}

Return shape:
{{
  "technicalScore": 0-100,
  "communicationScore": 0-100,
  "confidenceScore": 0-100,
  "behavioralScore": 0-100,
  "overallScore": 0-100,
  "strengths": ["string", ...],
  "weaknesses": ["string", ...],
  "recommendation": "strong_yes"|"yes"|"maybe"|"no",
  "aiSummary": "2-4 sentences",
  "perQuestion": [
    {{
      "question": "exact question text",
      "type": "technical or behavioral",
      "domain": "string",
      "depth": "deep"|"moderate"|"surface"|"minimal",
      "techScore": 0-100,
      "commScore": 0-100,
      "confScore": 0-100,
      "keywordsFound": 0
    }}
  ]
}}

Use one perQuestion entry per question in order. recommendation must be exactly one of: strong_yes, yes, maybe, no.
"""
    data = _parse_json_object(_generate(prompt))
    if not data:
        return None

    rec = str(data.get("recommendation") or "maybe").strip()
    if rec not in _REC_ALLOWED:
        rec = "maybe"
    color, label = _REC_STYLE[rec]

    per_raw = data.get("perQuestion")
    if not isinstance(per_raw, list):
        return None

    per_question = []
    for i, q in enumerate(questions):
        row = per_raw[i] if i < len(per_raw) and isinstance(per_raw[i], dict) else {}
        pq = {
            "question": str(row.get("question") or q.get("text") or ""),
            "type": row.get("type") or q.get("type"),
            "domain": row.get("domain") or q.get("domain"),
            "depth": str(row.get("depth") or "moderate"),
            "techScore": max(0, min(100, int(row.get("techScore", 0)))),
            "commScore": max(0, min(100, int(row.get("commScore", 0)))),
            "confScore": max(0, min(100, int(row.get("confScore", 0)))),
            "keywordsFound": max(0, int(row.get("keywordsFound", 0))),
        }
        per_question.append(pq)

    def _clamp_int(k: str, default: int = 0) -> int:
        try:
            return max(0, min(100, int(data.get(k, default))))
        except (TypeError, ValueError):
            return default

    strengths = data.get("strengths")
    weaknesses = data.get("weaknesses")
    if not isinstance(strengths, list):
        strengths = []
    if not isinstance(weaknesses, list):
        weaknesses = []

    return {
        "technicalScore": _clamp_int("technicalScore", 50),
        "communicationScore": _clamp_int("communicationScore", 50),
        "confidenceScore": _clamp_int("confidenceScore", 50),
        "behavioralScore": _clamp_int("behavioralScore", 50),
        "overallScore": _clamp_int("overallScore", 50),
        "strengths": [str(s) for s in strengths if s][:12],
        "weaknesses": [str(s) for s in weaknesses if s][:12],
        "recommendation": rec,
        "recColor": color,
        "recLabel": label,
        "aiSummary": str(data.get("aiSummary") or "").strip() or "Evaluation complete.",
        "perQuestion": per_question,
    }


def default_referral_pitch(candidate: dict[str, Any], employee: dict[str, Any], target_role: str) -> str:
    """Template when Gemini is unavailable or returns nothing (max ~200 chars)."""
    raw_name = str(candidate.get("name") or "").strip()
    first = raw_name.split()[0] if raw_name else "I"
    skills = candidate.get("skills") or []
    if not isinstance(skills, list):
        skills = []
    skills_str = ", ".join(str(s).strip() for s in skills[:4] if s) or "relevant experience"
    alias = str(employee.get("alias") or employee.get("visibleAs") or "your network").strip()
    role = (target_role or "this role").strip()
    text = (
        f"{first} here — I'm interested in a referral for {role}. "
        f"My background ({skills_str}) is a strong match; I'd value an intro via {alias}. Happy to share more."
    )
    return text[:200]


def try_referral_pitch_draft(
    candidate: dict[str, Any],
    employee: dict[str, Any],
    target_role: str,
) -> str | None:
    """Short first-person pitch for a referral request; capped at 200 characters."""
    name = str(candidate.get("name") or "Candidate").strip()
    skills = candidate.get("skills") or []
    if not isinstance(skills, list):
        skills = []
    current = str(candidate.get("currentRole") or "")
    years = candidate.get("yearsExperience")
    bio = str(candidate.get("bio") or "")[:280]
    alias = str(employee.get("alias") or employee.get("visibleAs") or "the referrer").strip()
    stack = employee.get("stack") or []
    if not isinstance(stack, list):
        stack = []
    role = (target_role or "").strip() or "the role"

    prompt = f"""Write one very short referral request message in first person (the job seeker writing to a potential referrer).

STRICT: The entire message must be at most 200 characters (including spaces). Count before you answer.

Context:
- Candidate name: {name}
- Current title: {current}
- Years experience: {years}
- Skills (subset): {json.dumps(skills[:14])}
- Bio excerpt: {json.dumps(bio)}
- Target role they want a referral for: {role}
- Referrer public label: {alias}
- Referrer tech stack hints: {json.dumps(stack[:12])}

Rules:
- Sound human and specific; avoid generic filler ("I am writing to inquire").
- Do not use quotation marks around the message.
- Output ONLY the message body, no title or preamble.
"""
    raw = _generate(prompt)
    if not raw:
        return None
    text = " ".join(raw.strip().replace('"', "").split())
    if not text:
        return None
    if len(text) > 200:
        text = text[:197].rstrip("- ,.;") + "…"
    return text


def try_suggest_skill_gaps(profile: dict) -> list[dict] | None:
    skills = profile.get("skills") or []
    if not isinstance(skills, list):
        skills = []
    prompt = f"""You suggest skill gaps for a job seeker. Return ONLY JSON (no markdown): {{"gaps": [{{"role": "target role title", "company_tier": "short label e.g. FAANG+ or Startup", "missing": ["skill1", "skill2"], "your_match": 0-100, "potential": 0-100, "rationale": "one sentence"}}]}}

Rules:
- 1 to 3 gap objects.
- missing: 3-6 concrete technical or professional skills they should learn (not soft skills only).
- your_match and potential: integers; potential > your_match.
- Base suggestions on: skills listed: {json.dumps(skills[:50])}
- Target / current role context: lookingFor={json.dumps(str(profile.get("lookingFor") or ""))}, currentRole={json.dumps(str(profile.get("currentRole") or ""))}
- Bio excerpt: {json.dumps((str(profile.get("bio") or ""))[:400])}
"""
    data = _parse_json_object(_generate(prompt))
    if not data:
        return None
    gaps = data.get("gaps")
    if not isinstance(gaps, list) or not gaps:
        return None
    out = []
    for g in gaps:
        if not isinstance(g, dict):
            continue
        missing = g.get("missing")
        if not isinstance(missing, list) or not missing:
            continue
        try:
            ym = max(0, min(100, int(g.get("your_match", 0))))
            pot = max(0, min(100, int(g.get("potential", 0))))
        except (TypeError, ValueError):
            continue
        if pot <= ym:
            pot = min(100, ym + 10)
        out.append(
            {
                "role": str(g.get("role") or "Target role").strip(),
                "company_tier": str(g.get("company_tier") or "General").strip(),
                "missing": [str(m).strip() for m in missing if m][:8],
                "your_match": ym,
                "potential": pot,
                "rationale": str(g.get("rationale") or "").strip(),
            }
        )
    return out if out else None
