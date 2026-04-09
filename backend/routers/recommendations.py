from fastapi import APIRouter, Depends, HTTPException
from models.schemas import (
    CandidateRecRequest,
    EmployerRecRequest,
    ScoreRequest,
    RecommendationOut,
    ScoreOut,
    SkillGapsRequest,
    SkillGapsOut,
    SkillGapItemOut,
    ReferralDraftRequest,
    ReferralDraftOut,
)
from services.auth import verify_firebase_token
from services.firestore_service import (
    get_candidate_profile,
    get_employee_profile,
    get_all_employees,
    get_all_candidates,
    get_candidate_requests,
)
from engines.recommendation_engine import (
    generate_recommendations,
    generate_employer_recommendations,
    score_candidate,
)
from engines.skill_gap_heuristic import heuristic_skill_gaps
from services.gemini_features import (
    try_suggest_skill_gaps,
    try_referral_pitch_draft,
    default_referral_pitch,
)

router = APIRouter()


@router.post("/candidate", response_model=list[RecommendationOut])
async def candidate_recommendations(
    body: CandidateRecRequest,
    token: dict = Depends(verify_firebase_token),
):
    profile = get_candidate_profile(body.candidateId)
    if not profile:
        raise HTTPException(404, "Candidate profile not found")

    employees = get_all_employees()
    requests = get_candidate_requests(body.candidateId)
    results = generate_recommendations(profile, employees, requests)
    return results


@router.post("/employer", response_model=list[RecommendationOut])
async def employer_recommendations(
    body: EmployerRecRequest,
    token: dict = Depends(verify_firebase_token),
):
    profile = get_employee_profile(body.employeeId)
    if not profile:
        raise HTTPException(404, "Employee profile not found")

    candidates = get_all_candidates()
    results = generate_employer_recommendations(profile, candidates)
    return results


@router.post("/score", response_model=ScoreOut)
async def score_single(
    body: ScoreRequest,
    token: dict = Depends(verify_firebase_token),
):
    candidate = get_candidate_profile(body.candidateId)
    employee = get_employee_profile(body.employeeId)
    if not candidate or not employee:
        raise HTTPException(404, "Profile not found")

    result = score_candidate(candidate, employee)
    if not result:
        raise HTTPException(500, "Scoring failed")
    return result


@router.post("/skill-gaps", response_model=SkillGapsOut)
async def skill_gaps(
    body: SkillGapsRequest,
    token: dict = Depends(verify_firebase_token),
):
    if token.get("uid") != body.candidateId:
        raise HTTPException(403, "Can only load skill gaps for your own account")
    profile = get_candidate_profile(body.candidateId)
    if not profile:
        raise HTTPException(404, "Candidate profile not found")

    gem = try_suggest_skill_gaps(profile)
    if gem:
        return SkillGapsOut(
            gaps=[SkillGapItemOut(**item) for item in gem],
            source="gemini",
        )

    heur = heuristic_skill_gaps(profile)
    return SkillGapsOut(
        gaps=[SkillGapItemOut(**item) for item in heur],
        source="heuristic",
    )


@router.post("/referral-draft", response_model=ReferralDraftOut)
async def referral_request_draft(
    body: ReferralDraftRequest,
    token: dict = Depends(verify_firebase_token),
):
    if token.get("uid") != body.candidateId:
        raise HTTPException(403, "Can only generate drafts for your own account")
    profile = get_candidate_profile(body.candidateId)
    employee = get_employee_profile(body.employeeId)
    if not profile or not employee:
        raise HTTPException(404, "Candidate or employee profile not found")

    target = body.targetRole.strip()
    gem = try_referral_pitch_draft(profile, employee, target)
    if gem:
        return ReferralDraftOut(draft=gem, source="gemini")
    return ReferralDraftOut(
        draft=default_referral_pitch(profile, employee, target),
        source="default",
    )
