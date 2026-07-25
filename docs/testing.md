# Testing

## Run the complete validation

### Before you start

Install the backend development dependencies and frontend packages. Install
Playwright Chromium once:

```powershell
cd frontend
corepack pnpm@9.15.9 exec playwright install chromium
cd ..
```

### Procedure

1. Open a terminal in the repository root.
2. On Windows, run:

   ```powershell
   .\backend\.venv311\Scripts\python.exe check.py
   ```

3. On macOS or Linux, run:

   ```bash
   backend/.venv/bin/python check.py
   ```

### Result

The validation runner reports `ColorCraft validation passed.`

### Recovery

If a step fails, correct the first reported failure. Run the complete validation
again.

## Validation layers

The complete gate runs:

1. Prettier format verification
2. ESLint
3. TypeScript checking
4. Vitest unit and integration tests with V8 coverage
5. Vite production build
6. Ruff format verification
7. Ruff lint
8. mypy on stable backend contracts and the validation runner
9. pytest with backend and launcher coverage
10. Playwright Chromium workflows and axe accessibility checks

`check.cmd` selects a known Windows backend virtual environment and runs
`check.py`.

## Focused commands

```powershell
cd frontend
corepack pnpm@9.15.9 format:check
corepack pnpm@9.15.9 lint
corepack pnpm@9.15.9 typecheck
corepack pnpm@9.15.9 test
corepack pnpm@9.15.9 build
corepack pnpm@9.15.9 test:e2e
cd ..
.\backend\.venv311\Scripts\python.exe -m pytest tests
.\backend\.venv311\Scripts\python.exe -m compileall -q backend dev.py check.py
git diff --check
```

Use `python check.py --skip-e2e` for a fast local iteration. CI runs the complete
gate.

## Test scope

- Persistence tests cover version-3 validation, legacy HEX-role migration,
  duplicate-role remapping, update identity, sorting,
  rename, duplicate, and delete.
- Frontend tests cover navigation, palette state, stale analysis, Save states,
  Review, Export, and API contract validation.
- Backend tests cover upload defenses, extraction, relationship analysis,
  suggestions, contrast, metadata, readiness, configuration, and launcher
  supervision.
- Browser tests cover create, save, analyze, stable duplicate-color role
  assignment, semantic export, portable round trips, reopen,
  delete, and representative accessibility states.
- Documentation tests verify local Markdown links and curated screenshot names.
