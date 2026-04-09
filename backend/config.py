import os
import re
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

    Vite tries the next port when 5173 is busy (5174, 5175, …); without those origins here the
    browser shows \"Failed to fetch\" because CORS blocks the response.
    """
    raw = (env_value or "").strip()
    if not raw:
        base = ["http://localhost:5173", "http://127.0.0.1:5173"]
    else:
        seen: set[str] = set()
        base = []
        for o in (x.strip() for x in raw.split(",") if x.strip()):
            for candidate in (o, _origin_localhost_mirror(o)):
                if candidate and candidate not in seen:
                    seen.add(candidate)
                    base.append(candidate)
    return _expand_localhost_vite_ports(base)


def _expand_localhost_vite_ports(origins: list[str]) -> list[str]:
    """Add http(s)://localhost:{5173..5180} and 127.0.0.1 equivalents for any listed dev origin."""
    pat = re.compile(r"^(https?://)(localhost|127\.0\.0\.1):(\d+)/?$")
    seen = set(origins)
    out = list(origins)
    hosts_done: set[tuple[str, str]] = set()
    for o in origins:
        m = pat.match(o.rstrip("/"))
        if not m:
            continue
        scheme, host = m.group(1), m.group(2)
        key = (scheme, host)
        if key in hosts_done:
            continue
        hosts_done.add(key)
        for port in range(5173, 5181):
            url = f"{scheme}{host}:{port}"
            if url not in seen:
                seen.add(url)
                out.append(url)
    return out


def _origin_localhost_mirror(origin: str) -> str | None:
    if "://localhost" in origin:
        return origin.replace("://localhost", "://127.0.0.1", 1)
    if "://127.0.0.1" in origin:
        return origin.replace("://127.0.0.1", "://localhost", 1)
    return None


CORS_ORIGINS = _expand_cors_origins(os.getenv("CORS_ORIGINS", "http://localhost:5173"))
PORT = int(os.getenv("PORT", "8000"))
