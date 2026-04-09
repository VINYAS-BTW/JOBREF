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

CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
]
PORT = int(os.getenv("PORT", "8000"))
