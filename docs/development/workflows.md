# Engineering Development Workflows

## 1. Branching & PR Workflow

1. Check out latest `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Create a topic branch:
   ```bash
   git checkout -b feature/02-auth-domain
   ```
3. Make atomic, well-tested commits following Conventional Commits:
   ```bash
   git commit -m "feat(auth): implement user registration schema"
   ```
4. Verify all tests pass before pushing:
   ```bash
   powershell ./scripts/test.ps1
   ```
5. Open PR targeting `develop`.

---

## 2. Code Style & Formatting Automation

- **Python**:
  - Check linter: `ruff check apps/api`
  - Auto-fix issues: `ruff check --fix apps/api`
  - Format code: `ruff format apps/api`
  - Type checking: `mypy apps/api/app`
- **TypeScript**:
  - Linting: `npm --prefix apps/web run lint`
  - Type checking: `npm --prefix apps/web run typecheck`
