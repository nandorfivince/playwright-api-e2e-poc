# Playwright API E2E Testing POC

Proof of Concept — a lightweight, fast, and free API testing framework using Playwright for REST and GraphQL endpoints. No browser required.

## Why Playwright instead of Cypress?

| | Cypress | Playwright |
|---|---|---|
| Browser needed for API tests? | Yes | **No** |
| GraphQL support | None | **Native** |
| Parallel execution | Paid (Cypress Cloud) | **Free, built-in** |
| API test speed | Slow (browser overhead) | **3–5x faster** |
| Reporting | Dashboard (paid) | **Allure + HTML (free)** |
| TypeScript | Partial | **Full, native** |
| Docker image size | Large (browser deps) | **Minimal (Node only)** |
| CI/CD pipeline time | Minutes | **Seconds** |

## Quickstart

```bash
git clone <repo-url> && cd playwright-api-e2e-poc
npm install
npm test
npm run test:allure    # opens Allure report in browser
```

Or with Docker:

```bash
docker compose up --build
allure serve allure-results
```

## What does the demo cover?

**13 tests** across REST and GraphQL — runs in **under 10 seconds**.

| Tag | Count | Purpose |
|-----|-------|---------|
| `@smoke` | 4 | Happy-path, production-safe |
| `@regression` | 6 | Schema, CRUD, auth, content-type |
| `@demo` | 3 | Intentionally failing — error detection showcase |

## What errors can it catch?

| # | Error type |
|---|------------|
| 1 | Schema or field rename (Zod validation) |
| 2 | GraphQL query errors |
| 3 | GraphQL invalid syntax |
| 4 | Missing or changed endpoints |
| 5 | Response format changes |
| 6 | Authentication failures |
| 7 | CRUD operation failures |
| 8 | Data regressions (fixture comparison) |
| 9 | Response time degradation |
| 10 | Content-type mismatches |

## Public APIs used

- **REST:** [JSONPlaceholder](https://jsonplaceholder.typicode.com) — Users, Posts
- **GraphQL:** [Countries API](https://countries.trevorblades.com/graphql) — Countries, Continents

## Documentation

| Doc | Audience | Link |
|-----|----------|------|
| Installation & Running | Anyone | [docs/01-INSTALLATION-AND-RUNNING.en.md](docs/01-INSTALLATION-AND-RUNNING.en.md) |
| Structure & Daily Work | Test automation engineers | [docs/02-STRUCTURE-AND-DAILY-WORK.en.md](docs/02-STRUCTURE-AND-DAILY-WORK.en.md) |
| POC Bible — Onboarding | Developer deep dive | [docs/03-POC-BIBLE-ONBOARDING.en.md](docs/03-POC-BIBLE-ONBOARDING.en.md) |

All three documents are also available in Hungarian, Romanian, and Lithuanian in the `docs/` folder.
