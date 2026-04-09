"""
Resume Parser — PyMuPDF text extraction + heuristics for name, role, skills.
Uses block-ordered text (top-to-bottom, left-to-right) for more reliable line order.
"""

from __future__ import annotations
import re
import datetime
import fitz  # PyMuPDF


# ── PDF text extraction ─────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> list[str]:
    """
    Prefer spatial block order — many resume PDFs reorder badly with plain get_text('text').
    Falls back to simple text extraction if blocks are empty.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    lines: list[str] = []
    try:
        for page in doc:
            page_lines: list[str] = []
            blocks = page.get_text("blocks")
            if blocks:

                def _sort_key(b):
                    y = float(b[1])
                    x = float(b[0])
                    return (round(y / 12) * 12, x)

                for b in sorted(blocks, key=_sort_key):
                    raw = b[4] if len(b) > 4 else ""
                    if not isinstance(raw, str):
                        continue
                    for part in raw.split("\n"):
                        stripped = part.strip()
                        if stripped:
                            page_lines.append(stripped)
            if not page_lines:
                text = page.get_text("text")
                for line in text.split("\n"):
                    stripped = line.strip()
                    if stripped:
                        page_lines.append(stripped)
            lines.extend(page_lines)
    finally:
        doc.close()
    return lines


# ── Section detection ────────────────────────────────────────────────────────

SECTION_PATTERNS: dict[str, re.Pattern] = {
    "summary":    re.compile(r"^(summary|about\s+me|profile|objective|professional\s+summary)", re.I),
    "experience": re.compile(r"^(experience|work\s+experience|employment|professional\s+experience|work\s+history)", re.I),
    "education":  re.compile(r"^(education|academic|qualifications|degrees)", re.I),
    "skills":     re.compile(r"^(skills|technical\s+skills|core\s+competencies|technologies|tech\s+stack)", re.I),
    "projects":   re.compile(r"^(projects|personal\s+projects|portfolio)", re.I),
    "certifications": re.compile(r"^(certifications?|licenses?|credentials)", re.I),
}


def _detect_section(line: str) -> str | None:
    clean = re.sub(r"[:\-–—|]", "", line).strip()
    for section, pattern in SECTION_PATTERNS.items():
        if pattern.match(clean):
            return section
    return None


def _partition_sections(lines: list[str]) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {"header": [], "summary": [], "experience": [], "education": [], "skills": [], "projects": [], "certifications": [], "other": []}
    current = "header"

    for line in lines:
        sec = _detect_section(line)
        if sec:
            current = sec
            continue
        sections.setdefault(current, []).append(line)

    return sections


# ── Extraction helpers ───────────────────────────────────────────────────────

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}")
LOCATION_RE = re.compile(r"(?:(?:located|based)\s+(?:in|at)\s+)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2,})")
DATE_RANGE_RE = re.compile(r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|[Pp]resent|[Cc]urrent)", re.I)
YEAR_RANGE_RE = re.compile(r"(20\d{2})\s*[-–—to]+\s*(20\d{2}|[Pp]resent|[Cc]urrent)")

ROLE_TITLES = [
    "senior software engineer", "senior software developer", "staff software engineer",
    "principal software engineer", "lead software engineer", "associate software engineer",
    "software engineer", "software developer", "developer", "programmer",
    "staff engineer", "principal engineer",
    "frontend engineer", "front-end engineer", "frontend developer", "front end developer",
    "backend engineer", "back-end engineer", "backend developer", "back end developer",
    "full stack engineer", "full-stack engineer", "full stack developer", "fullstack developer",
    "devops engineer", "site reliability engineer", "platform engineer",
    "data engineer", "data scientist", "ml engineer", "machine learning engineer",
    "mobile engineer", "ios developer", "android developer", "mobile developer",
    "tech lead", "technical lead", "engineering manager", "engineering director",
    "cto", "vp engineering", "vp of engineering", "head of engineering",
    "product manager", "technical program manager", "project manager",
    "qa engineer", "sdet", "test engineer", "quality assurance engineer",
    "cloud engineer", "solutions architect", "enterprise architect",
    "web developer", "application developer", "systems engineer",
    "security engineer", "network engineer", "database administrator", "dba",
    "ui engineer", "ux engineer", "product engineer", "member of technical staff", "mts",
    "intern", "software engineering intern", "graduate software engineer",
]

SKILL_DICTIONARY: dict[str, str] = {
    "react": "React", "react.js": "React", "reactjs": "React",
    "vue": "Vue", "vue.js": "Vue", "vuejs": "Vue",
    "angular": "Angular", "angularjs": "Angular",
    "svelte": "Svelte", "next.js": "Next.js", "nextjs": "Next.js",
    "nuxt": "Nuxt", "nuxt.js": "Nuxt",
    "node": "Node.js", "node.js": "Node.js", "nodejs": "Node.js",
    "express": "Express", "express.js": "Express",
    "nestjs": "NestJS", "nest.js": "NestJS",
    "django": "Django", "flask": "Flask", "fastapi": "FastAPI",
    "spring": "Spring", "spring boot": "Spring Boot",
    "ruby on rails": "Rails", "rails": "Rails", "laravel": "Laravel",
    "javascript": "JavaScript", "typescript": "TypeScript",
    "python": "Python", "java": "Java", "go": "Go", "golang": "Go",
    "rust": "Rust", "c++": "C++", "c#": "C#",
    "ruby": "Ruby", "php": "PHP", "swift": "Swift", "kotlin": "Kotlin",
    "scala": "Scala", "elixir": "Elixir", "dart": "Dart",
    "html": "HTML", "css": "CSS", "sass": "Sass", "scss": "Sass",
    "tailwind": "Tailwind CSS", "tailwindcss": "Tailwind CSS",
    "bootstrap": "Bootstrap", "material ui": "Material UI", "mui": "Material UI",
    "postgresql": "PostgreSQL", "postgres": "PostgreSQL",
    "mysql": "MySQL", "mongodb": "MongoDB", "mongo": "MongoDB",
    "redis": "Redis", "elasticsearch": "Elasticsearch",
    "firebase": "Firebase", "supabase": "Supabase",
    "dynamodb": "DynamoDB", "sqlite": "SQLite",
    "prisma": "Prisma", "sequelize": "Sequelize", "mongoose": "Mongoose",
    "graphql": "GraphQL", "rest": "REST", "grpc": "gRPC",
    "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
    "aws": "AWS", "gcp": "GCP", "azure": "Azure",
    "terraform": "Terraform", "ansible": "Ansible",
    "jenkins": "Jenkins", "github actions": "GitHub Actions",
    "nginx": "Nginx", "linux": "Linux",
    "git": "Git", "github": "GitHub", "gitlab": "GitLab",
    "webpack": "Webpack", "vite": "Vite",
    "jest": "Jest", "cypress": "Cypress", "playwright": "Playwright",
    "tensorflow": "TensorFlow", "pytorch": "PyTorch",
    "pandas": "Pandas", "numpy": "NumPy",
    "scikit-learn": "scikit-learn", "sklearn": "scikit-learn",
    "opencv": "OpenCV", "keras": "Keras",
    "spark": "Apache Spark", "hadoop": "Hadoop",
    "kafka": "Kafka", "rabbitmq": "RabbitMQ",
    "react native": "React Native", "flutter": "Flutter",
    "figma": "Figma", "jira": "Jira",
    "sql": "SQL", "nosql": "NoSQL",
    "agile": "Agile", "scrum": "Scrum",
    "ci/cd": "CI/CD", "devops": "DevOps",
    "machine learning": "Machine Learning", "deep learning": "Deep Learning",
    "nlp": "NLP", "computer vision": "Computer Vision",
    "vue3": "Vue", "vue 3": "Vue",
    "redux": "Redux", "mobx": "MobX", "zustand": "Zustand",
    "spring boot": "Spring Boot", "springboot": "Spring Boot",
    ".net": ".NET", "dotnet": ".NET", "asp.net": "ASP.NET",
    "rabbitmq": "RabbitMQ", "rabbit mq": "RabbitMQ",
    "snowflake": "Snowflake", "bigquery": "BigQuery", "big query": "BigQuery",
    "tableau": "Tableau", "power bi": "Power BI",
    "linux": "Linux", "unix": "Unix", "bash": "Bash", "shell": "Shell",
    "oauth": "OAuth", "jwt": "JWT", "oauth2": "OAuth",
    "websocket": "WebSocket", "websockets": "WebSocket",
    "microservices": "Microservices", "microservice": "Microservices",
}

_NAME_SKIP = re.compile(
    r"^(resume|cv|curriculum\s+vitae|phone|email|e-mail|linkedin|github|portfolio|"
    r"summary|objective|experience|education|skills|projects|contact|about)\b",
    re.I,
)


def _line_has_contact_noise(s: str) -> bool:
    return bool(EMAIL_RE.search(s) or PHONE_RE.search(s) or re.search(r"https?://|linkedin\.com|github\.com", s, re.I))


def _looks_like_person_name(line: str) -> bool:
    s = line.strip()
    if len(s) < 3 or len(s) > 70:
        return False
    if _line_has_contact_noise(s) or _NAME_SKIP.match(s):
        return False
    if re.search(r"\d{4}\s*[-–—]", s) or re.match(r"^\d+[\d\s\-().+]+$", s):
        return False
    if re.search(
        r"\b(engineer|developer|architect|manager|scientist|designer|consultant|"
        r"analyst|specialist|intern|trainee|lead|director|officer|technician|researcher)\b",
        s,
        re.I,
    ):
        return False
    # 2–6 tokens; letters, hyphens, apostrophes, periods (initials)
    tokens = re.findall(r"[A-Za-z][A-Za-z'\-.]*|[A-Za-z]\.", s)
    if len(tokens) < 2 or len(tokens) > 6:
        return False
    letter_ratio = sum(c.isalpha() for c in s) / max(len(s), 1)
    if letter_ratio < 0.65:
        return False
    return True


def _normalize_person_name(line: str) -> str:
    """Normalize ALL-CAPS header names; leave already-mixed case as-is."""
    s = line.strip()
    if s.isupper():
        return s.title()
    return s


def _extract_name_from_top(lines: list[str]) -> str:
    """Scan the top of the document — name is often line 1–3 regardless of section headers."""
    for line in lines[:28]:
        s = line.strip()
        if not s or _detect_section(s):
            continue
        if _line_has_contact_noise(s):
            continue
        if not _looks_like_person_name(s):
            continue
        # Title-case line like "JANE DOE"
        if s.isupper():
            return _normalize_person_name(s)
        if re.match(r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}$", s):
            return s
        if re.match(r"^[A-Z][a-z]+(?:\s+[A-Z]\.?)(?:\s+[A-Z][a-z]+)+$", s):
            return s
        # Mixed / international: still 2+ capitalized word starts
        if re.match(r"^([A-Z][a-zA-Z'\-.]+\s+){1,5}[A-Z][a-zA-Z'\-.]+$", s):
            return _normalize_person_name(s)
    return ""


def _extract_role_header_line(lines: list[str], name: str) -> str:
    """
    Job title often appears immediately under the name (before contact or summary).
    """
    name_lower = (name or "").lower()
    for line in lines[:14]:
        s = line.strip()
        if not s or len(s) > 120:
            continue
        if _detect_section(s) or _line_has_contact_noise(s):
            continue
        if re.match(r"^\d{4}\s*[-–—]", s) or (len(s) > 88 and re.search(r"\b20\d{2}\b", s)):
            continue
        if name and name_lower and s.lower() == name_lower:
            continue
        if _looks_like_person_name(s) and (not name or s != name):
            continue
        if re.search(
            r"\b(engineer|developer|architect|manager|lead|scientist|designer|consultant|"
            r"analyst|specialist|administrator|intern|trainee|director|officer|"
            r"programmer|technician|researcher|associate|executive)\b",
            s,
            re.I,
        ):
            s = re.sub(r"\s+", " ", s)
            s = re.split(r"\s*[|•·]\s*", s)[0].strip()
            if len(s) > 100:
                s = s[:97] + "…"
            return s
    return ""


def _role_phrase_in_text(phrase: str, haystack: str) -> bool:
    """Avoid matching 'intern' inside 'internal', etc."""
    if len(phrase) <= 5:
        return bool(re.search(r"(?<![a-z])" + re.escape(phrase) + r"(?![a-z])", haystack))
    return phrase in haystack


def _extract_role(lines: list[str]) -> str:
    all_text = " ".join(lines).lower()
    for title in sorted(ROLE_TITLES, key=len, reverse=True):
        if _role_phrase_in_text(title, all_text):
            return title.title()
    return ""


def _extract_years(lines: list[str]) -> int:
    all_text = " ".join(lines)
    date_matches = DATE_RANGE_RE.findall(all_text)
    year_matches = YEAR_RANGE_RE.findall(all_text)

    if not date_matches and not year_matches:
        exp_match = re.search(r"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)", all_text, re.I)
        return int(exp_match.group(1)) if exp_match else 0

    years_set: set[int] = set()
    for start, end in year_matches:
        try:
            s = int(start)
            e = datetime.datetime.now().year if end.lower() in ("present", "current") else int(end)
            years_set.add(max(0, e - s))
        except ValueError:
            pass

    if years_set:
        return max(years_set)
    return max(1, len(date_matches)) if date_matches else 0


def _extract_skills(lines: list[str]) -> list[str]:
    text = " ".join(lines).lower()
    text = re.sub(r"[,;|/•·]", " ", text)
    found: dict[str, str] = {}

    for key, label in sorted(SKILL_DICTIONARY.items(), key=lambda x: len(x[0]), reverse=True):
        pattern = r"(?<![a-zA-Z])" + re.escape(key) + r"(?![a-zA-Z])"
        if re.search(pattern, text):
            canonical = label.lower()
            if canonical not in found:
                found[canonical] = label

    return list(found.values())[:25]


def _extract_location(lines: list[str]) -> str:
    for line in lines[:10]:
        m = LOCATION_RE.search(line)
        if m:
            return m.group(1)
    return ""


def _line_is_bullet(line: str) -> bool:
    s = line.lstrip()
    return bool(s.startswith(("-", "•", "*", "·", "▪", "◦")))


def _is_job_header_line(line: str) -> bool:
    """Heuristic: new employment row in the experience section."""
    s = line.strip()
    if len(s) < 4 or len(s) > 160:
        return False
    if DATE_RANGE_RE.search(s) or YEAR_RANGE_RE.search(s):
        return True
    if re.search(r"\s+at\s+", s, re.I):
        return True
    if s.count("|") >= 1 and len(s) < 110:
        return True
    if re.search(r"\b20\d{2}\s*[-–—]\s*(20\d{2}|[Pp]resent|[Cc]urrent)\b", s):
        return True
    return False


def _parse_job_block(lines: list[str]) -> dict[str, str]:
    """Turn one experience chunk into company / title / dates / summary."""
    if not lines:
        return {"company": "", "title": "", "dates": "", "summary": ""}
    header = lines[0].strip()
    body = [ln.strip() for ln in lines[1:] if ln.strip()]
    summary_text = " ".join(body).strip()
    if len(summary_text) > 420:
        summary_text = summary_text[:417] + "..."

    dates = ""
    dm = DATE_RANGE_RE.search(header)
    if dm:
        dates = dm.group(0).strip()
    else:
        ym = YEAR_RANGE_RE.search(header)
        if ym:
            dates = ym.group(0).strip()

    header_wo = header
    if dates:
        header_wo = header.replace(dates, " ")
        header_wo = re.sub(r"\s+", " ", header_wo).strip(" |-–—•")

    title, company = "", ""
    at_m = re.search(r"^(.+?)\s+at\s+(.+)$", header_wo, re.I)
    if at_m:
        title = at_m.group(1).strip(" |-–—")
        company = at_m.group(2).strip(" |-–—")
    elif "|" in header_wo:
        parts = [p.strip() for p in re.split(r"\s*\|\s*", header_wo, 1)]
        if len(parts) >= 2:
            title, company = parts[0], parts[1]
    elif re.search(r"[—–]", header_wo):
        parts = re.split(r"\s*[—–]\s*", header_wo, 1)
        title, company = parts[0].strip(), parts[1].strip() if len(parts) > 1 else ""
    elif re.search(
        r"\b(engineer|developer|manager|analyst|architect|lead|consultant|designer|scientist|intern|specialist|director)\b",
        header_wo,
        re.I,
    ):
        title = header_wo
    else:
        company = header_wo

    return {
        "title": title[:180],
        "company": company[:180],
        "dates": dates[:120],
        "summary": summary_text,
    }


def _extract_work_history(exp_lines: list[str]) -> list[dict[str, str]]:
    lines = [ln.strip() for ln in exp_lines if ln.strip()]
    if not lines:
        return []

    paras: list[list[str]] = []
    cur: list[str] = []
    for ln in lines:
        if _is_job_header_line(ln) and cur:
            paras.append(cur)
            cur = [ln]
        elif _is_job_header_line(ln) and not cur:
            cur = [ln]
        else:
            if not cur:
                cur = [ln]
            else:
                cur.append(ln)
    if cur:
        paras.append(cur)

    out: list[dict[str, str]] = []
    for block in paras[:12]:
        row = _parse_job_block(block)
        if row.get("company") or row.get("title") or row.get("summary"):
            out.append(row)
    return out


# ── Main ─────────────────────────────────────────────────────────────────────

def parse_resume_from_lines(lines: list[str]) -> dict:
    """Heuristic parse from extracted PDF lines (PyMuPDF + regex / keywords)."""
    sections = _partition_sections(lines)
    all_lines = lines

    head_blob = " ".join(all_lines[:28])
    email_match = EMAIL_RE.search(head_blob)
    phone_match = PHONE_RE.search(head_blob)

    name = _extract_name_from_top(lines)
    email = email_match.group(0) if email_match else ""
    phone = phone_match.group(0) if phone_match else ""

    role_context = (
        sections.get("header", [])
        + sections.get("summary", [])[:15]
        + sections.get("experience", [])[:40]
    )
    header_role = _extract_role_header_line(lines, name)
    pool_role = _extract_role(role_context)
    current_role = header_role or pool_role

    years_experience = _extract_years(
        sections.get("experience", []) + sections.get("header", []) + sections.get("summary", [])
    )
    location = _extract_location(sections.get("header", []))

    skill_lines = (
        sections.get("skills", [])
        + sections.get("experience", [])
        + sections.get("projects", [])
        + sections.get("summary", [])[:25]
        + lines[:30]
    )
    skills = _extract_skills(skill_lines)
    if len(skills) < 4:
        merged: dict[str, str] = {}
        for s in skills:
            merged[s.lower()] = s
        for s in _extract_skills(lines):
            merged.setdefault(s.lower(), s)
        skills = list(merged.values())[:25]

    summary_lines = sections.get("summary", [])
    bio = " ".join(summary_lines)[:300] if summary_lines else ""

    looking_for = current_role if current_role else ""

    work_history = _extract_work_history(sections.get("experience", []))

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "currentRole": current_role,
        "yearsExperience": years_experience,
        "location": location,
        "lookingFor": looking_for,
        "skills": skills,
        "bio": bio,
        "workHistory": work_history,
        "rawLineCount": len(lines),
        "sectionsFound": [k for k, v in sections.items() if v and k not in ("header", "other")],
    }


def parse_resume(file_bytes: bytes) -> dict:
    lines = extract_text_from_pdf(file_bytes)
    if not lines:
        raise ValueError("Could not extract any text from the PDF.")
    return parse_resume_from_lines(lines)
