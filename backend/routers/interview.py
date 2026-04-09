from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from models.schemas import (
    InterviewGenerateRequest, InterviewGenerateOut,
    InterviewSubmitRequest, InterviewSubmitOut,
    InterviewResultOut, QuestionOut,
)
from services.auth import verify_firebase_token
from services.firestore_service import (
    get_candidate_profile,
    create_shadow_interview,
    submit_shadow_answers,
    save_shadow_evaluation,
    get_shadow_interview,
)
from engines.shadow_interview import generate_questions, evaluate_interview

router = APIRouter()


@router.post("/generate", response_model=InterviewGenerateOut)
async def generate(
    body: InterviewGenerateRequest,
    token: dict = Depends(verify_firebase_token),
):
    profile = get_candidate_profile(body.candidateId)
    skills = (profile or {}).get("skills", [])
    yoe = (profile or {}).get("yearsExperience", 2)

    result = generate_questions(skills, body.targetRole, yoe)
    questions = result["questions"]

    interview_id = create_shadow_interview({
        "candidateId": body.candidateId,
        "employeeId": body.employeeId,
        "targetRole": body.targetRole,
        "questions": questions,
    })

    return InterviewGenerateOut(
        interviewId=interview_id,
        questions=[QuestionOut(**q) for q in questions],
    )


def _evaluate_in_background(interview_id: str, questions: list[dict], answers: list[str]):
    scores = evaluate_interview(questions, answers)
    save_shadow_evaluation(interview_id, scores)


@router.post("/submit", response_model=InterviewSubmitOut)
async def submit(
    body: InterviewSubmitRequest,
    background_tasks: BackgroundTasks,
    token: dict = Depends(verify_firebase_token),
):
    interview = get_shadow_interview(body.interviewId)
    if not interview:
        raise HTTPException(404, "Interview not found")

    submit_shadow_answers(body.interviewId, body.answers)

    background_tasks.add_task(
        _evaluate_in_background,
        body.interviewId,
        interview["questions"],
        body.answers,
    )

    return InterviewSubmitOut(status="evaluating")


@router.get("/{interview_id}/result")
async def get_result(
    interview_id: str,
    token: dict = Depends(verify_firebase_token),
):
    interview = get_shadow_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")

    if interview["status"] != "evaluated":
        return {"status": interview["status"]}

    scores = interview.get("scores", {})
    return InterviewResultOut(status="evaluated", **scores)
