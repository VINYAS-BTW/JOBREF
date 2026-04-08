# RefHire — Job Referral Platform

A trusted platform connecting job seekers with employees for seamless, scalable referrals. Built with React + Firebase.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Framer Motion
- **Backend:** Firebase (Auth + Cloud Firestore)
- **Icons:** Lucide React

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** and follow the wizard
3. Enable **Google Analytics** (optional)

### 2. Enable Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. (Optional) Enable **GitHub** provider:
   - Create a GitHub OAuth App at [GitHub Developer Settings](https://github.com/settings/developers)
   - Set callback URL to `https://YOUR-PROJECT.firebaseapp.com/__/auth/handler`
   - Copy Client ID & Secret into Firebase

### 3. Create Firestore Database

1. In Firebase Console → **Firestore Database** → **Create database**
2. Choose **Start in test mode** (for development)
3. Select your preferred region
4. After creation, go to **Rules** tab and paste the contents of `firestore.rules`

### 4. Create Firestore Indexes

Create these composite indexes in Firebase Console → **Firestore** → **Indexes**:

| Collection | Fields | Order |
|---|---|---|
| `referralRequests` | `candidateId` ASC, `createdAt` DESC | |
| `referralRequests` | `employeeId` ASC, `status` ASC, `createdAt` DESC | |
| `pipeline` | `employeeId` ASC, `createdAt` DESC | |
| `activity` | `userId` ASC, `createdAt` DESC | |

### 5. Get Firebase Config

1. In Firebase Console → **Project Settings** → **General**
2. Under **Your apps**, click the web icon (`</>`) to register a web app
3. Copy the Firebase config values

### 6. Configure Environment Variables

Create a `.env` file in the project root:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Running Locally

```bash
npm install
npm run dev
```

## How It Works

### For Job Seekers (Candidates)
1. Register with email or GitHub
2. Set up your profile with skills and tech stack
3. Browse anonymous referrers matched to your stack via AI scoring
4. Send referral requests using tokens (3/month)
5. Track request status (pending → accepted → hired)

### For Referrers (Employees)
1. Register with email, company, and tech stack
2. Receive referral requests from matched candidates
3. Review candidate proof-of-work (GitHub, LeetCode, pitch)
4. Accept to reveal identity or pass — your identity stays anonymous until you accept
5. Track pipeline and earn bounties for successful hires

### Key Features
- **Anonymous by default** — identities are only revealed on mutual opt-in
- **AI match scoring** — candidates are ranked by tech stack overlap, referrer reputation, and company fit
- **Token-gated requests** — candidates get 3 tokens/month, preventing spam
- **Reputation system** — referrers earn reputation from successful hires
- **Bounty tracking** — tiered earnings based on trust score
