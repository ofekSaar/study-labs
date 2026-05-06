# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StudyLabs is a gamified learning platform where instructors upload course materials (PDFs/PPTX) and an AI pipeline automatically generates structured courses with lessons, quizzes, and summaries. Students enroll in courses, progress through nodes on a roadmap, earn XP, and complete quizzes.

## Architecture

Three services orchestrated via `docker-compose.yml`, sharing a MongoDB instance and a Docker volume for uploaded files:

- **frontend/** — React 19 + Vite 7, Tailwind CSS v4 (via `@tailwindcss/vite` plugin), Zustand for state
- **backend/** — Node.js + Express 5, Mongoose ODM, Passport.js (Google OAuth) + JWT auth
- **ai-engine/** — Python FastAPI, LlamaIndex for structured LLM output, pymongo for direct MongoDB writes

### Service Communication

Backend → AI Engine via internal HTTP (`AI_SERVICE_URL`). Files are shared through the `shared_uploads` Docker volume — the backend stores uploaded files, and the AI engine reads them by absolute path.

The AI engine writes generated quizzes/summaries directly to MongoDB (collections: `quizzes`, `summaries`), then returns IDs in its response. The backend fetches these by ID and transforms the nested `course_structure` response into flat `CourseNode` documents.

**Important:** The AI engine uses a separate database (`studylabs_db` via `MONGO_DB_NAME`) while the backend connects to `studylabs`. This means AI-generated content (quizzes, summaries) lives in a different database than the main application data (users, courses, enrollments, progress).

### Course Generation Flow

1. Instructor uploads syllabus + materials via multipart form to `POST /api/courses`
2. Backend stores files, creates Course document with `generationStatus: 'generating'`, returns 201 immediately
3. Background fire-and-forget call to `generateRoadmap()` in `backend/services/aiService.js`
4. AI engine pipeline (3 steps): parse syllabus → tag materials to topics → generate questions + summaries in parallel
5. Backend transforms response into `CourseNode` documents, saves lesson markdown to storage, sets `generationStatus: 'ready'` and `isPublished: true`
6. On failure, `generationStatus: 'failed'` with error message in `generationError`

The `aiService.js` uses Node's native `http` module instead of `fetch()` to avoid the 5-minute idle timeout in Node 18+ fetch.

### Auth Flow

Google OAuth via Passport.js → JWT token → stored in `localStorage` (`studylabs_token` key). New users have `role: null` and must select student/instructor on first login. When Google OAuth credentials aren't configured, the backend provides a mock login flow.

### Frontend Patterns

- State management: Zustand stores (`authStore`, `courseStore`, `enrollmentStore`)
- API client: custom `fetch` wrapper at `frontend/src/utils/api.js` (not axios) — auto-injects JWT, handles JSON/FormData
- Routing: role-based via `ProtectedRoute` component with `allowedRole` prop
- Two roles map to separate route trees: `/` for students, `/instructor` for instructors

### Storage Layer

Abstract `StorageInterface` in `backend/services/storage/` with `LocalStorageAdapter` implementation. Designed to swap to S3 via `STORAGE_TYPE` env var (only `local` exists currently).

## Commands

### Full Stack (Docker)

```bash
docker compose up --build        # Start all services
docker compose up -d             # Start detached
docker compose down              # Stop all
docker compose logs -f backend   # Tail a specific service
```

### Backend (Node.js)

```bash
cd backend
npm install
npm run dev                      # Dev server with nodemon (port 5000)
npm test                         # Jest tests (uses mongodb-memory-server, no real DB needed)
npm run test:watch               # Jest watch mode
```

Backend uses ESM (`"type": "module"`). Tests require `--experimental-vm-modules` (already in the npm script).

Swagger API docs available at `http://localhost:5000/api-docs` when running.

### Frontend (React/Vite)

```bash
cd frontend
npm install
npm run dev                      # Vite dev server (port 5173)
npm run build                    # Production build
npm run lint                     # ESLint
```

Requires `VITE_API_URL=http://localhost:5001` when backend runs through Docker (port mapping 5001→5000).

### AI Engine (Python/FastAPI)

```bash
cd ai-engine
pip install -r requirements.txt
python main.py                   # Uvicorn server (port 8000) with auto-reload
```

Set `USE_MOCK_AI=True` in env to bypass real LLM calls during development. LLM provider priority: OpenRouter → Gemini → OpenAI.

API docs at `http://localhost:8000/docs` (Swagger) or `/redoc`.

## Key Contracts

- `backend/AI_SERVICE_CONTRACT.md` — exact API contract between backend and AI engine (request/response formats, quiz question types, error codes)
- Backend API endpoints are fully documented in `backend/README.md` and via Swagger annotations

## Environment

Copy `.env.example` to `.env` at the project root. Key variables:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — leave blank for mock login
- `GEMINI_API_KEY` / `OPENAI_API_KEY` / `OPEN_ROUTE_API_KEY` — set at least one, or use `USE_MOCK_AI=True`
- `JWT_SECRET` — required for backend auth
