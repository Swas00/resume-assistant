# Resume Assistant 🎯

AI-powered resume analysis, job matching, and interview preparation tool for tech placements.

## Features

### ✅ Currently Live (backend API)
- Resume upload & parsing (PDF/DOCX) — text extraction in the backend, structured parsing in the AI service
- Job description upload (PDF/DOCX)
- Skill matching (0-100 score) against a job's required skills
- AI-powered suggestions and tailored resume bullets (Claude API)
- Tailored resume generation (`POST /api/generated-resumes/tailor`)
- JWT authentication with email verification and refresh tokens

### 🚧 In Progress
- Frontend UI for the features above (the frontend is currently a scaffold)
- Wiring the job description parser (`POST /api/parse-job` on the AI service) into the job upload

### 🚀 Coming Soon
- Mock interview bot (STAR method)
- LinkedIn profile optimizer
- Resume export to PDF
- Freemium payment model (Stripe)
- Real-time notifications

## Tech Stack

**Frontend:** React 19 + Vite + Tailwind CSS
**Backend:** Node.js + Express + TypeScript + MongoDB (Mongoose); calls the Claude API for suggestions
**AI Service:** Python + FastAPI + spaCy (resume and job parsing)
**Deployment:** Vercel (frontend) + Railway (backend); a Render blueprint is also included

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+ (3.12 recommended; spaCy 3.7 does not support 3.13+)
- MongoDB (Atlas account or a local instance)
- Anthropic Claude API key

### Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env` (see `backend/.env.example`):

| Variable | Purpose |
| :--- | :--- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign tokens |
| `ANTHROPIC_API_KEY` | Claude API key (AI suggestions) |
| `AI_SERVICE_URL` | AI service URL (default `http://localhost:5001`) |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_SERVICE` | Email for verification and password reset (optional in dev) |

```bash
npm run dev
# Runs on http://localhost:5000
```

> Login requires a verified email. Without SMTP configured in development, set `emailVerified: true` on your user directly in MongoDB.

### AI Service Setup
```bash
cd ai-service
python3.12 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
# spaCy model (pinned to the 3.7 series; `spacy download` can't resolve it)
pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl
```

Create `ai-service/.env` so the service listens where the backend expects it:
```
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=5001
BACKEND_URL=http://localhost:5000
```

```bash
python -m app.main
# Runs on http://localhost:5001 (API docs at /docs)
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## Project Structure

```
resume/
├── backend/                    # Express + TypeScript API
│   └── src/
│       ├── config/             # env and database setup
│       ├── controllers/        # auth, resume, job-description, generated-resume
│       ├── middleware/         # auth (JWT), upload (multer), error handling
│       ├── models/             # User, Resume, JobDescription, GeneratedResume, InterviewSession
│       ├── routes/             # route definitions, mounted under /api
│       ├── services/           # file extraction, resume parsing client, matching, AI suggestions
│       ├── types/              # shared TypeScript types
│       └── utils/              # logger, file helpers
├── ai-service/                 # FastAPI service
│   └── app/
│       ├── routers/            # /api/parse, /api/parse-job, plus completion/chat/chain
│       ├── services/           # resume_parser, job_parser
│       └── models/             # Pydantic models
├── frontend/                   # React + Vite app
├── docs/scaffold-overview.md   # Original template notes (Docker Compose, CI/CD)
└── docker-compose.yml
```

## API Overview

All backend routes are under `/api` and, except `/auth/*`, require `Authorization: Bearer <token>`.

| Route | Description |
| :--- | :--- |
| `POST /auth/register`, `/auth/login` | Sign up and log in |
| `POST /auth/refresh-token`, `/auth/logout` | Refresh and revoke sessions |
| `POST /auth/verify-email`, `/auth/request-reset-password`, `/auth/reset-password` | Email verification and password reset |
| `POST /resumes/upload` | Upload a resume (form field `resume`) |
| `GET /resumes`, `GET/DELETE /resumes/:resumeId` | List, view and delete resumes |
| `POST /jobs/upload` | Upload a job description (form field `job`, plus `jobTitle` and `company`) |
| `GET /jobs`, `GET/DELETE /jobs/:jobId` | List, view and delete jobs |
| `POST /generated-resumes/tailor` | Match a resume to a job and generate AI suggestions (`{ resumeId, jobId }`) |
| `GET /generated-resumes`, `GET/DELETE /generated-resumes/:id` | List, view and delete results |

## More Documentation

See [`API_DOCS.md`](API_DOCS.md) for request and response details for every endpoint.

See [`docs/scaffold-overview.md`](docs/scaffold-overview.md) for the original template notes, including Docker Compose and the deployment templates. Ports and some service details there predate this project's AI service (5001) and may differ.
