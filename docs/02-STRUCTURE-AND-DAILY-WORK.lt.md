# Struktūra ir kasdienis darbas

## Turinys

- [1. Projekto struktūra](#1-projekto-struktūra)
- [2. Ryšiai tarp failų (grandinė)](#2-ryšiai-tarp-failų-grandinė)
- [3. Ką daro kiekvienas failas](#3-ką-daro-kiekvienas-failas)
- [4. Naujo testo kūrimas — žingsnis po žingsnio](#4-naujo-testo-kūrimas--žingsnis-po-žingsnio)
- [5. Kasdienis darbas — darbo eiga](#5-kasdienis-darbas--darbo-eiga)

---

## 1. Projekto struktūra

```
playwright-api-e2e-poc/
│
├── playwright.config.ts          ← Centrinė konfigūracija (projektai, reporter, timeout)
├── package.json                  ← Priklausomybės ir npm skriptai
├── tsconfig.json                 ← TypeScript nustatymai + kelio alias'ai
│
├── support/                      ← KARKASO SLUOKSNIS (ne testai, o infrastruktūra)
│   ├── base/
│   │   └── BaseApiClient.ts      ← Bazinė klasė — visi API Objects paveldi iš jos
│   ├── api-client/
│   │   ├── UsersApi.ts           ← REST API Object (JSONPlaceholder /users)
│   │   └── CountriesGraphQLApi.ts ← GraphQL API Object (Countries API)
│   ├── graphql/
│   │   └── queries/
│   │       └── countries.queries.ts ← GraphQL užklausos + fragmentai (gql tag)
│   └── helpers/
│       ├── auth.helper.ts        ← Token valdymas (env pagrindu)
│       └── allure.helper.ts      ← Allure metaduomenys + atsako laiko matavimas
│
├── schemas/                      ← ZOD SCHEMOS (atsako struktūros validacija)
│   ├── users.schema.ts           ← REST User/UsersList + BrokenSchema (demo)
│   └── countries.schema.ts       ← GraphQL Country/Error + BrokenSchema (demo)
│
├── tests/                        ← TESTAI
│   ├── fixtures/
│   │   ├── users.fixture.ts      ← Laukiamos reikšmės (vartotojų vardai, kiekis, post body)
│   │   └── countries.fixture.ts  ← Laukiamos reikšmės (Vengrijos duomenys)
│   ├── rest/
│   │   └── users.spec.ts         ← REST spec: 6 teigiami + 2 demo
│   └── graphql/
│       └── countries.spec.ts     ← GraphQL spec: 4 teigiami + 1 demo
│
├── Dockerfile                    ← Docker image apibrėžimas
├── docker-compose.yml            ← Docker paleidimo konfigūracija
└── .github/workflows/
    └── api-tests.yml             ← CI/CD pipeline (GitHub Actions)
```

---

## 2. Ryšiai tarp failų (grandinė)

```
Spec failas (.spec.ts)
  │
  ├── importuoja → API Object (UsersApi / CountriesGraphQLApi)
  │                   │
  │                   └── paveldi → BaseApiClient
  │                                    │
  │                                    └── naudoja → auth.helper.ts (tokenai)
  │
  ├── importuoja → Fixture (users.fixture.ts / countries.fixture.ts)
  │                   └── laukiamos reikšmės palyginimui
  │
  ├── importuoja → Schema (users.schema.ts / countries.schema.ts)
  │                   └── Zod validacija — atsako struktūros tikrinimas
  │
  └── importuoja → allure.helper.ts
                      └── setTestMeta() + logResponseTime()
```

**Papildoma grandinė GraphQL spec'ams:**
```
CountriesGraphQLApi
  └── importuoja → countries.queries.ts (užklausos su gql tag)
                      └── naudoja → fragmentus (laukų sąrašo pakartotinis naudojimas)
```

---

## 3. Ką daro kiekvienas failas

| Failas | Atsakomybė | Keičiate kai... |
|--------|-----------|-----------------|
| `BaseApiClient.ts` | Bendra HTTP logika (headers, graphqlRequest) | Reikia naujo header visur |
| `UsersApi.ts` | REST endpoint metodai | Atsiranda naujas REST endpoint |
| `CountriesGraphQLApi.ts` | GraphQL užklausų kvietimai | Atsiranda nauja GraphQL užklausa |
| `countries.queries.ts` | Užklausų eilutės + fragmentai | Keičiasi užklausos struktūra |
| `auth.helper.ts` | Token valdymas | Keičiasi auth logika |
| `allure.helper.ts` | Allure metaduomenys + TestMeta | Naujas feature/epic/story |
| `users.schema.ts` | REST atsako Zod schema | Keičiasi REST atsako struktūra |
| `countries.schema.ts` | GraphQL atsako Zod schema | Keičiasi GraphQL atsako struktūra |
| `users.fixture.ts` | REST laukiamos reikšmės | Keičiasi testo duomenys |
| `countries.fixture.ts` | GraphQL laukiamos reikšmės | Keičiasi testo duomenys |
| `users.spec.ts` | REST testo atvejai | Reikia naujo REST testo |
| `countries.spec.ts` | GraphQL testo atvejai | Reikia naujo GraphQL testo |

---

## 4. Naujo testo kūrimas — žingsnis po žingsnio

### 4a. Naujas testas ESAMAM endpoint'ui

Tiesiog pridėkite naują `test()` bloką spec faile:

```typescript
// tests/rest/users.spec.ts — naujo testo pridėjimas
test('@regression shouldReturnEmptyWhenIdIsInvalid', async () => {
  await setTestMeta({ ...meta, story: 'GET /users/:id — invalid ID' });

  const response = await usersApi.getUserById(99999);

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({});
});
```

### 4b. Testas naujam REST endpoint'ui

**1. API Object išplėtimas** (`support/api-client/UsersApi.ts`):
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
  // ...esami...
  delete: 'DELETE /posts/:id — delete resource',
},
```

**3. Testas** (`tests/rest/users.spec.ts`):
```typescript
test('@regression shouldReturn200WhenPostIsDeleted', async () => {
  await setTestMeta({ ...meta, story: meta.stories.delete });
  const response = await usersApi.deletePost(1);
  expect(response.status()).toBe(200);
});
```

### 4c. Testas naujai GraphQL užklausai

**1. Užklausa** (`support/graphql/queries/countries.queries.ts`):
```typescript
export const CountryQueries = {
  // ...esami...
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

**4. Testas** (`tests/graphql/countries.spec.ts`):
```typescript
test('@smoke shouldReturnContinentsListWhenQueried', async () => {
  await setTestMeta({ ...meta, story: 'List all continents' });
  const response = await countriesApi.getContinents();
  const body = await response.json();
  expect(body.data.continents.length).toBeGreaterThan(0);
});
```

### 4d. Visiškai nauja funkcija (pvz. Posts)

1. `support/api-client/PostsApi.ts` — naujas API Object
2. `support/graphql/queries/posts.queries.ts` — jei GraphQL
3. `schemas/posts.schema.ts` — Zod schema
4. `tests/fixtures/posts.fixture.ts` — laukiamos reikšmės
5. `tests/rest/posts.spec.ts` — testai
6. `allure.helper.ts` → `TestMeta.posts` išplėtimas

---

## 5. Kasdienis darbas — darbo eiga

### Rytas

```bash
git pull                  # Naujausias kodas
npm install               # Jei pasikeitė priklausomybės (package.json diff)
npm run test:smoke        # Greitas patikrinimas — viskas veikia?
```

### Naujo testo rašymas

1. Perskaitykite bilietą / reikalavimą
2. Nuspręskite: esamas endpoint → tik spec išplėtimas, arba naujas endpoint → reikia ir API Object
3. Parašykite testą pagal aukščiau pateiktus žingsnius
4. Paleiskite: `npx playwright test -g "testoPavadinimas"`
5. Patikrinkite Allure ataskaitoje: `npm run test:allure`

### Prieš commit

```bash
npm test                  # Visi testai paleisti
npm run test:smoke        # Bent jau smoke yra žalias
```

### Allure tendencija — istorijos sekimas tarp paleidimų

Allure gali rodyti tendencijų grafikus (pass/fail santykis, trukmė, pakartojimas) tarp kelių paleidimų. Esmė — `history/` katalogą reikia išsaugoti tarp ataskaitų generavimų.

```bash
# Po testų paleidimo — statinės ataskaitos generavimas
npm test
allure generate allure-results -o allure-report --clean

# Prieš kitą paleidimą — istorijos kopijavimas atgal į rezultatus
cp -r allure-report/history allure-results/history

# Pakartotinis paleidimas + generavimas — atsiranda tendencijos
npm test
allure generate allure-results -o allure-report --clean
allure open allure-report
```

> **Svarbu:** `npm run test:allure` naudoja `allure serve` (laikina ataskaita, be istorijos). Tendencijoms visada naudokite `allure generate` + `allure open`.

CI/CD aplinkoje `allure-report/history/` katalogą reikia saugoti kaip cache arba artifact tarp pipeline paleidimų, kad tendencijų duomenys automatiškai išliktų.

### Naudingos komandos kūrimo metu

```bash
# Paleisti tik dabartinį failą
npx playwright test tests/rest/users.spec.ts

# Tik vieną testą pagal pavadinimą
npx playwright test -g "shouldReturn201"

# Debug režimas (žingsnis po žingsnio)
npx playwright test --debug
```
