from fastapi import APIRouter, Depends, HTTPException
from models.schemas import SimulateRequest, SimulateImprovementRequest, SimulateOut
from services.auth import verify_firebase_token
from services.firestore_service import get_candidate_profile, get_employee_profile
from engines.referral_simulator import simulate_referral, simulate_improvement

router = APIRouter()


@router.post("/simulate-referral", response_model=SimulateOut)
async def run_simulation(
    body: SimulateRequest,
    token: dict = Depends(verify_firebase_token),
):
    candidate = get_candidate_profile(body.candidateId)
    employee = get_employee_profile(body.employeeId)
    if not candidate or not employee:
        raise HTTPException(404, "Profile not found")

    result = simulate_referral(candidate, employee, body.targetRole)
    if not result:
        raise HTTPException(500, "Simulation failed")
    return result


@router.post("/simulate-improvement", response_model=SimulateOut)
async def run_improvement(
    body: SimulateImprovementRequest,
    token: dict = Depends(verify_firebase_token),
):
    candidate = get_candidate_profile(body.candidateId)
    employee = get_employee_profile(body.employeeId)
    if not candidate or not employee:
        raise HTTPException(404, "Profile not found")

    result = simulate_improvement(
        candidate, employee, body.targetRole,
        added_skills=body.addedSkills,
        added_years=body.addedYears,
    )
    if not result:
        raise HTTPException(500, "Improvement simulation failed")
    return result
