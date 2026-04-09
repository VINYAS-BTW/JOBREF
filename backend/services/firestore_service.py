"""Firestore CRUD operations via Firebase Admin SDK."""

from __future__ import annotations
from google.cloud.firestore_v1 import FieldFilter
from config import db
from google.cloud import firestore


def get_candidate_profile(uid: str) -> dict | None:
    doc = db.collection("candidateProfiles").document(uid).get()
    if doc.exists:
        return {"id": doc.id, **doc.to_dict()}
    return None


def get_employee_profile(uid: str) -> dict | None:
    doc = db.collection("employeeProfiles").document(uid).get()
    if doc.exists:
        return {"id": doc.id, **doc.to_dict()}
    return None


def get_all_employees() -> list[dict]:
    docs = db.collection("employeeProfiles").order_by("reputation", direction=firestore.Query.DESCENDING).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_all_candidates() -> list[dict]:
    docs = db.collection("candidateProfiles").order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_candidate_requests(candidate_id: str) -> list[dict]:
    docs = (
        db.collection("referralRequests")
        .where(filter=FieldFilter("candidateId", "==", candidate_id))
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


def update_candidate_profile(uid: str, data: dict) -> None:
    db.collection("candidateProfiles").document(uid).update(data)


# ── Shadow Interviews ────────────────────────────────────────────────────────

def create_shadow_interview(data: dict) -> str:
    ref = db.collection("shadowInterviews").add({
        **data,
        "answers": [],
        "scores": None,
        "status": "generated",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    interview_id = ref[1].id

    db.collection("activity").add({
        "userId": data["candidateId"],
        "type": "interview",
        "text": f"You have a new Shadow Interview to complete for the {data.get('targetRole', '')} role.",
        "createdAt": firestore.SERVER_TIMESTAMP,
    })

    return interview_id


def submit_shadow_answers(interview_id: str, answers: list[str]) -> None:
    db.collection("shadowInterviews").document(interview_id).update({
        "answers": answers,
        "status": "submitted",
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })


def save_shadow_evaluation(interview_id: str, scores: dict) -> None:
    db.collection("shadowInterviews").document(interview_id).update({
        "scores": scores,
        "status": "evaluated",
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })


def get_shadow_interview(interview_id: str) -> dict | None:
    doc = db.collection("shadowInterviews").document(interview_id).get()
    if doc.exists:
        return {"id": doc.id, **doc.to_dict()}
    return None


# ── Hiring committee dashboard (Admin SDK) ───────────────────────────────────

REFERRAL_STATUSES = frozenset({"requested", "approved", "interview", "hired", "rejected"})


def get_all_referrals() -> list[dict]:
    docs = db.collection("referrals").order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
    return [{"id": d.id, **(d.to_dict() or {})} for d in docs]


def get_all_jobs() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for d in db.collection("jobs").stream():
        out[d.id] = {"id": d.id, **(d.to_dict() or {})}
    return out


def get_candidate_map() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for d in db.collection("candidateProfiles").stream():
        out[d.id] = {"id": d.id, **(d.to_dict() or {})}
    return out


def get_employee_map() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for d in db.collection("employeeProfiles").stream():
        out[d.id] = {"id": d.id, **(d.to_dict() or {})}
    return out


def dashboard_metrics() -> dict:
    referrals = get_all_referrals()
    total = len(referrals)
    interviews = sum(1 for r in referrals if r.get("status") in ("interview", "hired"))
    hires = sum(1 for r in referrals if r.get("status") == "hired")
    return {
        "totalReferrals": total,
        "totalInterviews": interviews,
        "totalHires": hires,
        "hireConversion": (hires / total) if total else 0.0,
    }


def top_referrers(limit: int = 5) -> list[dict]:
    docs = (
        db.collection("employeeProfiles")
        .order_by("karmaScore", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    rows = []
    for d in docs:
        data = d.to_dict() or {}
        rows.append(
            {
                "id": d.id,
                "name": data.get("name") or data.get("alias") or d.id,
                "karmaScore": data.get("karmaScore", 0) or 0,
                "successfulReferrals": data.get("successfulReferrals", 0) or 0,
            }
        )
    return rows


def referrals_enriched() -> list[dict]:
    referrals = get_all_referrals()
    jobs = get_all_jobs()
    cands = get_candidate_map()
    emps = get_employee_map()
    rows = []
    for r in referrals:
        jid = r.get("jobId")
        cid = r.get("candidateId")
        eid = r.get("employeeId")
        job = jobs.get(jid, {})
        cand = cands.get(cid, {})
        emp = emps.get(eid, {})
        title = job.get("title") or "Unknown role"
        company = job.get("company")
        job_title = f"{title} · {company}" if company else title
        rows.append(
            {
                **r,
                "candidateName": cand.get("name") or "Unknown candidate",
                "jobTitle": job_title,
                "referrerName": emp.get("name") or "Unknown referrer",
            }
        )
    return rows


def update_referral_status(referral_id: str, new_status: str) -> None:
    if new_status not in REFERRAL_STATUSES:
        raise ValueError("invalid status")

    ref = db.collection("referrals").document(referral_id)
    txn = db.transaction()

    @firestore.transactional
    def _body(transaction) -> None:
        snap = ref.get(transaction=transaction)
        if not snap.exists:
            raise LookupError("referral not found")
        data = snap.to_dict() or {}
        prev = data.get("status")
        employee_id = data.get("employeeId")
        transaction.update(
            ref,
            {"status": new_status, "updatedAt": firestore.SERVER_TIMESTAMP},
        )
        karma_delta = 0
        if new_status == "interview" and prev not in ("interview", "hired"):
            karma_delta += 10
        if new_status == "hired" and prev != "hired":
            karma_delta += 25
        if not employee_id:
            return
        emp_ref = db.collection("employeeProfiles").document(employee_id)
        emp_snap = emp_ref.get(transaction=transaction)
        if not emp_snap.exists:
            return
        patch: dict = {}
        if karma_delta:
            patch["karmaScore"] = firestore.Increment(karma_delta)
        if new_status == "hired" and prev != "hired":
            patch["successfulReferrals"] = firestore.Increment(1)
        if patch:
            transaction.update(emp_ref, patch)

    _body(txn)
