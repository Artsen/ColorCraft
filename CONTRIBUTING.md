# Contributing to ColorCraft

## Before you start

- Install Python 3.11.
- Install Node.js 20 or newer.
- Enable Corepack.
- Read [ColorCraft Technical English](./docs/writing-style.md) before you change
  documentation.

## Set up the repository

### Windows

```powershell
py -3.11 -m venv backend\.venv311
.\backend\.venv311\Scripts\python.exe -m pip install --upgrade pip
.\backend\.venv311\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
cd frontend
corepack pnpm@9.15.9 install
cd ..
```

### macOS and Linux

```bash
python3.11 -m venv backend/.venv
backend/.venv/bin/python -m pip install --upgrade pip
backend/.venv/bin/python -m pip install -r backend/requirements-dev.txt
cd frontend
corepack pnpm@9.15.9 install
cd ..
```

## Start ColorCraft

Use the one-terminal launcher:

```powershell
.\backend\.venv311\Scripts\python.exe dev.py
```

On macOS or Linux, run `backend/.venv/bin/python dev.py`. See
[Getting started](./docs/getting-started.md) for manual startup and runtime
configuration.

## Validate a change

Install Playwright Chromium once:

```powershell
cd frontend
corepack pnpm@9.15.9 exec playwright install chromium
cd ..
```

Run the complete gate before you open a pull request:

```powershell
.\backend\.venv311\Scripts\python.exe check.py
git diff --check
```

On macOS or Linux, use `backend/.venv/bin/python check.py`.

The gate runs Prettier, ESLint, TypeScript, Vitest with coverage, the frontend
production build, Ruff, mypy, pytest with coverage, Playwright, and axe
accessibility checks. Use `python check.py --skip-e2e` only for a fast local
iteration. Do not use the reduced gate as the final pull request validation.

## Code requirements

- Keep a change focused.
- Add or update tests for changed behavior.
- Preserve the Pydantic and Zod contract boundary.
- Use semantic style tokens for application chrome.
- Do not describe relationship fit as aesthetic quality.
- Do not describe a passing contrast pair as proof of complete accessibility.

## Documentation requirements

- Follow [ColorCraft Technical English](./docs/writing-style.md).
- Use the preferred ColorCraft terminology.
- Preserve exact UI labels and technical strings.
- Add a glossary entry for a new stable concept.
- Update the canonical document instead of copying a large section into the
  README.
- Verify algorithm claims against current code and tests.
- Keep measured relationships separate from aesthetic judgment.

## Pull request requirements

- Explain what changed and why.
- Reference related issues.
- List the validation commands and results.
- Include current screenshots for an intentional UI change.
- State changes to API contracts, persistence, runtime configuration, or
  privacy boundaries.
- Do not commit virtual environments, `node_modules`, build output, temporary
  screenshots, uploaded test images, credentials, or local configuration.

## Report a bug

Include:

- Reproduction steps
- Expected result
- Actual result
- Operating system and browser
- Relevant terminal output with secrets and local private data removed
