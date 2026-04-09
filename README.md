# RefHire — AI-Powered Job Referral Platform

Full-stack app connecting job seekers, employee referrers, and a hiring committee. The **React** client uses Firebase Auth + Firestore in real time; the **FastAPI** backend runs matching engines, resume parsing (PDF), optional **Google Gemini** features, and **Admin SDK** writes when client security rules block hiring actions.

## Architecture

```
┌─────────────────────────┐      HTTP / JSON       ┌─────────────────────────┐
│     React Frontend      │ ◄──────────────────────►│    FastAPI Backend      │
│  (Vite + Tailwind v4)   │   Bearer ID token       │  (engines + Admin SDK)  │
└──────────┬──────────────┘                         └──────────┬──────────────┘
           │                                                   │
           │  Firebase Client SDK                 Firebase Admin SDK
           │  (Auth + Firestore listeners)        (Firestore reads/writes)
           │                                                   │
           └──────────────────┐  ┌───────────────────────────────┘
                            ▼  ▼
                  ┌───────────────────┐
                  │  Firebase Cloud │
                  │  Auth + Firestore │
                  └───────────────────┘
```

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Database | Cloud Firestore |
| Auth | Firebase (email/password, GitHub OAuth) |
| Resume | PyMuPDF + heuristics (no LLM) |
| Optional AI | Google Gemini (`google-generativeai`): shadow interview, skill gaps, referral pitch draft |
| Rules / indexes | `firestore.rules`, `firestore.indexes.json` (deploy to your Firebase project) |

## Project structure

```
JOBREF/
├── src/                          # React frontend
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── AuthPage.jsx
│   │   ├── CandidateDashboard.jsx
│   │   ├── EmployeeDashboard.jsx
│   │   └── HiringDashboard.jsx   # ATS: referrals + pipeline (role: hiring)
│   ├── components/hiring/        # Metrics, pipeline, tables, cards
│   ├── contexts/AuthContext.jsx
│   ├── firebase/
│   │   ├── config.js
│   │   ├── auth.js
│   │   ├── firestore.js          # Client Firestore helpers
│   │   ├── hiringFirestore.js    # Hiring dashboard listeners + pipeline/referral helpers
│   │   ├── utils.js
│   │   └── seed.js
│   └── services/api.js           # fetch() + Firebase ID token
│
├── backend/
│   ├── main.py
│   ├── config.py                 # Firebase Admin, CORS, PORT
│   ├── engines/
│   │   ├── recommendation_engine.py
│   │   ├── referral_simulator.py
│   │   ├── shadow_interview.py   # Fallback when Gemini unavailable
│   │   ├── resume_parser.py
│   │   └── skill_gap_heuristic.py
│   ├── routers/
│   │   ├── recommendations.py    # match, skill-gaps, referral-draft
│   │   ├── simulator.py
│   │   ├── interview.py
│   │   ├── resume.py
│   │   └── dashboard.py          # hiring metrics + pipeline/referral admin writes
│   ├── models/schemas.py
│   ├── services/
│   │   ├── auth.py
│   │   ├── firestore_service.py
│   │   └── gemini_features.py
│   ├── requirements.txt
│   └── .env.example
│
├── firestore.rules
├── firestore.indexes.json
├── firebase.json                 # `firebase deploy --only firestore:rules`
├── .env.example
└── package.json
```

## Prerequisites

- **Node.js** ≥ 18  
- **Python** ≥ 3.10  
- A **Firebase** project (Auth + Firestore)

## Setup

### 1. Firebase

1. [Firebase Console](https://console.firebase.google.com/) — create or select a project.  
2. Enable **Authentication** (Email/Password; optional GitHub).  
3. Create **Firestore** (production or test mode for dev).  
4. Publish **`firestore.rules`** from this repo (Firestore → Rules).  
5. Deploy composite indexes from **`firestore.indexes.json`** if prompted by the client (Firestore → Indexes).

### 2. Service account (backend)

1. Project settings → **Service accounts** → generate key.  
2. Save as **`backend/serviceAccountKey.json`** (gitignored).

### 3. Environment

**Frontend** — copy `.env.example` → `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_USE_EMULATORS=false
VITE_API_URL=http://localhost:8000
```

**Backend** — copy `backend/.env.example` → `backend/.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
CORS_ORIGINS=http://localhost:5173
PORT=8000
# Optional: GEMINI_API_KEY=...
```

### 4. Install and run

```bash
npm install
npm run dev
```

```bash
cd backend
pip install -r requirements.txt
python main.py
```

- App: `http://localhost:5173`  
- API: `http://localhost:8000`  
- Health: `GET /health`

### 5. Hiring users

Firestore document **`users/{uid}`** must include **`role: "hiring"`** (string, case-insensitive in rules) for the hiring dashboard and for client writes that depend on `isHiring()` in security rules.

Pipeline **status/delete** from the browser may still hit `permission-denied` if rules or user docs are misaligned; the app then retries via **`POST /dashboard/pipeline/*`** using the Admin SDK (backend must be running and the service account must match the same Firebase project).

## API overview

Unless noted, endpoints expect **`Authorization: Bearer <Firebase ID token>`**.

| Area | Examples |
|------|----------|
| Recommendations | `POST /recommendations/candidate`, `/employer`, `/score`, `/skill-gaps`, `/referral-draft` |
| Simulator | `POST /simulate-referral`, `POST /simulate-improvement` |
| Shadow interview | `POST /shadow-interview/generate`, `/submit`, `GET /shadow-interview/{id}/result` |
| Resume | `POST /resume/parse`, `/resume/parse-and-apply` |
| Hiring (dashboard) | `GET /dashboard/metrics`, `/referrals`, `/top-referrers`; `POST /dashboard/pipeline/update-status`, `/pipeline/delete`; `POST /dashboard/referral/update-status` |
| Health | `GET /health` |

**Security note:** Some early `GET /dashboard/*` routes may not verify the token; prefer not exposing the API publicly without authentication or network restrictions. Pipeline/referral mutation routes verify the token and hiring role where implemented.

## Firestore collections (main)

| Collection | Purpose |
|------------|---------|
| `users` | `role`: `candidate` \| `employee` \| `hiring` |
| `candidateProfiles` | Skills, experience, tokens, etc. |
| `employeeProfiles` | `activeReqs`, stack, reputation, karma |
| `referralRequests` | Candidate → employee requests |
| `pipeline` | Forwarded candidates / stages |
| `referrals` | Hiring ATS rows (hiring role) |
| `jobs` | Job postings (hiring) |
| `dashboard_stats` | Aggregates (hiring) |
| `activity` | Notifications |
| `shadowInterviews` | Interview flow |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |

## License

MIT
