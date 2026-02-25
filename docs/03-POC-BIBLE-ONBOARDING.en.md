# POC Bible — Complete Onboarding Documentation

> This document is written for a beginner test automation engineer who is encountering this framework for the first time. Every layer, file, configuration, and code technique is explained in detail.

---

## Table of Contents

1. [What is this project?](#1-what-is-this-project)
2. [Why Playwright and not Cypress?](#2-why-playwright-and-not-cypress)
3. [The technology stack](#3-the-technology-stack)
4. [Configuration files explained in detail](#4-configuration-files-explained-in-detail)
5. [The API Object Model pattern](#5-the-api-object-model-pattern)
6. [Inheritance — how it works](#6-inheritance--how-it-works)
7. [The support layer — file by file](#7-the-support-layer--file-by-file)
8. [GraphQL handling — queries, fragments, gql tag](#8-graphql-handling--queries-fragments-gql-tag)
9. [Zod schema validation — what it is and why we need it](#9-zod-schema-validation--what-it-is-and-why-we-need-it)
10. [Fixtures — centralizing test data](#10-fixtures--centralizing-test-data)
11. [Spec files — the anatomy of tests](#11-spec-files--the-anatomy-of-tests)
12. [Allure reporting — metadata and measurement](#12-allure-reporting--metadata-and-measurement)
13. [Tag system — @smoke, @regression, @demo](#13-tag-system--smoke-regression-demo)
14. [Docker — containerization](#14-docker--containerization)
15. [CI/CD — automated execution](#15-cicd--automated-execution)
16. [Error detection — what this framework catches](#16-error-detection--what-this-framework-catches)
17. [Test management considerations](#17-test-management-considerations)
18. [Complete data flow — who calls whom and why](#18-complete-data-flow--who-calls-whom-and-why)

---

## 1. What is this project?

This is a **Proof of Concept (POC)** — evidence that the Playwright framework is suitable for automated testing of backend APIs. We are not writing browser-based UI tests; instead, we send **pure HTTP requests** to APIs and verify the responses.

The POC uses two public APIs for demonstration:
- **REST:** JSONPlaceholder (`https://jsonplaceholder.typicode.com`) — user data
- **GraphQL:** Countries API (`https://countries.trevorblades.com/graphql`) — country data

The goal: to demonstrate that this approach is **faster, simpler, and cheaper** than Cypress-based backend testing.

---

## 2. Why Playwright and not Cypress?

| Aspect | Cypress | Playwright |
|--------|---------|------------|
| **API call method** | `cy.request()` — runs in browser context | `request` API — native HTTP, no browser |
| **Speed** | Browser starts → slow (5-15s overhead) | Direct HTTP → fast (<1s for all tests) |
| **Parallel execution** | Paid (Cypress Cloud) | Free, built-in `fullyParallel` |
| **GraphQL** | No native support | Same POST call, handles natively |
| **TypeScript** | Partial support | Full, native |
| **Reporting** | Cypress Dashboard (paid) | Allure (free) + HTML |
| **Docker** | Browser needed in image (~1GB+) | Minimal Node image (~200MB) |
| **CI/CD** | Harder (browser dependencies) | Easier (no browser deps) |

**Summary:** If we want to test the API (not the UI), there is no need to launch a browser. The Playwright `request` API is designed exactly for this purpose.

---

## 3. The technology stack

| Technology | Version | Role |
|-----------|---------|------|
| **Playwright** | 1.50+ | Test execution, HTTP clients, reporting |
| **TypeScript** | 5.7+ | Type-safe code — typos are caught at compile time |
| **Zod** | 3.24+ | Response structure validation at runtime |
| **graphql-request** | 7.1+ | GraphQL queries with `gql` tag — syntax checking |
| **allure-playwright** | 3.0+ | Allure report integration |
| **Docker** | - | Containerized execution (optional) |
| **GitHub Actions** | - | CI/CD pipeline (optional) |

**14 npm packages total** — minimal footprint, fast installation.

---

## 4. Configuration files explained in detail

### `package.json` — the project's "identity card"

```json
{
  "name": "playwright-api-e2e-poc",     // Project name
  "private": true,                       // Not published to npm
  "scripts": {                           // Run commands (npm run ...)
    "test": "npx playwright test",       // All tests
    "test:rest": "...",                  // REST only
    "test:smoke": "...",                 // @smoke tag only
    "test:allure": "npx allure serve allure-results"  // Open Allure
  },
  "dependencies": {
    "@playwright/test": "^1.50.0",       // Test execution
    "allure-playwright": "^3.0.0",       // Allure integration
    "graphql": "^16.10.0",              // GraphQL core (needed for gql tag)
    "graphql-request": "^7.1.0",        // gql template tag
    "zod": "^3.24.0"                    // Schema validation
  }
}
```

**What does `^` mean in the version?** For example, `^1.50.0` = install 1.50.0 or any newer version, but stay within 1.x. This way we automatically receive bug fixes without major breaking changes.

### `tsconfig.json` — TypeScript settings

```json
{
  "compilerOptions": {
    "target": "ES2022",              // What JS to compile to (modern)
    "module": "ESNext",              // Import/export syntax
    "strict": true,                  // Strict type checking
    "baseUrl": ".",                  // Starting point for path aliases
    "paths": {
      "@support/*": ["./support/*"], // import { UsersApi } from '@support/api-client/UsersApi'
      "@schemas/*": ["./schemas/*"]  // import { UserSchema } from '@schemas/users.schema'
    }
  }
}
```

**Why do we need path aliases?** So we don't have to write things like: `../../support/api-client/UsersApi` — instead we write `@support/api-client/UsersApi`. It's more readable and when moving files we don't need to update the paths.

### `playwright.config.ts` — the central configuration for test execution

```typescript
export default defineConfig({
  testDir: './tests',          // Where to look for test files
  fullyParallel: true,         // All tests run in parallel
  retries: process.env.CI ? 2 : 0,  // 2 retries in CI, 0 locally
  timeout: 30_000,             // Maximum 30s/test (if it doesn't finish in time, it's failing)

  reporter: [
    ['list'],                  // Console output (test names + time)
    ['html', { ... }],        // HTML report (to playwright-report/ folder)
    ['allure-playwright', { ... }],  // Allure report (to allure-results/ folder)
  ],

  projects: [                  // Two "projects" = two separate APIs
    {
      name: 'rest-api',
      testDir: './tests/rest',
      use: { baseURL: 'https://jsonplaceholder.typicode.com' },
    },
    {
      name: 'graphql-api',
      testDir: './tests/graphql',
      use: { baseURL: 'https://countries.trevorblades.com/graphql' },
    },
  ],
});
```

**What is a "project" in Playwright?** A configuration unit of a test suite. Each project can have its own baseURL, its own test directory. When `npm test` runs, both projects' tests are executed.

**`fullyParallel: true`** — all tests start simultaneously (in separate workers). This is why it's so fast: 13 tests run in ~1.4 seconds.

---

## 5. The API Object Model pattern

This is the heart of the framework. It is analogous to the **Page Object Model (POM)** pattern used in mobile/web E2E tests:

| POM (UI tests) | API Object Model (API tests) |
|----------------|------------------------------|
| `BasePage.ts` + `this.driver` | `BaseApiClient.ts` + `this.request` |
| `LoginPage.ts`, `HomePage.ts` | `UsersApi.ts`, `CountriesGraphQLApi.ts` |
| Selectors (CSS, testID) | HTTP endpoints, headers |
| `loginPage.clickSubmit()` | `usersApi.getUsers()` |
| Element lookup | HTTP request sending |

**The key point:** The spec file (test) NEVER sends direct HTTP requests. Every call goes through an API Object method. This way, if an endpoint URL changes, it needs to be modified in **one place** (the API Object), not in every test.

---

## 6. Inheritance — how it works

### What is inheritance?

A fundamental concept of Object-Oriented Programming (OOP). If there is a "parent" class (`BaseApiClient`) that contains shared functionality, the "child" classes (`UsersApi`, `CountriesGraphQLApi`) automatically receive this functionality without having to rewrite it.

### What does it look like in code?

```
BaseApiClient (parent)
├── this.request          ← Playwright HTTP client
├── getDefaultHeaders()   ← Common headers (auth + content-type)
├── graphqlRequest()      ← GraphQL POST call
│
├── UsersApi (child — REST)
│   ├── getUsers()        ← GET /users (uses: this.request + getDefaultHeaders)
│   ├── getUserById()     ← GET /users/:id
│   ├── createPost()      ← POST /posts
│   └── getUsersWithoutAuth()  ← GET /users (no headers — for auth testing)
│
└── CountriesGraphQLApi (child — GraphQL)
    ├── getCountries()    ← query { countries } (uses: graphqlRequest)
    ├── getCountryByCode() ← query { country(code:) }
    └── sendInvalidQuery() ← invalid query (for error testing)
```

### How is it built in code?

**Parent class:**
```typescript
// support/base/BaseApiClient.ts
export class BaseApiClient {
  protected readonly request: APIRequestContext;  // ← "protected" = children can see it

  constructor(request: APIRequestContext) {       // ← constructor: receives an HTTP client upon creation
    this.request = request;
  }

  protected getDefaultHeaders() { ... }          // ← "protected" method = children can use it
  protected async graphqlRequest() { ... }       // ← shared GraphQL logic
}
```

**Child class:**
```typescript
// support/api-client/UsersApi.ts
export class UsersApi extends BaseApiClient {     // ← "extends" = inherits from BaseApiClient
  async getUsers() {
    return this.request.get('/users', {           // ← this.request comes from the parent
      headers: this.getDefaultHeaders(),          // ← getDefaultHeaders() comes from the parent
    });
  }
}
```

**Keywords:**
- `extends` — "this class inherits from the other"
- `protected` — "child classes can see it, but it's not accessible from outside"
- `this` — "the current object" (can contain properties from the parent and its own)
- `constructor` — "this runs when you create the object (`new UsersApi(request)`)"

### Why is inheritance useful?

If tomorrow you need a new header for every API call (e.g., `X-Request-ID`), you write it in **one place**:

```typescript
// BaseApiClient.ts — ONE modification
protected getDefaultHeaders() {
  return {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
    'X-Request-ID': crypto.randomUUID(),  // ← NEW line
  };
}
```

Every child (`UsersApi`, `CountriesGraphQLApi`) automatically receives it. No need to modify 10 files.

---

## 7. The support layer — file by file

### `support/base/BaseApiClient.ts`

**What is this?** The ancestor of all API Objects. Contains shared HTTP logic.

**Contents:**
- `this.request` — Playwright `APIRequestContext`, the HTTP client used for every call
- `getDefaultHeaders()` — assembles headers (auth token + Content-Type)
- `graphqlRequest(query, variables)` — GraphQL POST call in a single centralized method

**Who uses it?** `UsersApi` and `CountriesGraphQLApi` — both inherit from it.

### `support/api-client/UsersApi.ts`

**What is this?** REST API Object for the JSONPlaceholder `/users` and `/posts` endpoints.

**Methods:**
| Method | HTTP call | What it tests |
|--------|-----------|---------------|
| `getUsers()` | `GET /users` | Fetching all users |
| `getUserById(id)` | `GET /users/:id` | Fetching a single user |
| `createPost(data)` | `POST /posts` | Creating a new resource (CRUD test) |
| `getUsersWithoutAuth()` | `GET /users` (no headers) | Testing missing auth |

**Who calls it?** `tests/rest/users.spec.ts`

### `support/api-client/CountriesGraphQLApi.ts`

**What is this?** GraphQL API Object for the Countries API.

**Methods:**
| Method | GraphQL query | What it tests |
|--------|--------------|---------------|
| `getCountries()` | `ListCountries` | Fetching all countries |
| `getCountryByCode(code)` | `GetCountry($code)` | A single country by code |
| `sendInvalidQuery()` | Invalid syntax | Error handling |

**Important:** This class does NOT contain the query strings! It imports them from `countries.queries.ts`. This is separation of concerns.

**Who calls it?** `tests/graphql/countries.spec.ts`

### `support/helpers/auth.helper.ts`

**What is this?** Token management — the single place where authentication logic lives.

**Functions:**
- `getTestToken()` — returns the JWT token (from env variable or empty)
- `getAuthHeaders()` — returns an `{ Authorization: 'Bearer ...' }` object
- `isLocalEnvironment()` — are we running in CI or locally?

**Who calls it?** `BaseApiClient.getDefaultHeaders()` — so indirectly every API Object.

### `support/helpers/allure.helper.ts`

**What is this?** It does two things:
1. **TestMeta object** — all Allure metadata (epic/feature/story/severity) in one central place
2. **Helper functions** — `setTestMeta()` and `logResponseTime()`

**Who calls it?** Every spec file, at the beginning of every test.

---

## 8. GraphQL handling — queries, fragments, gql tag

### What is the `gql` tag?

Part of the `graphql-request` package. A "tagged template literal" — a special JavaScript syntax that processes the query string:

```typescript
import { gql } from 'graphql-request';

const query = gql`
  query GetCountry($code: ID!) {
    country(code: $code) {
      name
      capital
    }
  }
`;
```

**What does it provide?**
- IDE syntax highlighting (the query code is color-coded)
- Basic syntax validation
- Fragment linking (using `${FRAGMENT}` syntax)

### What is a Fragment?

A **reusable field list**. If multiple queries request the same fields, you don't want to repeat them everywhere:

```typescript
// WITHOUT it — repetition:
const query1 = gql`{ countries { code name capital currency } }`;
const query2 = gql`{ country(code: "HU") { code name capital currency } }`;
//                                          ^^^^^^^^^^^^^^^^^^^^^^^^^ repeated!

// WITH it — reuse:
const FIELDS = gql`fragment CountryCoreFields on Country { code name capital currency }`;
const query1 = gql`{ countries { ...CountryCoreFields } } ${FIELDS}`;
const query2 = gql`{ country(code: "HU") { ...CountryCoreFields } } ${FIELDS}`;
```

If tomorrow you need a new field (e.g., `emoji`), you add it in **one place** — the fragment.

### Why in a separate file (`countries.queries.ts`)?

**Rule: query strings NEVER go in spec files.**

Reasons:
1. **Maintainability** — if the query changes, you modify one file, not 5 tests
2. **Readability** — the spec file contains only test logic
3. **Reusability** — multiple tests can use the same query
4. **Autocomplete** — `CountryQueries.` → IDE lists available queries

---

## 9. Zod schema validation — what it is and why we need it

### What is Zod?

A TypeScript library that validates **at runtime** whether data conforms to a given structure.

### Why do we need it?

TypeScript only checks **at compile time**. If the API response structure changes (field rename, type change), TypeScript won't warn — since the response only arrives at runtime.

**Without Zod:**
```typescript
const user = await response.json();
// TypeScript doesn't know what structure "user" has
// If the backend renamed "name" to "fullName", nothing warns you
expect(user.name).toBe('Leanne Graham');  // undefined — fails silently
```

**With Zod:**
```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

UserSchema.parse(user);
// If "name" is missing: ZodError: Required at "name"
// If "id" is string: ZodError: Expected number, received string at "id"
// If "email" is not an email: ZodError: Invalid email at "email"
```

**A single line of code** catches all structural changes. The error message tells you exactly **which field** and **what the problem is**.

### How do we use it?

```typescript
// schemas/users.schema.ts — define the expected structure
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

// users.spec.ts — validate with a single assertion
expect(() => UsersListSchema.parse(users)).not.toThrow();
```

### BrokenSchema — the secret of the demo tests

`UserBrokenSchema` and `CountryBrokenSchema` are **intentionally wrong** schemas:

```typescript
// This will NEVER pass — because "fullName" and "department" don't exist in the API
export const UserBrokenSchema = z.object({
  id: z.number(),
  fullName: z.string(),     // ← the API sends "name", not "fullName"
  department: z.string(),   // ← this field doesn't exist
});
```

This demonstrates: if a developer renames a field, Zod **catches it immediately** and the Allure report clearly shows what the error is.

---

## 10. Fixtures — centralizing test data

### What is a Fixture?

A **central data store** containing expected values. The test does not contain hardcoded strings — everything comes from here.

```typescript
// tests/fixtures/users.fixture.ts
export const UserFixtures = {
  firstUser: {
    id: 1,
    name: 'Leanne Graham',
    username: 'Bret',
    email: 'Sincere@april.biz',
  },
  totalCount: 10,
  newPost: {
    title: 'Playwright API E2E Test',
    body: 'Created by automated test',
    userId: 1,
  },
};
```

### Why not write it directly in the test?

```typescript
// BAD — hardcoded in the test:
expect(users).toHaveLength(10);
expect(user.name).toBe('Leanne Graham');

// GOOD — from fixture:
expect(users).toHaveLength(UserFixtures.totalCount);
expect(user.name).toBe(UserFixtures.firstUser.name);
```

**Reasons:**
1. If the data changes, you modify it in **one place** (not in 5 tests)
2. **Autocomplete** — `UserFixtures.` → IDE lists available data
3. **Typo protection** — TypeScript throws an error if you reference a non-existent property
4. Like selectors in mobile tests — if the selector changes, you modify it in the Page Object, not in the test

---

## 11. Spec files — the anatomy of tests

### Structure of a test

```typescript
test('@smoke shouldReturn200WithUsersListWhenCalled', async () => {
  // 1. ARRANGE — Set up Allure metadata
  await setTestMeta({ ...meta, story: meta.stories.list });

  // 2. ACT — Execute API call
  const start = Date.now();
  const response = await usersApi.getUsers();
  await logResponseTime(start);

  // 3. ASSERT — Verify the result
  const users = await response.json();
  expect(response.status()).toBe(200);
  expect(users).toHaveLength(UserFixtures.totalCount);
});
```

**AAA pattern (Arrange-Act-Assert):**
- **Arrange** — preparation (metadata, test data)
- **Act** — the action (API call)
- **Assert** — verification (status code, body, schema)

### Test naming convention

`should<Expectation>When<Condition>`

Examples:
- `shouldReturn200WithUsersListWhenCalled` — should return 200 with a user list when called
- `shouldReturnHungaryDetailsWhenCodeIsHU` — should return Hungary details when the code is HU
- `shouldDetectSchemaMismatchWhenFieldRenamed` — should detect schema mismatch when a field is renamed

### `test.describe()` and `test.beforeEach()`

```typescript
test.describe('REST — GET /users', () => {        // Logical group
  let usersApi: UsersApi;                          // Variable declaration

  test.beforeEach(async ({ request }) => {         // Runs BEFORE every test
    usersApi = new UsersApi(request);              // Create new API Object
  });

  test('...', async () => { ... });                // Test 1
  test('...', async () => { ... });                // Test 2
});
```

**`test.beforeEach`** — runs before every test. Ensures that every test starts from a clean state (no shared state between tests).

**`{ request }`** — Playwright automatically provides an `APIRequestContext`. This is the HTTP client that sends requests to the configured `baseURL`.

---

## 12. Allure reporting — metadata and measurement

### Allure hierarchy

In the Allure report, tests appear hierarchically:

```
Epic (highest level)
└── Feature (functionality)
    └── Story (specific user story)
        └── Test (a single test case)
```

For example:
```
REST API (epic)
└── Users Endpoint (feature)
    ├── GET /users — list all users (story)
    │   └── @smoke shouldReturn200WithUsersListWhenCalled ✓
    ├── POST /posts — create resource (story)
    │   └── @regression shouldReturn201WhenPostIsCreated ✓
    └── DEMO: Schema mismatch detection (story)
        └── @demo shouldDetectSchemaMismatchWhenFieldRenamed ✘
```

### How does metadata get added?

```typescript
// allure.helper.ts — centralized metadata object
export const TestMeta = {
  users: {
    epic: 'REST API',
    feature: 'Users Endpoint',
    severity: 'critical',
    stories: {
      list: 'GET /users — list all users',
      byId: 'GET /users/:id — single user by ID',
    },
  },
};

// spec file — a single call
await setTestMeta({ ...meta, story: meta.stories.list });
```

**Why centralized?** So you don't have to manually write epic/feature names in every test. If a feature is renamed, you modify it in one place.

### Response time measurement

```typescript
const start = Date.now();                    // Start timing
const response = await usersApi.getUsers();  // API call
const duration = await logResponseTime(start); // Record time in Allure

// Optionally: threshold test
expect(duration).toBeLessThan(2000);  // Maximum 2 seconds
```

In the Allure report, this appears as a **parameter** for every test:
```
Parameters:
  Response time (ms) → 64
```

### Trend graphs — tracking changes across runs

Allure has built-in support for **trend graphs** that show how test results change over time:
- **History Trend** — pass/fail/broken ratio across runs
- **Duration Trend** — how test execution time changes
- **Categories Trend** — error types over time
- **Retry Trend** — flaky test patterns

**How does it work technically?**

When `allure generate` creates a report, it writes a `history/` folder inside `allure-report/`:

```
allure-report/
  └── history/
       ├── history.json           ← pass/fail data per test
       ├── history-trend.json     ← aggregated trend data
       ├── duration-trend.json    ← execution time trend
       ├── categories-trend.json  ← error categories trend
       └── retry-trend.json       ← retry trend
```

For the **next** run to show a trend, this `history/` folder must be present inside `allure-results/` **before** generation:

```bash
# Step 1: Run tests + generate report (first run — no trend yet)
npm test
allure generate allure-results -o allure-report --clean

# Step 2: Before the next run — copy history back
cp -r allure-report/history allure-results/history

# Step 3: Run tests again
npm test

# Step 4: Generate report — trend graphs now appear!
allure generate allure-results -o allure-report --clean
allure open allure-report
```

**Why doesn't `allure serve` show trends?** Because `allure serve` generates the report to a temporary directory and discards it after closing. It never preserves history.

**In CI/CD:** The `allure-report/history/` folder should be cached (e.g., GitHub Actions artifact or cache action) between pipeline runs. This way trends build up automatically with each pipeline execution.

```yaml
# Example GitHub Actions approach:
# 1. Download previous allure-report/history/ from artifacts
# 2. Copy into allure-results/history/
# 3. Run tests
# 4. allure generate
# 5. Upload allure-report/ as artifact (includes new history/)
```

**What does the Test Manager see?** After 3-5 runs with history preserved, the Allure dashboard displays line charts showing stability, speed changes, and regression patterns over time — essential for sprint reviews and quality reporting.

---

## 13. Tag system — @smoke, @regression, @demo

Tags are in the test name (Playwright `--grep` filters them):

```typescript
test('@smoke shouldReturn200WithUsersListWhenCalled', ...);     // Smoke tag
test('@regression shouldReturn201WhenPostIsCreated', ...);      // Regression tag
test('@demo shouldDetectSchemaMismatchWhenFieldRenamed', ...);  // Demo tag
```

| Tag | Purpose | When to run? | Expectation |
|-----|---------|-------------|-------------|
| `@smoke` | Quick happy-path | Every push, morning, after deploy | All green |
| `@regression` | Full coverage | Daily, per PR | All green |
| `@demo` | Error demonstration | During demos | All RED (intentional) |

Execution: `npm run test:smoke`, `npm run test:regression`, `npm run test:demo`

---

## 14. Docker — containerization

### What is Docker and why do we need it?

Docker is a "container" technology: it packages your application (and all its dependencies) into a box that **runs the same way everywhere**. No more "works on my machine, not on yours" problems.

### `Dockerfile` — the image recipe

```dockerfile
FROM node:20-slim           # Base: minimal Node.js 20 image
WORKDIR /app                # Working directory inside the container
COPY package.json ./        # First copy only package.json (cache optimization)
RUN npm ci                  # Install dependencies
COPY . .                    # Then copy the full source code
CMD ["npx", "playwright", "test"]  # Default command: run tests
```

### `docker-compose.yml` — easy execution

```yaml
services:
  api-tests:
    build: .                # Build image from Dockerfile
    environment:            # Environment variables
      - BASE_URL_REST=...
      - BASE_URL_GRAPHQL=...
    volumes:                # Results come out of the container to the host
      - ./allure-results:/app/allure-results
```

The `volumes` key is crucial: the allure-results and playwright-report folders will be accessible on the host machine after execution.

---

## 15. CI/CD — automated execution

### What is CI/CD?

- **CI (Continuous Integration)** — tests run automatically on every code change
- **CD (Continuous Delivery)** — automated delivery (deploy)

### GitHub Actions workflow

```yaml
on:
  pull_request:              # Runs on every PR
  schedule:
    - cron: '0 6 * * 1-5'   # Monday to Friday at 6 AM

jobs:
  test:
    runs-on: ubuntu-latest   # Runs on Ubuntu server
    steps:
      - checkout             # Download code
      - setup-node           # Install Node.js
      - npm ci               # Install dependencies
      - playwright test      # Run tests
      - upload-artifact      # Archive report (for 30 days)
```

**Result:** All tests run automatically on every PR. If anything fails, the PR check turns red.

---

## 16. Error detection — what this framework catches

| # | Error type | How we detect it | Example |
|---|-----------|------------------|---------|
| 1 | Field rename | Zod schema validation | `name` → `fullName` → ZodError |
| 2 | Field removal | Zod schema validation | `population` missing → ZodError |
| 3 | GraphQL query error | `body.errors` check | Backend schema changed |
| 4 | GraphQL syntax error | Error response validation | Invalid query handling |
| 5 | Endpoint removed | HTTP status code assert | 404 instead of 200 |
| 6 | Response format change | Zod type checking | Object instead of array |
| 7 | Auth breakage | Header test | 401 where 200 is expected |
| 8 | CRUD breakage | POST/PUT/DELETE status | 500 instead of 201 |
| 9 | Data regression | Fixture comparison | null instead of "Budapest" |
| 10 | Response time degradation | Response time threshold | 5000ms instead of 200ms |
| +1 | Content-type | Header assert | text/html instead of JSON |

---

## 17. Test management considerations

### What does the Test Manager see in the Allure report?

1. **Dashboard** — aggregated pass/fail ratio, trend chart
2. **Suites** — tests grouped (REST / GraphQL)
3. **Behaviors** — Epic → Feature → Story hierarchy
4. **Timeline** — parallel execution visualized (how fast)
5. **Categories** — error types (Product defect, Test defect)
6. **Retries** — flaky test identification
7. **Duration** — which test is the slowest

### Traceability

The Allure report for every test contains:
- **Epic** — which major functional area
- **Feature** — which API endpoint
- **Story** — exactly what behavior
- **Severity** — critical / normal
- **Parameters** — Response time

It can be extended later with issue tracker links:
```typescript
await allure.link('https://jira.example.com/browse/PROJ-123', 'PROJ-123', 'issue');
```

### Cost

**$0** — every component is free and open source:
- Playwright (MIT license)
- Allure (Apache 2.0)
- Zod (MIT)
- GitHub Actions (free for public repos)

---

## 18. Complete data flow — who calls whom and why

```
┌────────────────────────────────────────────────────────────────┐
│  playwright.config.ts                                          │
│  "Where are the tests? What URL to target? What reports?"      │
│  Sets: testDir, baseURL, reporter, parallel, retry             │
└────────────────────┬───────────────────────────────────────────┘
                     │ starts
                     ▼
┌────────────────────────────────────────────────────────────────┐
│  users.spec.ts / countries.spec.ts                             │
│  "What is the test scenario?"                                  │
│  Contains: describe, beforeEach, test blocks (AAA)             │
│                                                                │
│  Imports:                                                      │
│  ┌─────────────────┐  ┌───────────────┐  ┌──────────────────┐ │
│  │ API Object      │  │ Fixture       │  │ Schema           │ │
│  │ (what to call?) │  │ (what to      │  │ (what should it  │ │
│  │                 │  │  expect?)     │  │  look like?)     │ │
│  └────────┬────────┘  └───────────────┘  └──────────────────┘ │
│           │  + allure.helper.ts (metadata + timing)            │
└───────────┼────────────────────────────────────────────────────┘
            │ calls
            ▼
┌────────────────────────────────────────────────────────────────┐
│  UsersApi.ts / CountriesGraphQLApi.ts                          │
│  "How to call the API?"                                        │
│  Contains: methods (getUsers, getCountryByCode, etc.)          │
│                                                                │
│  Inherits from: BaseApiClient                                  │
│  ┌──────────────────────────────┐                              │
│  │ BaseApiClient.ts             │                              │
│  │ this.request (HTTP client)   │                              │
│  │ getDefaultHeaders()          │──→ auth.helper.ts (token)    │
│  │ graphqlRequest()             │                              │
│  └──────────────────────────────┘                              │
│                                                                │
│  GraphQL API Object extra:                                     │
│  └── imports: countries.queries.ts                              │
│                └── query strings + fragments                    │
└────────────────────────────────────────────────────────────────┘
            │ sends HTTP request
            ▼
┌────────────────────────────────────────────────────────────────┐
│  External API (JSONPlaceholder / Countries API)                │
│  Responds: JSON body + status code + headers                   │
└────────────────────────────────────────────────────────────────┘
            │ response comes back
            ▼
┌────────────────────────────────────────────────────────────────┐
│  Spec file — ASSERT section                                    │
│  Verifications:                                                │
│  1. Status code    → expect(response.status()).toBe(200)       │
│  2. Body values    → expect(user.name).toBe(Fixture.name)     │
│  3. Schema         → expect(() => Schema.parse(body)).not...   │
│  4. Timing         → expect(duration).toBeLessThan(2000)      │
│  5. Headers        → expect(contentType).toContain('json')    │
└────────────────────────────────────────────────────────────────┘
            │ result
            ▼
┌────────────────────────────────────────────────────────────────┐
│  Reporters (defined in playwright.config.ts)                   │
│  ├── list         → console output (✓ / ✘ + time)             │
│  ├── html         → playwright-report/ (HTML files)            │
│  └── allure       → allure-results/ (JSON files)               │
│                      └── allure serve → browser dashboard      │
└────────────────────────────────────────────────────────────────┘
```

---

> **Congratulations!** If you've made it this far, you now understand everything needed for this framework. The next step: write your first test following the [Structure and daily work](./02-STRUCTURE-AND-DAILY-WORK.en.md) document.
