# Testing

## Complete validation

Install the browser once:

```powershell
cd frontend
corepack pnpm@9.15.9 exec playwright install chromium
cd ..
```

Then run the same gate used by CI:

```powershell
.\backend\.venv311\Scripts\python.exe check.py
```

On Unix, use the Python executable from `backend/.venv`. `check.cmd` is a Windows convenience wrapper.

The gate runs:

1. Prettier format verification
2. ESLint
3. TypeScript checking
4. Vitest unit/integration tests with V8 coverage
5. Vite production build
6. Ruff format and lint checks
7. mypy on stable backend contracts and the validation runner
8. pytest with backend and launcher coverage
9. Playwright Chromium workflow and axe accessibility checks

Use `python check.py --skip-e2e` for a fast local loop. CI always runs the complete gate.

## Focused commands

```powershell
cd frontend
corepack pnpm@9.15.9 test
corepack pnpm@9.15.9 test:e2e
corepack pnpm@9.15.9 review:screenshots
cd ..
.\backend\.venv311\Scripts\python.exe -m pytest tests
```

Persistence tests use an in-memory IndexedDB implementation and cover migration, malformed data, identity-preserving save updates, sorting, rename, duplicate, and delete. Browser tests cover create → save → analyze → contrast → export → reopen → delete plus representative accessibility states. Backend tests cover contracts, upload defenses, analysis, suggestions, metadata, readiness, runtime parsing, and launcher supervision.
