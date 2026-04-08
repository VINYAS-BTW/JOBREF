from fastapi import APIRouter, Depends, HTTPException
from models.schemas import (
    CandidateRecRequest, EmployerRecRequest, ScoreRequest,
    RecommendationOut, ScoreOut,
)
from services.auth import verify_firebase_token
from services.firestore_service import (
    get_candidate_profile, get_employee_profile,
    get_all_employees, get_all_candidates, get_candidate_requests,
)
from engines.recommendation_engine import (
    generate_recommendations, generate_employer_recommendations, score_candidate,
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
