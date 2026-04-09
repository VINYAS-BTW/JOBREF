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
