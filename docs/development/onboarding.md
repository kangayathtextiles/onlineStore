# Developer Onboarding Guide — KANGAYATH WEB

Welcome to the **KANGAYATH WEB** engineering team! This guide walks you through setting up your local development environment from scratch in under 10 minutes.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Git** ($\ge 2.40$)
- **Python** (3.12+)
- **Node.js** ($\ge 20.x$, LTS recommended)
- **Docker & Docker Compose** (Docker Desktop or Colima)
- **PowerShell** (Windows) or Bash/Zsh (macOS/Linux)

---

## 2. Initial Setup

### Step 1: Clone Repository
```bash
git clone <repository-url> kangayath-web
cd kangayath-web
```

### Step 2: Environment Configuration
Copy root and application environment templates:
```bash
# In the root repository
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### Step 3: Backend Setup
```bash
cd apps/api
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -e ".[dev]"
```

### Step 4: Frontend Setup
```bash
cd ../../apps/web
npm install
```

---

## 3. Running the Stack

### Option A: Docker Compose (Recommended)
From the repository root:
```bash
docker-compose up
```
Services will become available at:
- Web Application: `http://localhost:3000`
- API Service: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

### Option B: Local Services
Terminal 1 (Backend):
```bash
cd apps/api
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Terminal 2 (Frontend):
```bash
cd apps/web
npm run dev
```

---

## 4. Running Verification

Run all test suites and linters:
```powershell
.\scripts\test.ps1
```
Or individually:
- Backend: `pytest apps/api/tests` & `ruff check apps/api`
- Frontend: `npm --prefix apps/web test` & `npm --prefix apps/web run typecheck`
