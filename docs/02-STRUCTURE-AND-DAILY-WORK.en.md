# Structure and Daily Work

## Table of Contents

- [1. Project Structure](#1-project-structure)
- [2. File Relationships (chain)](#2-file-relationships-chain)
- [3. What Each File Does](#3-what-each-file-does)
- [4. Creating a New Test — step by step](#4-creating-a-new-test--step-by-step)
- [5. Daily Work — workflow](#5-daily-work--workflow)

---

## 1. Project Structure

```
playwright-api-e2e-poc/
│
├── playwright.config.ts          ← Central configuration (projects, reporter, timeout)
├── package.json                  ← Dependencies and npm scripts
├── tsconfig.json                 ← TypeScript settings + path aliases
│
├── support/                      ← FRAMEWORK LAYER (not tests, but infrastructure)
│   ├── base/
│   │   └── BaseApiClient.ts      ← Base class — all API Objects inherit from this
│   ├── api-client/
│   │   ├── UsersApi.ts           ← REST API Object (JSONPlaceholder /users)
│   │   └── CountriesGraphQLApi.ts ← GraphQL API Object (Countries API)
│   ├── graphql/
│   │   └── queries/
│   │       └── countries.queries.ts ← GraphQL queries + fragments (gql tag)
│   └── helpers/
│       ├── auth.helper.ts        ← Token management (env-based)
│       └── allure.helper.ts      ← Allure metadata + response time measurement
│
├── schemas/                      ← ZOD SCHEMAS (response structure validation)
│   ├── users.schema.ts           ← REST User/UsersList + BrokenSchema (demo)
│   └── countries.schema.ts       ← GraphQL Country/Error + BrokenSchema (demo)
│
├── tests/                        ← TESTS
│   ├── fixtures/
│   │   ├── users.fixture.ts      ← Expected values (user names, count, post body)
│   │   └── countries.fixture.ts  ← Expected values (Hungary data)
│   ├── rest/
│   │   └── users.spec.ts         ← REST spec: 6 positive + 2 demo
│   └── graphql/
│       └── countries.spec.ts     ← GraphQL spec: 4 positive + 1 demo
│
├── Dockerfile                    ← Docker image definition
├── docker-compose.yml            ← Docker run configuration
└── .github/workflows/
    └── api-tests.yml             ← CI/CD pipeline (GitHub Actions)
```

---

## 2. File Relationships (chain)

```
Spec file (.spec.ts)
  │
  ├── imports → API Object (UsersApi / CountriesGraphQLApi)
  │                │
  │                └── extends → BaseApiClient
  │                                 │
  │                                 └── uses → auth.helper.ts (tokens)
  │
  ├── imports → Fixture (users.fixture.ts / countries.fixture.ts)
  │                └── expected values for comparison
  │
  ├── imports → Schema (users.schema.ts / countries.schema.ts)
  │                └── Zod validation — response structure checking
  │
  └── imports → allure.helper.ts
                   └── setTestMeta() + logResponseTime()
```

**Additional chain for GraphQL specs:**
```
CountriesGraphQLApi
  └── imports → countries.queries.ts (gql tagged queries)
                   └── uses → fragments (field list reuse)
```

---

## 3. What Each File Does

| File | Responsibility | Modify when... |
|------|---------------|----------------|
| `BaseApiClient.ts` | Shared HTTP logic (headers, graphqlRequest) | New header needed everywhere |
| `UsersApi.ts` | REST endpoint methods | New REST endpoint added |
| `CountriesGraphQLApi.ts` | GraphQL query calls | New GraphQL query added |
| `countries.queries.ts` | Query strings + fragments | Query structure changes |
| `auth.helper.ts` | Token management | Auth logic changes |
| `allure.helper.ts` | Allure metadata + TestMeta | New feature/epic/story |
| `users.schema.ts` | REST response Zod schema | REST response structure changes |
| `countries.schema.ts` | GraphQL response Zod schema | GraphQL response structure changes |
| `users.fixture.ts` | REST expected values | Test data changes |
| `countries.fixture.ts` | GraphQL expected values | Test data changes |
| `users.spec.ts` | REST test cases | New REST test needed |
| `countries.spec.ts` | GraphQL test cases | New GraphQL test needed |

---

## 4. Creating a New Test — step by step

### 4a. New test for an EXISTING endpoint

Just add a new `test()` block in the spec file:

```typescript
// tests/rest/users.spec.ts — adding a new test
test('@regression shouldReturnEmptyWhenIdIsInvalid', async () => {
  await setTestMeta({ ...meta, story: 'GET /users/:id — invalid ID' });

  const response = await usersApi.getUserById(99999);

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({});
});
```

### 4b. Test for a new REST endpoint

**1. Extend API Object** (`support/api-client/UsersApi.ts`):
```typescript
async deletePost(id: number) {
  return this.request.delete(`/posts/${id}`, {
    headers: this.getDefaultHeaders(),
  });
}
```

**2. Allure story** (`support/helpers/allure.helper.ts`):
```typescript
stories: {
  // ...existing...
  delete: 'DELETE /posts/:id — delete resource',
},
```

**3. Test** (`tests/rest/users.spec.ts`):
```typescript
test('@regression shouldReturn200WhenPostIsDeleted', async () => {
  await setTestMeta({ ...meta, story: meta.stories.delete });
  const response = await usersApi.deletePost(1);
  expect(response.status()).toBe(200);
});
```

### 4c. Test for a new GraphQL query

**1. Query** (`support/graphql/queries/countries.queries.ts`):
```typescript
export const CountryQueries = {
  // ...existing...
  continents: gql`
    query ListContinents {
      continents { code name }
    }
  `,
};
```

**2. API Object** (`support/api-client/CountriesGraphQLApi.ts`):
```typescript
async getContinents() {
  return this.graphqlRequest(CountryQueries.continents);
}
```

**3. Schema** (`schemas/countries.schema.ts`):
```typescript
export const ContinentsResponseSchema = z.object({
  data: z.object({
    continents: z.array(z.object({
      code: z.string(),
      name: z.string(),
    })),
  }),
});
```

**4. Test** (`tests/graphql/countries.spec.ts`):
```typescript
test('@smoke shouldReturnContinentsListWhenQueried', async () => {
  await setTestMeta({ ...meta, story: 'List all continents' });
  const response = await countriesApi.getContinents();
  const body = await response.json();
  expect(body.data.continents.length).toBeGreaterThan(0);
});
```

### 4d. Entirely new feature (e.g. Posts)

1. `support/api-client/PostsApi.ts` — new API Object
2. `support/graphql/queries/posts.queries.ts` — if GraphQL
3. `schemas/posts.schema.ts` — Zod schema
4. `tests/fixtures/posts.fixture.ts` — expected values
5. `tests/rest/posts.spec.ts` — tests
6. `allure.helper.ts` → extend `TestMeta.posts`

---

## 5. Daily Work — workflow

### Morning

```bash
git pull                  # Get latest code
npm install               # If dependencies changed (package.json diff)
npm run test:smoke        # Quick check — everything working?
```

### Writing a new test

1. Read the ticket / requirement
2. Decide: existing endpoint → just extend spec, or new endpoint → need API Object too
3. Write the test following the steps above
4. Run it: `npx playwright test -g "testName"`
5. Verify in Allure report: `npm run test:allure`

### Before commit

```bash
npm test                  # All tests run
npm run test:smoke        # At least smoke is green
```

### Allure trend — tracking history across runs

Allure can show trend graphs (pass/fail ratio, duration, retries) across multiple runs. The key is to preserve the `history/` folder between report generations.

```bash
# After a test run — generate a static report
npm test
allure generate allure-results -o allure-report --clean

# Before the next run — copy history back into results
cp -r allure-report/history allure-results/history

# Run tests again + generate — trends will appear
npm test
allure generate allure-results -o allure-report --clean
allure open allure-report
```

> **Important:** `npm run test:allure` uses `allure serve` (temporary report, no history). For trends, always use `allure generate` + `allure open`.

In CI/CD, the `allure-report/history/` folder should be cached or stored as an artifact between pipeline runs to maintain trend data automatically.

### Useful commands during development

```bash
# Run only current file
npx playwright test tests/rest/users.spec.ts

# Only one test by name
npx playwright test -g "shouldReturn201"

# Debug mode (step by step)
npx playwright test --debug
```
