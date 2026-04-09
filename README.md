# RefHire — AI-Powered Job Referral Platform

A full-stack platform connecting job seekers with employees for smart, anonymous referrals. Features AI-powered resume parsing, recommendation matching, referral simulation, and shadow interviews — all backed by a dedicated Python engine.

## Architecture

```
┌─────────────────────────┐      HTTP / JSON       ┌─────────────────────────┐
│     React Frontend      │ ◄──────────────────────►│    FastAPI Backend      │
│  (Vite + Tailwind v4)   │   Bearer token auth     │  (AI Engines + CRUD)   │
└──────────┬──────────────┘                         └──────────┬──────────────┘
           │                                                   │
           │  Firebase Client SDK                Firebase Admin SDK
           │  (Auth + Firestore listeners)       (Firestore reads/writes)
           │                                                   │
           └──────────────────┐  ┌─────────────────────────────┘
                              ▼  ▼
                    ┌───────────────────┐
                    │  Firebase Cloud   │
                    │  Auth + Firestore │
                    └───────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons |
| Backend | Python FastAPI, Uvicorn |
| Database | Firebase Cloud Firestore |
| Auth | Firebase Authentication (Email/Password, GitHub OAuth) |
| Resume Parsing | PyMuPDF (heuristic, no LLM) |
| AI Engines | Custom weighted-scoring algorithms (no external AI APIs) |

## Project Structure

```
JOBREF/
├── src/                          # React frontend
│   ├── pages/
│   │   ├── LandingPage.jsx       # Public landing page
│   │   ├── AuthPage.jsx          # Sign-in / Register
│   │   ├── CandidateDashboard.jsx
│   │   └── EmployeeDashboard.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx       # Global auth state
│   ├── firebase/
│   │   ├── config.js             # Firebase app init
│   │   ├── auth.js               # Auth operations + profile creation
│   │   ├── firestore.js          # Firestore subscriptions & CRUD
│   │   ├── utils.js              # Helpers (timeAgo, etc.)
│   │   └── seed.js               # Demo data seeder
│   └── services/
│       └── api.js                # HTTP client with Firebase token injection
│
├── backend/                      # FastAPI backend
│   ├── main.py                   # App entry point
│   ├── config.py                 # Firebase Admin init, env config
│   ├── engines/
│   │   ├── recommendation_engine.py  # Candidate ↔ Employee matching
│   │   ├── referral_simulator.py     # Interview/hire probability prediction
│   │   ├── shadow_interview.py       # Question generation + answer evaluation
│   │   └── resume_parser.py          # PDF → structured profile (PyMuPDF)
│   ├── routers/
│   │   ├── recommendations.py    # /recommendations/*
│   │   ├── simulator.py          # /simulate-referral, /simulate-improvement
│   │   ├── interview.py          # /shadow-interview/*
│   │   └── resume.py             # /resume/*
│   ├── models/
│   │   └── schemas.py            # Pydantic request/response models
│   ├── services/
│   │   ├── auth.py               # Firebase ID token verification
│   │   └── firestore_service.py  # Firestore CRUD via Admin SDK
│   ├── requirements.txt
│   └── .env.example
│
├── firestore.rules               # Security rules
├── .env.example                  # Frontend env template
└── package.json
```

## Prerequisites

- **Node.js** >= 18
- **Python** >= 3.10
- A **Firebase** project with Authentication and Firestore enabled

## Setup

### 1. Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project (or use an existing one).
2. Enable **Authentication** → Sign-in method → turn on **Email/Password** (and optionally **GitHub**).
3. Create a **Firestore Database** in your preferred region (start in test mode for development).
4. Apply the security rules from `firestore.rules` in the Firestore **Rules** tab.

### 2. Firebase Service Account Key (for backend)

1. In Firebase Console → **Project Settings** (gear icon) → **Service Accounts**.
2. Click **"Generate New Private Key"** and download the JSON file.
3. Save it as `backend/serviceAccountKey.json`.

> This file is gitignored and should never be committed.

### 3. Environment Variables

**Frontend** — copy `.env.example` to `.env` and fill in your Firebase config:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_USE_EMULATORS=false
VITE_API_URL=http://localhost:8000
```

**Backend** — copy `backend/.env.example` to `backend/.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
CORS_ORIGINS=http://localhost:5173
PORT=8000
```

### 4. Install & Run

**Frontend:**

```bash
npm install
npm run dev
```

**Backend:**

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:8000`.

## API Endpoints

All endpoints require a Firebase ID token in the `Authorization: Bearer <token>` header.

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recommendations/candidate` | Get ranked employee recommendations for a candidate |
| POST | `/recommendations/employer` | Get ranked candidate recommendations for an employer |
| POST | `/recommendations/score` | Score a specific candidate–employee pair |

### Referral Simulator

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/simulate-referral` | Predict interview/hire probability with risk factors |
| POST | `/simulate-improvement` | Re-simulate after hypothetical skill/experience additions |

### Shadow Interview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/shadow-interview/generate` | Generate personalized technical + behavioral questions |
| POST | `/shadow-interview/submit` | Submit answers (triggers async evaluation) |
| GET | `/shadow-interview/{id}/result` | Retrieve evaluation scores and recommendation |

### Resume Parser

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/resume/parse` | Upload PDF → extract structured profile data |
| POST | `/resume/parse-and-apply` | Parse PDF and save results to candidate's Firestore profile |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Returns `{ "status": "ok" }` |

## Features

### For Candidates
- **Resume Upload** — upload a PDF and have it auto-parsed into your profile (skills, experience, role, contact info)
- **AI Recommendations** — ranked list of anonymous referrers matched to your skills, with tier badges and score breakdowns
- **Shadow Interview** — complete a short AI-generated technical interview before referral acceptance
- **Referral Requests** — send up to 3 token-gated requests per month
- **Activity Feed** — real-time notifications for request status changes

### For Employees / Referrers
- **Talent Scout** — AI-ranked candidates matching your company's tech stack
- **Referral Simulator** — predict interview and hire probability before accepting a referral, with risk factor analysis
- **Shadow Interview Results** — review structured evaluation scores before committing to a referral
- **Pipeline Tracking** — monitor referred candidates through hiring stages
- **Reputation System** — earn reputation points from successful referrals

### Platform
- **Anonymous by default** — identities are revealed only on mutual opt-in
- **Token-gated requests** — prevents spam, candidates get 3 tokens/month
- **Real-time sync** — Firestore `onSnapshot` listeners for instant UI updates
- **Responsive design** — dark-themed modern UI with Framer Motion animations

## Firestore Collections

| Collection | Description |
|------------|-------------|
| `users` | Auth metadata (uid, email, role, displayName) |
| `candidateProfiles` | Skills, experience, bio, resume data, tokens |
| `employeeProfiles` | Company, stack, reputation, referral count |
| `referralRequests` | Candidate → Employee referral requests with status |
| `pipeline` | Accepted referrals tracked through hiring stages |
| `activity` | User notification feed |
| `shadowInterviews` | Generated questions, submitted answers, evaluation scores |

## Scoring & Matching

The recommendation engine uses multi-factor weighted scoring:

- **Skill Match (35%)** — canonical normalization with alias resolution, fuzzy matching, and category-aware cross-matching
- **Domain/Role Fit (20%)** — inferred domain compatibility between candidate targets and employee stack
- **Experience Alignment (15%)** — years of experience relative to role seniority expectations
- **Referrer Credibility (15%)** — reputation score and successful referral history
- **Profile Depth (10%)** — completeness signals (GitHub, portfolio, pitch quality)
- **Activity Signals (5%)** — recent platform engagement

Results are grouped into tiers: **Perfect Match** (85+), **Strong Match** (70–84), **Good Match** (55–69), **Partial Match** (40–54), **Low Match** (<40).

## License

MIT
