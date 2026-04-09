"""Firestore CRUD operations via Firebase Admin SDK."""

from __future__ import annotations

import re

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
PIPELINE_STATUSES = frozenset({"referred", "interviewing", "offer_extended", "hired", "declined"})


def user_has_hiring_role(uid: str) -> bool:
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        return False
    role = (doc.to_dict() or {}).get("role")
    return isinstance(role, str) and role.strip().lower() == "hiring"


def referral_to_pipeline_status(ref_status: str) -> str:
    return {
        "interview": "interviewing",
        "hired": "hired",
        "rejected": "declined",
        "approved": "referred",
        "requested": "referred",
    }.get(ref_status, "referred")


def pipeline_to_referral_status(pipeline_status: str | None) -> str:
    if pipeline_status is None or pipeline_status == "":
        return "approved"
    s = str(pipeline_status)
    if s == "referred":
        return "approved"
    if s in ("interviewing", "offer_extended"):
        return "interview"
    if s == "hired":
        return "hired"
    if s == "declined":
        return "rejected"
    if s in PIPELINE_STATUSES:
        return "approved"
    return "approved"


def pipeline_stage_for_native_status(native: str) -> int:
    return {
        "referred": 1,
        "interviewing": 2,
        "offer_extended": 3,
        "hired": 4,
        "declined": 1,
    }.get(native, 1)


def _normalize_hire_title(s: str | None) -> str:
    if not s or not isinstance(s, str):
        return ""
    return re.sub(r"\s+", " ", s.lower().strip())


def _collect_hire_title_norms(pipeline_role: str | None, job_title_from_doc: str | None) -> set[str]:
    out: set[str] = set()
    for t in (pipeline_role, job_title_from_doc):
        n = _normalize_hire_title(t)
        if n:
            out.add(n)
    return out


def _filter_active_reqs_after_hire(active_reqs: list | None, title_norms: set[str]) -> list | None:
    if not title_norms:
        return None
    req_list = list(active_reqs or [])
    nxt = [r for r in req_list if _normalize_hire_title(str(r)) not in title_norms]
    return nxt if len(nxt) != len(req_list) else None


def close_openings_after_hire(
    employee_id: str,
    *,
    pipeline_role: str | None = None,
    job_id: str | None = None,
) -> None:
    """Remove matching activeReqs, delete the job row(s) for that title (and job_id if set)."""
    if not employee_id:
        return

    job_title_from_doc = ""
    if job_id:
        jsnap = db.collection("jobs").document(job_id).get()
        if jsnap.exists:
            job_title_from_doc = str((jsnap.to_dict() or {}).get("title") or "").strip()

    title_norms = _collect_hire_title_norms(pipeline_role, job_title_from_doc or None)

    emp_ref = db.collection("employeeProfiles").document(employee_id)
    esnap = emp_ref.get()
    if esnap.exists:
        edata = esnap.to_dict() or {}
        new_reqs = _filter_active_reqs_after_hire(edata.get("activeReqs"), title_norms)
        if new_reqs is not None:
            emp_ref.update({"activeReqs": new_reqs})

    if job_id:
        try:
            db.collection("jobs").document(job_id).delete()
        except Exception:
            pass

    if not title_norms:
        return

    for d in db.collection("jobs").stream():
        t = _normalize_hire_title((d.to_dict() or {}).get("title"))
        if t and t in title_norms:
            d.reference.delete()


def update_pipeline_status(pipeline_id: str, new_referral_status: str) -> None:
    """Mirror frontend hiringFirestore.updatePipelineStatus (Admin SDK bypasses client rules)."""
    if new_referral_status not in REFERRAL_STATUSES:
        raise ValueError("invalid status")

    pref = db.collection("pipeline").document(pipeline_id)
    snap = pref.get()
    if not snap.exists:
        raise LookupError("pipeline not found")
    data = snap.to_dict() or {}
    prev_pipeline = data.get("status")
    prev_referral = pipeline_to_referral_status(prev_pipeline)
    next_pipeline = referral_to_pipeline_status(new_referral_status)
    next_stage = pipeline_stage_for_native_status(next_pipeline)

    pref.update(
        {
            "status": next_pipeline,
            "stage": next_stage,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
    )

    karma_delta = 0
    if new_referral_status == "interview" and prev_referral not in ("interview", "hired"):
        karma_delta += 10
    if new_referral_status == "hired" and prev_referral != "hired":
        karma_delta += 25

    employee_id = data.get("employeeId")
    if employee_id:
        emp_ref = db.collection("employeeProfiles").document(employee_id)
        emp_snap = emp_ref.get()
        if emp_snap.exists:
            patch: dict = {}
            if karma_delta:
                patch["karmaScore"] = firestore.Increment(karma_delta)
            if new_referral_status == "hired" and prev_referral != "hired":
                patch["successfulReferrals"] = firestore.Increment(1)
            if patch:
                emp_ref.update(patch)

    if new_referral_status == "hired" and prev_referral != "hired" and employee_id:
        close_openings_after_hire(employee_id, pipeline_role=data.get("role"), job_id=None)


def delete_pipeline_document(pipeline_id: str) -> None:
    ref = db.collection("pipeline").document(pipeline_id)
    snap = ref.get()
    if not snap.exists:
        raise LookupError("pipeline not found")
    ref.delete()


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
    pre = ref.get()
    if not pre.exists:
        raise LookupError("referral not found")
    pre_data = pre.to_dict() or {}
    prev_status = pre_data.get("status")
    hire_employee_id = pre_data.get("employeeId")
    hire_job_id = pre_data.get("jobId")

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

    if new_status == "hired" and prev_status != "hired" and hire_employee_id:
        close_openings_after_hire(hire_employee_id, pipeline_role=None, job_id=hire_job_id)
