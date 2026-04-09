import os
import sys
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, auth as fb_auth

load_dotenv()

_cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./serviceAccountKey.json")

if not firebase_admin._apps:
    if os.path.exists(_cred_path):
        cred = credentials.Certificate(_cred_path)
        firebase_admin.initialize_app(cred)
    else:
        print(
            "\n╔══════════════════════════════════════════════════════════════╗\n"
            "║  Firebase service account key not found!                    ║\n"
            "╠══════════════════════════════════════════════════════════════╣\n"
            "║  1. Go to: https://console.firebase.google.com             ║\n"
            "║  2. Select your project (jobref-f0f3e)                     ║\n"
            "║  3. Project Settings (gear icon) → Service Accounts        ║\n"
            "║  4. Click 'Generate New Private Key'                       ║\n"
            "║  5. Save the file as:                                      ║\n"
            f"║     {os.path.abspath(_cred_path):<55}║\n"
            "╚══════════════════════════════════════════════════════════════╝\n"
        )
        sys.exit(1)

db = firestore.client()


def _expand_cors_origins(env_value: str) -> list[str]:
    """
    Browsers send different Origin values for the same dev server (localhost vs 127.0.0.1).
    If only one is listed, add the other so OPTIONS preflight does not fail with 400/disabled CORS.
    """
    raw = (env_value or "").strip()
    if not raw:
        return ["http://localhost:5173", "http://127.0.0.1:5173"]
    seen: set[str] = set()
    out: list[str] = []
    for o in (x.strip() for x in raw.split(",") if x.strip()):
        for candidate in (o, _origin_localhost_mirror(o)):
            if candidate and candidate not in seen:
                seen.add(candidate)
                out.append(candidate)
    return out


def _origin_localhost_mirror(origin: str) -> str | None:
    if "://localhost" in origin:
        return origin.replace("://localhost", "://127.0.0.1", 1)
    if "://127.0.0.1" in origin:
        return origin.replace("://127.0.0.1", "://localhost", 1)
    return None


CORS_ORIGINS = _expand_cors_origins(os.getenv("CORS_ORIGINS", "http://localhost:5173"))
PORT = int(os.getenv("PORT", "8000"))
