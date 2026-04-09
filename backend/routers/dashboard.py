from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from services import firestore_service as fs
from services.auth import verify_firebase_token

router = APIRouter(prefix="/dashboard", tags=["Hiring Dashboard"])


@router.get("/metrics")
async def get_metrics():
    return fs.dashboard_metrics()


@router.get("/referrals")
async def get_referrals():
    return fs.referrals_enriched()


@router.get("/top-referrers")
async def get_top_referrers(limit: int = 5):
    if limit < 1 or limit > 50:
        raise HTTPException(status_code=400, detail="limit must be 1–50")
    return fs.top_referrers(limit=limit)


class ReferralStatusBody(BaseModel):
    referral_id: str = Field(..., min_length=1)
    new_status: str


@router.post("/referral/update-status")
async def post_update_status(body: ReferralStatusBody):
    if body.new_status not in fs.REFERRAL_STATUSES:
        raise HTTPException(status_code=400, detail="invalid new_status")
    try:
        fs.update_referral_status(body.referral_id, body.new_status)
    except LookupError:
        raise HTTPException(status_code=404, detail="referral not found") from None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None
    return {"ok": True}


class PipelineStatusBody(BaseModel):
    pipeline_id: str = Field(..., min_length=1)
    new_status: str


class PipelineDeleteBody(BaseModel):
    pipeline_id: str = Field(..., min_length=1)


@router.post("/pipeline/update-status")
async def post_pipeline_update_status(
    body: PipelineStatusBody,
    token: dict = Depends(verify_firebase_token),
):
    uid = token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not fs.user_has_hiring_role(uid):
        raise HTTPException(
            status_code=403,
            detail="Your Firestore user document must have role 'hiring' for this action",
        )
    try:
        fs.update_pipeline_status(body.pipeline_id, body.new_status)
    except LookupError:
        raise HTTPException(status_code=404, detail="pipeline not found") from None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None
    return {"ok": True}


@router.post("/pipeline/delete")
async def post_pipeline_delete(
    body: PipelineDeleteBody,
    token: dict = Depends(verify_firebase_token),
):
    uid = token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not fs.user_has_hiring_role(uid):
        raise HTTPException(
            status_code=403,
            detail="Your Firestore user document must have role 'hiring' for this action",
        )
    try:
        fs.delete_pipeline_document(body.pipeline_id)
    except LookupError:
        raise HTTPException(status_code=404, detail="pipeline not found") from None
    return {"ok": True}
