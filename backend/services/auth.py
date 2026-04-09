"""Firebase ID token verification middleware."""

from __future__ import annotations
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as fb_auth

_scheme = HTTPBearer(auto_error=False)


async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(_scheme),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    try:
        decoded = fb_auth.verify_id_token(credentials.credentials)
        return decoded
    except fb_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid ID token")
    except fb_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")
