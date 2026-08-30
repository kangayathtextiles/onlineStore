# Development Guide & Engineering Workflows

## 1. Prerequisites

- **Python**: 3.12+
- **Node.js**: 20+
- **Docker & Docker Compose**: (Optional for local containerized development)
- **Git**: 2.40+

---

## 2. Quickstart Local Setup

### Backend API
```bash
cd apps/api
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install --upgrade pip
pip install -e ".[dev]"

# Start API dev server on port 8000
uvicorn app.main:app --reload --port 8000
```

### Frontend Web
```bash
cd apps/web
npm install

# Start Next.js dev server on port 3000
npm run dev
```

---

## 3. Branching Lifecycle & Pull Request Workflow

```text
feature/<feature-name>  ──(PR)──>  staging  ──(Auto Deploy)──>  Render Staging
                                      │
                                (Verification)
                                      │
                                      ▼
                                    main    ──(Auto Deploy)──>  Render Production
```

### Step-by-Step Workflow:
1. **Create Feature Branch**:
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feature/my-new-feature
   ```
2. **Make Atomic Commits** (following Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`).
3. **Verify Locally Before Push**:
   ```powershell
   .\scripts\test.ps1
   ```
4. **Open Pull Request** targeting `staging`.
5. **Merge to `staging`** after CI checks pass $\to$ triggers automatic deployment to Render Staging.
6. **Verify on Staging Environment** with showroom owner or manual check.
7. **Merge `staging` $\to$ `main`** $\to$ triggers automatic deployment to Render Production.

---

## 4. Code Standards & Pre-Commit Rules

- **Python**:
  - Maximum line length: 100
  - Linter & Formatter: `ruff`
  - Type checking: `mypy app` (strict mode)
- **TypeScript**:
  - React 19 / Next.js 15 App Router conventions
  - Type checking: `tsc --noEmit`
  - Styling: Tailwind CSS
- **Price Protection**: Never include `price` fields in customer-facing schema responses (`public/`).
