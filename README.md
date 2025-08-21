# MyWork — Time Tracking App

Full‑stack time tracking application with:
- Frontend: Next.js 14 (App Router), next-intl (i18n), MUI
- Backend: FastAPI (Uvicorn), Pydantic
- Storage: DynamoDB (via AWS or LocalStack)
- Local development friendly with automatic table creation

This project lets you clock in/out, add comments, and view/manage time entries. The frontend proxies API calls to the backend during development.

---

## Table of Contents
- Architecture
- Tech Stack
- API Overview
- Running Locally
  - Prerequisites
  - Backend setup (FastAPI)
  - Frontend setup (Next.js)
  - Verifying everything works
- Environment Variables
- Internationalization (i18n)
- Project Structure
- Troubleshooting

---

## Architecture

- Frontend (Next.js @ http://localhost:3001)
  - Uses a rewrite so browser calls to `/api/*` are forwarded to the backend service.
- Backend (FastAPI @ http://localhost:8001)
  - Exposes REST endpoints to clock in/out and manage entries.
  - Connects to DynamoDB either via AWS credentials or LocalStack.
  - Creates the DynamoDB table (`time_entries`) automatically if it does not exist.

Request flow in dev:
Browser (http://localhost:3001) -> /api/... -> Next.js rewrite -> http://localhost:8001/...

---

## Tech Stack

Frontend:
- Next.js 14 (App Router)
- React 18, TypeScript
- next-intl for i18n (en, es, pt)
- MUI (Material UI)

Backend:
- FastAPI, Uvicorn
- Pydantic
- boto3/botocore (DynamoDB)
- python-dotenv

Infrastructure/Local Dev:
- DynamoDB (AWS or LocalStack)
- Optional Docker for LocalStack

---

## API Overview

Base URL (dev): http://localhost:8001

Endpoints:
- POST /clock
  - Toggles clock status. If no open entry exists, it clocks in. If an open entry exists, it clocks out and sets duration.
  - Body (JSON):
    - comment: string (optional)
    - tz: string (optional, e.g., "America/Bahia")
  - Returns the created/updated `TimeEntry`.

- GET /entries
  - Returns all entries.

- PATCH /entries/{entry_id}
  - Updates an entry&#39;s comment.
  - Body (JSON): { "comment": "New note" }
  - Returns updated `TimeEntry`.

- DELETE /entries/{entry_id}
  - Deletes an entry. Returns 204 on success.

Models:
```ts
TimeEntry {
  id: string
  start_time: datetime
  end_time?: datetime
  duration: number
  timezone?: string
  comment?: string
}
```

FastAPI docs (Swagger UI): http://localhost:8001/docs

Example curl:
```bash
# Clock in (or out if one is open)
curl -X POST http://localhost:8001/clock \
  -H "Content-Type: application/json" \
  -d '{"comment":"Starting work","tz":"America/Bahia"}'

# List entries
curl http://localhost:8001/entries

# Update comment
curl -X PATCH http://localhost:8001/entries/ENTRY_ID \
  -H "Content-Type: application/json" \
  -d '{"comment":"Updated note"}'

# Delete entry
curl -i -X DELETE http://localhost:8001/entries/ENTRY_ID
```

---

## Running Locally

### Prerequisites
- macOS, Linux, or Windows
- Python 3.10+ recommended
- Node.js 18+ and npm
- One of:
  - AWS credentials with DynamoDB permissions
  - OR LocalStack running locally (recommended for dev)

### 1) Backend setup (FastAPI)

From project root:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Choose your storage mode.

Option A: LocalStack (recommended for local dev)
- Ensure Docker is running.
- Start LocalStack:
  ```bash
  docker run -d --name localstack -p 4566:4566 -p 4571:4571 localstack/localstack
  ```
- In `backend/.env`, set:
  ```
  AWS_ACCESS_KEY_ID=test
  AWS_SECRET_ACCESS_KEY=test
  AWS_REGION=us-east-1
  USE_LOCALSTACK=true
  ```
- The app connects to LocalStack at `http://localhost:4566` and auto-creates the `time_entries` table.

Option B: Real AWS
- In `backend/.env`, set:
  ```
  AWS_ACCESS_KEY_ID=YOUR_KEY
  AWS_SECRET_ACCESS_KEY=YOUR_SECRET
  AWS_REGION=YOUR_REGION   # e.g., us-east-1
  USE_LOCALSTACK=false
  ```
- Ensure your IAM principal has DynamoDB permissions.

Run the backend:
```bash
# still inside backend with the venv active
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

FastAPI docs will be at http://localhost:8001/docs

### 2) Frontend setup (Next.js)
From project root:
```bash
cd frontend
npm install
npm run dev  # runs on http://localhost:3001
```

The Next.js dev server is configured to rewrite `/api/*` to `http://localhost:8001/*` (see `frontend/next.config.mjs`), so the frontend can call `/api/clock`, `/api/entries`, etc., without CORS issues.

Note about `start.sh`: The current `start.sh` references Vite commands and is not aligned with this Next.js setup. Prefer using the manual commands above during development.

### 3) Verifying everything works
- Backend: http://localhost:8001/docs should load.
- Frontend: http://localhost:3001 should load the app.
- Try pressing your clock button in the UI or test via curl to see entries appear. The DynamoDB table is created automatically on first use if it doesn&#39;t already exist.

---

## Environment Variables

Backend (`backend/.env`):
- AWS_ACCESS_KEY_ID: AWS or LocalStack access key (use `test` for LocalStack)
- AWS_SECRET_ACCESS_KEY: AWS or LocalStack secret (use `test` for LocalStack)
- AWS_REGION: Region (e.g. `us-east-1`). For LocalStack, use `us-east-1`.
- USE_LOCALSTACK: `true` to use LocalStack at `http://localhost:4566`, otherwise `false` to use real AWS.

The backend loads these via `python-dotenv`. See `backend/.env.example` for a template.

---

## Internationalization (i18n)

- Implemented with `next-intl`.
- Locales available: `en`, `es`, `pt`.
- Routing uses the App Router with a dynamic locale segment: `src/app/[locale]`.
- Locale messages are in:
  - `frontend/src/locales/en.json`
  - `frontend/src/locales/es.json`
  - `frontend/src/locales/pt.json`
- Configuration: `frontend/src/i18n.ts` and `frontend/src/middleware.ts`.

---

## Project Structure

```
mywork/
├─ backend/
│  ├─ main.py            # FastAPI app, endpoints (/clock, /entries)
│  ├─ models.py          # Pydantic models (TimeEntry)
│  ├─ database.py        # DynamoDB connection and table creation
│  ├─ requirements.txt   # Python dependencies
│  ├─ .env.example       # Backend env template
│  └─ .env               # Backend env (not committed)
├─ frontend/
│  ├─ next.config.mjs    # Dev rewrite /api -> http://localhost:8001
│  ├─ package.json       # Next.js scripts
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ [locale]/    # i18n-aware routes (layout.tsx, page.tsx)
│  │  │  └─ globals.css
│  │  ├─ components/     # UI components (e.g., Clock)
│  │  ├─ locales/        # en.json, es.json, pt.json
│  │  ├─ i18n.ts         # next-intl config
│  │  └─ middleware.ts   # locale middleware
│  └─ ...
├─ start.sh              # Outdated dev script (uses Vite)
└─ README.md
```

---

## Troubleshooting

- Can&#39;t connect to DynamoDB:
  - Using LocalStack? Ensure the container is running and `USE_LOCALSTACK=true` with credentials set to `test/test` and `AWS_REGION=us-east-1`.
  - Using AWS? Verify credentials and `AWS_REGION`. Ensure IAM permissions for DynamoDB (CreateTable, DescribeTable, PutItem, Scan, UpdateItem, DeleteItem).

- 500 errors on update/delete:
  - The backend raises detailed errors including DynamoDB messages. Check server logs for `ClientError`.

- CORS issues:
  - In dev, the frontend calls `/api/*`, which the Next.js dev server rewrites to the backend, avoiding CORS. Make sure both servers are running on the specified ports.

- `start.sh` tries to launch Vite:
  - This project uses Next.js, not Vite. Use the manual commands in the Running Locally section.

---

## Scripts Reference

Frontend:
- `npm run dev` — Start Next.js dev server on port 3001.
- `npm run build` — Build the production bundle.
- `npm start` — Start the Next.js server (after build).
- `npm run lint` — Run ESLint.

Backend:
- Use Uvicorn to serve FastAPI:
  - `uvicorn main:app --host 127.0.0.1 --port 8001 --reload`

---

This README covers the project layout, how to configure and run both backend and frontend locally, and how to interact with the API.
