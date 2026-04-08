from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from models.schemas import ResumeParseOut
from services.auth import verify_firebase_token
from services.firestore_service import update_candidate_profile
from engines.resume_parser import parse_resume

router = APIRouter()


@router.post("/parse", response_model=ResumeParseOut)
async def parse(
    file: UploadFile = File(...),
    token: dict = Depends(verify_firebase_token),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10 MB)")

    try:
        result = parse_resume(contents)
    except ValueError as e:
        raise HTTPException(422, str(e))

    return ResumeParseOut(**result)


@router.post("/parse-and-apply", response_model=ResumeParseOut)
async def parse_and_apply(
    file: UploadFile = File(...),
    candidateId: str = Form(...),
    token: dict = Depends(verify_firebase_token),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10 MB)")

    try:
        result = parse_resume(contents)
    except ValueError as e:
        raise HTTPException(422, str(e))

    update_data = {}
    if result.get("name"):
        update_data["name"] = result["name"]
    if result.get("currentRole"):
        update_data["currentRole"] = result["currentRole"]
    if result.get("yearsExperience"):
        update_data["yearsExperience"] = result["yearsExperience"]
    if result.get("location"):
        update_data["location"] = result["location"]
    if result.get("lookingFor"):
        update_data["lookingFor"] = result["lookingFor"]
    if result.get("bio"):
        update_data["bio"] = result["bio"]
    if result.get("skills"):
        update_data["skills"] = result["skills"]

    if update_data:
        update_candidate_profile(candidateId, update_data)

    return ResumeParseOut(**result, applied=True)
