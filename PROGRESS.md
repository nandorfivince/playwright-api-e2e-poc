# Playwright API E2E POC — Implementation Progress

> This file tracks implementation progress for context recovery after session switches.

## Implementation Steps

| # | Step | Files | Status |
|---|------|-------|--------|
| 1 | Project init | package.json, tsconfig.json, playwright.config.ts, .gitignore | ✅ DONE |
| 2 | Support: base + helpers | support/base/BaseApiClient.ts, support/helpers/auth.helper.ts, support/helpers/allure.helper.ts | ✅ DONE |
| 3 | GraphQL queries | support/graphql/queries/countries.queries.ts | ✅ DONE |
| 4 | API Objects | support/api-client/UsersApi.ts, support/api-client/CountriesGraphQLApi.ts | ✅ DONE |
| 5 | Zod schemas | schemas/users.schema.ts, schemas/countries.schema.ts | ✅ DONE |
| 6 | Fixtures | tests/fixtures/users.fixture.ts, tests/fixtures/countries.fixture.ts | ✅ DONE |
| 7 | Spec: REST | tests/rest/users.spec.ts (6 positive + 2 negative demo) | ✅ DONE |
| 8 | Spec: GraphQL | tests/graphql/countries.spec.ts (4 positive + 1 negative demo) | ✅ DONE |
| 9 | Docker | Dockerfile, docker-compose.yml, .dockerignore | ✅ DONE |
| 10 | CI/CD | .github/workflows/api-tests.yml | ✅ DONE |
| 11 | README | README.md | ✅ DONE |
| 12 | Install + run + verify | npm install, npx playwright test | ✅ DONE |

## Test Results (verified 2026-02-25)

```
@smoke      →  4/4 passed  — core happy-path
@regression →  6/6 passed  — schema, CRUD, content-type, auth
@demo       →  3/3 failed  — intentional (demonstrates error detection)
─────────────────────────────────
Total: 13 tests | 10 passed | 3 failed (expected) | 1.4s
```

## Error Detection Coverage (10/10)
| # | Error Type | Test |
|---|-----------|------|
| 1 | Schema/field rename | @demo shouldDetectSchemaMismatchWhenFieldRenamed |
| 2 | GraphQL query error | @smoke — body.errors check |
| 3 | GraphQL invalid syntax | @regression shouldReturnErrorWhenQuerySyntaxIsInvalid |
| 4 | Endpoint missing/changed | @smoke — status 200 check |
| 5 | Response format change | @regression shouldMatchZodSchemaWhenResponseIsValid |
| 6 | Auth failure | @regression shouldReturn200WithoutAuthHeaderWhenPublicApi |
| 7 | CRUD failure | @regression shouldReturn201WhenPostIsCreated |
| 8 | Data regression | @smoke — fixture value comparison |
| 9 | Response time degradation | @demo shouldDetectSlowResponseWhenThresholdExceeded |
| 10 | Content-type mismatch | @regression shouldReturnJsonContentTypeWhenCalled |

## Fixes Applied During Implementation
- `countries.schema.ts`: capital + currency → `.nullable()` (some countries have null values)
- `countries.spec.ts`: Countries API returns 400 for invalid syntax (not 200 like most GraphQL servers)

## Architecture Decisions
- REST API: JSONPlaceholder (https://jsonplaceholder.typicode.com)
- GraphQL API: Countries API (https://countries.trevorblades.com/graphql)
- Pattern: API Object Model (BaseApiClient → feature API classes)
- Validation: Zod schemas
- GraphQL: graphql-request gql tag, queries in separate files, fragments
- Reporting: Allure (epic/feature/story/severity/response-time) + HTML
- Tags: @smoke, @regression, @demo (demo = intentional failures)

## File Tree
```
playwright-api-e2e-poc/
├── package.json
├── tsconfig.json
├── playwright.config.ts
├── .gitignore
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── README.md
├── PROGRESS.md
├── .github/workflows/api-tests.yml
├── support/
│   ├── base/BaseApiClient.ts
│   ├── api-client/UsersApi.ts
│   ├── api-client/CountriesGraphQLApi.ts
│   ├── graphql/queries/countries.queries.ts
│   └── helpers/
│       ├── auth.helper.ts
│       └── allure.helper.ts
├── schemas/
│   ├── users.schema.ts
│   └── countries.schema.ts
└── tests/
    ├── fixtures/users.fixture.ts
    ├── fixtures/countries.fixture.ts
    ├── rest/users.spec.ts
    └── graphql/countries.spec.ts
```
