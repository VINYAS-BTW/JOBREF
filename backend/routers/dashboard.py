from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services import firestore_service as fs

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
