# Installation and Running

## Table of Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Project Setup (after cloning)](#2-project-setup-after-cloning)
- [3. Running Tests — from terminal](#3-running-tests--from-terminal)
- [4. Viewing Results](#4-viewing-results)
- [5. Running from Docker](#5-running-from-docker)
- [6. Quick Reference — command table](#6-quick-reference--command-table)

---

## 1. Prerequisites

### Node.js (v20+)

**macOS (Homebrew):**
```bash
brew install node@20
```

**Windows:**
Download the installer from [nodejs.org](https://nodejs.org/), or use Chocolatey:
```powershell
choco install nodejs-lts
```

**Verify:**
```bash
node -v    # v20.x.x
npm -v     # 10.x.x
```

### Allure CLI (for reports)

**macOS (Homebrew):**
```bash
brew install allure
```

**Via npm (all OS — simplest):**
```bash
npm install -g allure-commandline
```

**Windows (Scoop):**
```powershell
scoop install allure
```

**Verify:**
```bash
allure --version
```

### Docker (optional — for containerized execution)

**macOS:**
Download [Docker Desktop](https://www.docker.com/products/docker-desktop/).

**Windows:**
Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/). Requires WSL 2 backend.

**Verify:**
```bash
docker --version
docker compose version
```

---

## 2. Project Setup (after cloning)

```bash
# Enter the project directory
cd playwright-api-e2e-poc

# Install dependencies
npm install
```

That's it — no need to install Playwright browsers, as this is pure API testing (no browser required).

---

## 3. Running Tests — from terminal

### All tests

```bash
npm test
```

### By type

```bash
# REST tests only
npm run test:rest

# GraphQL tests only
npm run test:graphql
```

### By tag

```bash
# Smoke tests (4 — fast, safe, happy-path)
npm run test:smoke

# Regression tests (6 — schema, CRUD, auth, content-type)
npm run test:regression

# Demo tests (3 — intentionally failing, error detection showcase)
npm run test:demo
```

### Running a single specific test

```bash
# By file name
npx playwright test tests/rest/users.spec.ts

# By test name (partial match)
npx playwright test -g "shouldReturnHungaryDetails"

# Project + tag combined
npx playwright test --project=rest-api --grep @smoke
npx playwright test --project=graphql-api --grep @regression
```

### Verbose console output

```bash
# List view (each test name + duration)
npx playwright test --reporter=list

# Line-by-line mode
npx playwright test --reporter=line
```

---

## 4. Viewing Results

### Playwright HTML Report

```bash
# Generate + open in browser
npm run test:report

# Or manually
npx playwright show-report playwright-report
```

### Allure Report

```bash
# Run tests (allure-results/ directory gets populated)
npm test

# Open Allure report in browser
npm run test:allure

# Or manually
allure serve allure-results

# Generate static report (e.g. for CI)
allure generate allure-results -o allure-report --clean
allure open allure-report
```

### Network Report (Chrome DevTools style)

After running tests, a standalone HTML report is auto-generated showing every API call in a Chrome DevTools Network tab style interface — dark theme, request/response details, headers, body with Copy button, status code filtering.

```bash
# Open the Network Report in browser
npm run test:network

# Generate only (without opening)
npm run report:network
```

This is especially useful for debugging API issues — you can copy request/response data directly into OpenSearch or share it with backend developers.

### Full Report (test results + network data combined)

A combined HTML report that merges Playwright test results (pass/fail, errors, code snippets) with network call data per test. Similar to Cypress Cloud Test Replay, but free and self-contained.

```bash
# Open the Full Report in browser
npm run test:full-report

# Generate only (without opening)
npm run report:full
```

For each test you see:
- Pass/fail status, duration, file location, tags
- Error details with source code snippet (for failed tests)
- All network calls made during that test — request/response tabs, headers, body, Copy button

### Allure Trend (history across runs)

Allure can display trend graphs (pass/fail ratio, duration, retries) across multiple test runs. For this, the history from the previous report must be copied into the next run's results.

```bash
# 1. Run tests + generate report
npm test
allure generate allure-results -o allure-report --clean

# 2. Before the NEXT run — copy history back
cp -r allure-report/history allure-results/history

# 3. Run tests again
npm test

# 4. Generate report — trend graphs now appear
allure generate allure-results -o allure-report --clean
allure open allure-report
```

> **Note:** `npm run test:allure` uses `allure serve` which generates a temporary report — it does not preserve history. For trends, always use `allure generate` + `allure open`.

---

## 5. Running from Docker

### All tests

```bash
docker compose up --build
```

### By tag from Docker

```bash
# Smoke tests
docker compose run api-tests npx playwright test --grep @smoke

# Regression
docker compose run api-tests npx playwright test --grep @regression

# Demo (intentionally failing)
docker compose run api-tests npx playwright test --grep @demo
```

### By type from Docker

```bash
# REST only
docker compose run api-tests npx playwright test tests/rest/

# GraphQL only
docker compose run api-tests npx playwright test tests/graphql/
```

### Single test from Docker

```bash
docker compose run api-tests npx playwright test -g "shouldReturnHungaryDetails"
```

### Docker results

The `docker-compose.yml` volumes automatically export results to the host:
- `./allure-results/` — Allure data
- `./playwright-report/` — HTML report

After running, view reports on the host machine:

```bash
# Allure (after Docker run, on host)
allure serve allure-results

# Playwright HTML
npx playwright show-report playwright-report
```

---

## 6. Quick Reference — command table

| What I want | Command |
|------------|---------|
| Install | `npm install` |
| All tests | `npm test` |
| REST only | `npm run test:rest` |
| GraphQL only | `npm run test:graphql` |
| Smoke tests | `npm run test:smoke` |
| Regression tests | `npm run test:regression` |
| Demo (failing) tests | `npm run test:demo` |
| A specific test | `npx playwright test -g "testName"` |
| Project + tag | `npx playwright test --project=rest-api --grep @smoke` |
| Playwright report | `npm run test:report` |
| Allure report | `npm run test:allure` |
| Network Report | `npm run test:network` |
| Full Report | `npm run test:full-report` |
| Generate Network Report only | `npm run report:network` |
| Generate Full Report only | `npm run report:full` |
| Docker — all | `docker compose up --build` |
| Docker — smoke | `docker compose run api-tests npx playwright test --grep @smoke` |
| Docker — single test | `docker compose run api-tests npx playwright test -g "testName"` |
