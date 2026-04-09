"""
Resume Parser — Python port using PyMuPDF for PDF text extraction.
Heuristic parsing: section detection, regex extraction, keyword matching.
"""

from __future__ import annotations
import re
import io
from typing import BinaryIO

import fitz  # PyMuPDF


# ── PDF text extraction ─────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> list[str]:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    lines: list[str] = []
    for page in doc:
        text = page.get_text("text")
        for line in text.split("\n"):
            stripped = line.strip()
            if stripped:
                lines.append(stripped)
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
    "software engineer", "senior software engineer", "staff engineer", "principal engineer",
    "frontend engineer", "frontend developer", "backend engineer", "backend developer",
    "full stack engineer", "full stack developer", "fullstack developer",
    "devops engineer", "sre", "site reliability engineer", "platform engineer",
    "data engineer", "data scientist", "ml engineer", "machine learning engineer",
    "mobile engineer", "ios developer", "android developer",
    "tech lead", "engineering manager", "cto", "vp engineering",
    "product manager", "project manager", "qa engineer", "test engineer",
    "cloud engineer", "solutions architect", "web developer",
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
}


def _extract_name(header: list[str]) -> str:
    for line in header[:5]:
        if EMAIL_RE.search(line) or PHONE_RE.search(line):
            continue
        if len(line) > 50:
            continue
        if re.match(r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$", line):
            return line
    return ""


def _extract_role(lines: list[str]) -> str:
    all_text = " ".join(lines).lower()
    for title in sorted(ROLE_TITLES, key=len, reverse=True):
        if title in all_text:
            return title.title()
    return ""


def _extract_years(lines: list[str]) -> int:
    all_text = " ".join(lines)
    date_matches = DATE_RANGE_RE.findall(all_text)
    year_matches = YEAR_RANGE_RE.findall(all_text)

    if not date_matches and not year_matches:
        exp_match = re.search(r"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)", all_text, re.I)
        return int(exp_match.group(1)) if exp_match else 0

    import datetime
    years_set: set[int] = set()
    for start, end in year_matches:
        try:
            s = int(start)
            e = datetime.datetime.now().year if end.lower() in ("present", "current") else int(end)
            years_set.add(e - s)
        except ValueError:
            pass

    return max(years_set) if years_set else len(date_matches)


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


# ── Main ─────────────────────────────────────────────────────────────────────

def parse_resume(file_bytes: bytes) -> dict:
    lines = extract_text_from_pdf(file_bytes)
    if not lines:
        raise ValueError("Could not extract any text from the PDF.")

    sections = _partition_sections(lines)
    all_lines = lines

    email_match = EMAIL_RE.search(" ".join(all_lines[:15]))
    phone_match = PHONE_RE.search(" ".join(all_lines[:15]))

    name = _extract_name(sections.get("header", []))
    email = email_match.group(0) if email_match else ""
    phone = phone_match.group(0) if phone_match else ""

    current_role = _extract_role(sections.get("header", []) + sections.get("experience", [])[:5])
    years_experience = _extract_years(sections.get("experience", []) + sections.get("header", []))
    location = _extract_location(sections.get("header", []))

    skill_lines = sections.get("skills", []) + sections.get("experience", []) + sections.get("projects", [])
    skills = _extract_skills(skill_lines)

    summary_lines = sections.get("summary", [])
    bio = " ".join(summary_lines)[:300] if summary_lines else ""

    looking_for = current_role if current_role else ""

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
        "rawLineCount": len(lines),
        "sectionsFound": [k for k, v in sections.items() if v and k not in ("header", "other")],
    }
