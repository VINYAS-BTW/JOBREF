"""Pydantic request/response models for all API endpoints."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Any


# ── Recommendations ──────────────────────────────────────────────────────────

class CandidateRecRequest(BaseModel):
    candidateId: str

class EmployerRecRequest(BaseModel):
    employeeId: str

class ScoreRequest(BaseModel):
    candidateId: str
    employeeId: str

class TierOut(BaseModel):
    label: str
    color: str
    emoji: str

class BreakdownFactor(BaseModel):
    score: int
    weight: float
    class Config:
        extra = "allow"

class RecommendationOut(BaseModel):
    id: str | None = None
    alias: str = ""
    stack: list[str] = []
    activeReqs: list[str] = []
    companyTier: str = ""
    reputation: float = 3.5
    totalRefs: int = 0
    requested: bool = False
    aiScore: int = 0
    tier: TierOut = TierOut(label="Low Match", color="#3D3B38", emoji="none")
    breakdown: dict[str, Any] = {}
    matchedSkills: list[str] = []
    missingSkills: list[str] = []
    matchedRoles: list[str] = []
    class Config:
        extra = "allow"

class ScoreOut(BaseModel):
    aiScore: int = 0
    tier: TierOut = TierOut(label="Low Match", color="#3D3B38", emoji="none")
    breakdown: dict[str, Any] = {}
    matchedSkills: list[str] = []
    missingSkills: list[str] = []
    matchedRoles: list[str] = []


# ── Referral Simulator ───────────────────────────────────────────────────────

class SimulateRequest(BaseModel):
    candidateId: str
    employeeId: str
    targetRole: str | None = None

class SimulateImprovementRequest(BaseModel):
    candidateId: str
    employeeId: str
    targetRole: str
    addedSkills: list[str] = []
    addedYears: int = 0

class RiskFactor(BaseModel):
    type: str
    severity: str
    label: str
    detail: str

class ExplanationOut(BaseModel):
    evaluation: str = ""
    strengths: list[str] = []
    weaknesses: list[str] = []
    suggestion: str = ""

class SimulateOut(BaseModel):
    matchScore: int = 0
    interviewProbability: int = 0
    hireProbability: int = 0
    riskFactors: list[RiskFactor] = []
    explanation: ExplanationOut = ExplanationOut()
    factors: dict[str, int] = {}
    meta: dict[str, Any] = {}


# ── Shadow Interview ─────────────────────────────────────────────────────────

class InterviewGenerateRequest(BaseModel):
    candidateId: str
    employeeId: str
    targetRole: str = "Software Engineer"

class QuestionOut(BaseModel):
    text: str
    type: str
    domain: str
    tier: str

class InterviewGenerateOut(BaseModel):
    interviewId: str
    questions: list[QuestionOut]

class InterviewSubmitRequest(BaseModel):
    interviewId: str
    answers: list[str]

class InterviewSubmitOut(BaseModel):
    status: str = "evaluating"

class PerQuestionScore(BaseModel):
    question: str
    type: str | None = None
    domain: str | None = None
    depth: str
    techScore: int
    commScore: int
    confScore: int
    keywordsFound: int

class InterviewResultOut(BaseModel):
    status: str = "evaluated"
    technicalScore: int = 0
    communicationScore: int = 0
    confidenceScore: int = 0
    behavioralScore: int = 0
    overallScore: int = 0
    strengths: list[str] = []
    weaknesses: list[str] = []
    recommendation: str = "no"
    recColor: str = "#EF4444"
    recLabel: str = "No"
    aiSummary: str = ""
    perQuestion: list[PerQuestionScore] = []


# ── Resume Parser ────────────────────────────────────────────────────────────

class ResumeParseOut(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    currentRole: str = ""
    yearsExperience: int = 0
    location: str = ""
    lookingFor: str = ""
    skills: list[str] = []
    bio: str = ""
    rawLineCount: int = 0
    sectionsFound: list[str] = []
    applied: bool = False
