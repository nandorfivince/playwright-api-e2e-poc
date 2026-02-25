# Struktúra és napi munka

## Tartalomjegyzék

- [1. Projekt struktúra](#1-projekt-struktúra)
- [2. Fájlok közötti kapcsolatok (lánc)](#2-fájlok-közötti-kapcsolatok-lánc)
- [3. Melyik fájl mit csinál](#3-melyik-fájl-mit-csinál)
- [4. Új teszt létrehozása — lépésről lépésre](#4-új-teszt-létrehozása--lépésről-lépésre)
- [5. Napi munka — workflow](#5-napi-munka--workflow)

---

## 1. Projekt struktúra

```
playwright-api-e2e-poc/
│
├── playwright.config.ts          ← Központi konfiguráció (projektek, reporter, timeout)
├── package.json                  ← Függőségek és npm scriptek
├── tsconfig.json                 ← TypeScript beállítások + path alias-ok
│
├── support/                      ← FRAMEWORK RÉTEG (nem teszt, hanem infrastruktúra)
│   ├── base/
│   │   └── BaseApiClient.ts      ← Alap osztály — minden API Object ebből örököl
│   ├── api-client/
│   │   ├── UsersApi.ts           ← REST API Object (JSONPlaceholder /users)
│   │   └── CountriesGraphQLApi.ts ← GraphQL API Object (Countries API)
│   ├── graphql/
│   │   └── queries/
│   │       └── countries.queries.ts ← GraphQL query-k + fragment-ek (gql tag)
│   └── helpers/
│       ├── auth.helper.ts        ← Token kezelés (env-alapú)
│       └── allure.helper.ts      ← Allure metadata + response time mérés
│
├── schemas/                      ← ZOD SÉMÁK (válasz struktúra validáció)
│   ├── users.schema.ts           ← REST User/UsersList + BrokenSchema (demo)
│   └── countries.schema.ts       ← GraphQL Country/Error + BrokenSchema (demo)
│
├── tests/                        ← TESZTEK
│   ├── fixtures/
│   │   ├── users.fixture.ts      ← Elvárt értékek (user nevek, darabszám, post body)
│   │   └── countries.fixture.ts  ← Elvárt értékek (Hungary adatai)
│   ├── rest/
│   │   └── users.spec.ts         ← REST spec: 6 pozitív + 2 demo
│   └── graphql/
│       └── countries.spec.ts     ← GraphQL spec: 4 pozitív + 1 demo
│
├── Dockerfile                    ← Docker image definíció
├── docker-compose.yml            ← Docker futtatási konfiguráció
└── .github/workflows/
    └── api-tests.yml             ← CI/CD pipeline (GitHub Actions)
```

---

## 2. Fájlok közötti kapcsolatok (lánc)

```
Spec fájl (.spec.ts)
  │
  ├── importálja → API Object (UsersApi / CountriesGraphQLApi)
  │                   │
  │                   └── örököl → BaseApiClient
  │                                   │
  │                                   └── használja → auth.helper.ts (tokenek)
  │
  ├── importálja → Fixture (users.fixture.ts / countries.fixture.ts)
  │                   └── elvárt értékek összehasonlításhoz
  │
  ├── importálja → Schema (users.schema.ts / countries.schema.ts)
  │                   └── Zod validáció — response struktúra ellenőrzés
  │
  └── importálja → allure.helper.ts
                      └── setTestMeta() + logResponseTime()
```

**GraphQL spec-nél egy extra lánc:**
```
CountriesGraphQLApi
  └── importálja → countries.queries.ts (gql tagged query-k)
                      └── használja → fragment-eket (mezőlista újrahasznosítás)
```

---

## 3. Melyik fájl mit csinál

| Fájl | Felelősség | Módosítod ha... |
|------|-----------|-----------------|
| `BaseApiClient.ts` | Közös HTTP logika (headers, graphqlRequest) | Új header kell mindenhova |
| `UsersApi.ts` | REST endpoint metódusok | Új REST endpoint jön |
| `CountriesGraphQLApi.ts` | GraphQL query hívások | Új GraphQL query jön |
| `countries.queries.ts` | Query stringek + fragment-ek | Query struktúra változik |
| `auth.helper.ts` | Token kezelés | Auth logika változik |
| `allure.helper.ts` | Allure metadata + TestMeta | Új feature/epic/story |
| `users.schema.ts` | REST response Zod séma | REST válasz struktúra változik |
| `countries.schema.ts` | GraphQL response Zod séma | GraphQL válasz struktúra változik |
| `users.fixture.ts` | REST elvárt értékek | Teszt adatok változnak |
| `countries.fixture.ts` | GraphQL elvárt értékek | Teszt adatok változnak |
| `users.spec.ts` | REST teszt esetek | Új REST teszt kell |
| `countries.spec.ts` | GraphQL teszt esetek | Új GraphQL teszt kell |

---

## 4. Új teszt létrehozása — lépésről lépésre

### 4a. Új teszt MEGLÉVŐ endpoint-hoz

Csak a spec fájlba kell új `test()` blokkot írni:

```typescript
// tests/rest/users.spec.ts — új teszt hozzáadása
test('@regression shouldReturnEmptyWhenIdIsInvalid', async () => {
  await setTestMeta({ ...meta, story: 'GET /users/:id — invalid ID' });

  const response = await usersApi.getUserById(99999);

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({});
});
```

### 4b. Új REST endpoint tesztje

**1. API Object bővítés** (`support/api-client/UsersApi.ts`):
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
  // ...meglévők...
  delete: 'DELETE /posts/:id — delete resource',
},
```

**3. Teszt** (`tests/rest/users.spec.ts`):
```typescript
test('@regression shouldReturn200WhenPostIsDeleted', async () => {
  await setTestMeta({ ...meta, story: meta.stories.delete });
  const response = await usersApi.deletePost(1);
  expect(response.status()).toBe(200);
});
```

### 4c. Új GraphQL query tesztje

**1. Query** (`support/graphql/queries/countries.queries.ts`):
```typescript
export const CountryQueries = {
  // ...meglévők...
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

**3. Séma** (`schemas/countries.schema.ts`):
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

**4. Teszt** (`tests/graphql/countries.spec.ts`):
```typescript
test('@smoke shouldReturnContinentsListWhenQueried', async () => {
  await setTestMeta({ ...meta, story: 'List all continents' });
  const response = await countriesApi.getContinents();
  const body = await response.json();
  expect(body.data.continents.length).toBeGreaterThan(0);
});
```

### 4d. Teljesen új feature (pl. Posts)

1. `support/api-client/PostsApi.ts` — új API Object
2. `support/graphql/queries/posts.queries.ts` — ha GraphQL
3. `schemas/posts.schema.ts` — Zod séma
4. `tests/fixtures/posts.fixture.ts` — elvárt értékek
5. `tests/rest/posts.spec.ts` — tesztek
6. `allure.helper.ts` → `TestMeta.posts` bővítés

---

## 5. Napi munka — workflow

### Reggel

```bash
git pull                  # Friss kód
npm install               # Ha volt dependency változás (package.json diff)
npm run test:smoke        # Gyors ellenőrzés — minden működik?
```

### Új teszt írása

1. Olvasd el a ticket-et / requirement-et
2. Döntsd el: meglévő endpoint → csak spec bővítés, vagy új endpoint → API Object is kell
3. Írd meg a tesztet a fenti lépések szerint
4. Futtasd: `npx playwright test -g "tesztNév"`
5. Ellenőrizd az Allure riportban: `npm run test:allure`

### Commit előtt

```bash
npm test                  # Összes teszt fut
npm run test:smoke        # Legalább a smoke zöld
```

### Allure trend — futtatások közötti előzmények követése

Az Allure képes trend grafikonokat megjeleníteni (pass/fail arány, futási idő, retry-ok) több futtatás között. A lényeg: a `history/` mappát meg kell őrizni a riport generálások között.

```bash
# Futtatás után — statikus riport generálás
npm test
allure generate allure-results -o allure-report --clean

# A következő futtatás előtt — history visszamásolása az eredmények közé
cp -r allure-report/history allure-results/history

# Újrafuttatás + generálás — megjelennek a trendek
npm test
allure generate allure-results -o allure-report --clean
allure open allure-report
```

> **Fontos:** A `npm run test:allure` az `allure serve`-öt használja (ideiglenes riport, nincs history). Trendekhez mindig az `allure generate` + `allure open` párost használd.

CI/CD-ben az `allure-report/history/` mappát cache-elni kell vagy artifact-ként tárolni a pipeline futtatások között, hogy a trend adatok automatikusan megmaradjanak.

### Hasznos parancsok fejlesztés közben

```bash
# Csak az aktuális fájlt futtatni
npx playwright test tests/rest/users.spec.ts

# Csak egy tesztet név alapján
npx playwright test -g "shouldReturn201"

# Debug mód (lépésről lépésre)
npx playwright test --debug
```
