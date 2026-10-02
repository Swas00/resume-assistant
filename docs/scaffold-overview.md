# Antigravity Manager Surface: Multi-Service Architecture

A production-grade, microservice boilerplate orchestrated by Antigravity Agents. This suite contains four ready-to-code service setups configured with strict TypeScript, Python type annotations, modern build pipelines, and multi-cloud deployment automation.

---

## Architecture Overview

```
                                      +------------------------------------+
                                      |          Client Browser            |
                                      +-----------------+------------------+
                                                        |
                                                        v
                                      +------------------------------------+
                                      |           Agent Frontend           |
                                      |   React 19 + Vite 6 + Tailwind CSS |
                                      |             (Port 5173)            |
                                      +--------+------------------+--------+
                                               |                  |
                       /api/* Proxy / Requests |                  | /ai/* Proxy / Requests
                                               v                  v
    +------------------------------------+             +------------------------------------+
    |           Agent Backend            |             |          Agent AI Service          |
    |      Express + TypeScript API      |             |     FastAPI + LangChain + LLMs     |
    |             (Port 5000)            |             |             (Port 8000)            |
    +------------------+-----------------+             +------------------------------------+
                       |
                       v
    +------------------------------------+
    |              MongoDB               |
    |          Mongoose ODM v8           |
    |            (Port 27017)            |
    +------------------------------------+
```

---

## Services Directory Breakdown

| Service | Technology Stack | Path | Port |
| :--- | :--- | :--- | :--- |
| **Agent Frontend** | React 19, Vite 6, Tailwind CSS, TypeScript | [`frontend/`](file:///Users/swastiksahu/Desktop/resume/frontend) | `5173` |
| **Agent Backend** | Express 4, MongoDB (Mongoose 8), JWT, TypeScript | [`backend/`](file:///Users/swastiksahu/Desktop/resume/backend) | `5000` |
| **Agent AI Service**| FastAPI, LangChain, OpenAI, Claude, Pydantic v2 | [`ai-service/`](file:///Users/swastiksahu/Desktop/resume/ai-service) | `8000` |
| **Database** | MongoDB 7.0 Community Engine | `mongodb` | `27017` |
| **Agent DevOps** | Docker Compose, GitHub Actions, Vercel, Railway, Render | Root directory | - |

---

## Quick Start (Docker Compose)

The easiest way to launch the entire stack with databases and network isolation is Docker Compose:

```bash
# 1. Clone & copy environment variables
cp .env.example .env

# 2. Build and boot all 4 containers
docker compose up --build
```

Access points:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **AI Service Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **MongoDB**: `localhost:27017`

---

## Individual Service Development

### 1. Agent Frontend (`/frontend`)
- **React 19** with strict TypeScript
- **Vite 6** optimized with manual chunking, path aliases (`@/*`), and reverse proxy
- **Tailwind CSS v3.4** with typography and form plugins
- **ESLint v9 Flat Config** + **Prettier 3**
- Folder layout:
  - [`/src/components`](file:///Users/swastiksahu/Desktop/resume/frontend/src/components) (`Navbar`, `Button`, `Card`)
  - [`/src/pages`](file:///Users/swastiksahu/Desktop/resume/frontend/src/pages) (`HomePage`, `DashboardPage`)
  - [`/src/hooks`](file:///Users/swastiksahu/Desktop/resume/frontend/src/hooks) (`useAuth`, `useFetch`)
  - [`/src/utils`](file:///Users/swastiksahu/Desktop/resume/frontend/src/utils) (`cn`, `api`)

```bash
cd frontend
npm install
npm run dev
```

### 2. Agent Backend (`/backend`)
- **Express + TypeScript** compiled via `tsx` (dev) and `tsc` (prod)
- **MongoDB Connection** with auto-retry, connection pool, and graceful teardown
- **JWT Middleware** validating `Authorization: Bearer <token>` and RBAC guards
- **Centralized Error Handling** normalizing Mongoose validation and cast errors
- Folder layout:
  - [`/src/routes`](file:///Users/swastiksahu/Desktop/resume/backend/src/routes) (`auth`, `users`, `items`)
  - [`/src/controllers`](file:///Users/swastiksahu/Desktop/resume/backend/src/controllers)
  - [`/src/models`](file:///Users/swastiksahu/Desktop/resume/backend/src/models) (`User`, `Item`)
  - [`/src/middleware`](file:///Users/swastiksahu/Desktop/resume/backend/src/middleware) (`auth`, `error`, `validate`)

```bash
cd backend
npm install
npm run dev
```

### 3. Agent AI Service (`/ai-service`)
- **FastAPI ASGI Server** with lifespan handlers and CORS
- **OpenAI & Claude SDK** wrappers with offline simulation fallbacks
- **LangChain Chains** using LCEL, prompt templates, and structured output
- **Pydantic v2 Models** with strict schema validation
- Folder layout:
  - [`/app/routers`](file:///Users/swastiksahu/Desktop/resume/ai-service/app/routers) (`completion`, `chat`, `chain`)
  - [`/app/services`](file:///Users/swastiksahu/Desktop/resume/ai-service/app/services) (`openai_service`, `claude_service`, `langchain_service`)
  - [`/app/models`](file:///Users/swastiksahu/Desktop/resume/ai-service/app/models) (`request_models`, `response_models`)

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## Deployment & Cloud Templates

- **Vercel** ([`vercel.json`](file:///Users/swastiksahu/Desktop/resume/vercel.json)): Single Page App rewrites, caching rules, and asset headers.
- **Railway** ([`railway.json`](file:///Users/swastiksahu/Desktop/resume/railway.json)): Microservice container deployment with healthcheck probes.
- **Render** ([`render.yaml`](file:///Users/swastiksahu/Desktop/resume/render.yaml)): Infrastructure as Code blueprint for Express and FastAPI services.
- **GitHub Actions** ([`.github/workflows/ci-cd.yml`](file:///Users/swastiksahu/Desktop/resume/.github/workflows/ci-cd.yml)): Automated CI matrix linting, building, and verifying Docker images across all three services.
