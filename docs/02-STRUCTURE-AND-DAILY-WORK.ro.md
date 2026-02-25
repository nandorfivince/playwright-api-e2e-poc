# Structura și munca zilnică

## Cuprins

- [1. Structura proiectului](#1-structura-proiectului)
- [2. Relații între fișiere (lanț)](#2-relații-între-fișiere-lanț)
- [3. Ce face fiecare fișier](#3-ce-face-fiecare-fișier)
- [4. Crearea unui test nou — pas cu pas](#4-crearea-unui-test-nou--pas-cu-pas)
- [5. Munca zilnică — workflow](#5-munca-zilnică--workflow)

---

## 1. Structura proiectului

```
playwright-api-e2e-poc/
│
├── playwright.config.ts          ← Configurație centrală (proiecte, reporter, timeout)
├── package.json                  ← Dependențe și scripturi npm
├── tsconfig.json                 ← Configurare TypeScript + alias-uri de cale
│
├── support/                      ← STRATUL FRAMEWORK (nu teste, ci infrastructură)
│   ├── base/
│   │   └── BaseApiClient.ts      ← Clasă de bază — toate API Objects moștenesc din aceasta
│   ├── api-client/
│   │   ├── UsersApi.ts           ← API Object REST (JSONPlaceholder /users)
│   │   └── CountriesGraphQLApi.ts ← API Object GraphQL (Countries API)
│   ├── graphql/
│   │   └── queries/
│   │       └── countries.queries.ts ← Interogări GraphQL + fragmente (gql tag)
│   └── helpers/
│       ├── auth.helper.ts        ← Gestionare token (bazat pe env)
│       └── allure.helper.ts      ← Metadata Allure + măsurare timp de răspuns
│
├── schemas/                      ← SCHEME ZOD (validare structură răspuns)
│   ├── users.schema.ts           ← REST User/UsersList + BrokenSchema (demo)
│   └── countries.schema.ts       ← GraphQL Country/Error + BrokenSchema (demo)
│
├── tests/                        ← TESTE
│   ├── fixtures/
│   │   ├── users.fixture.ts      ← Valori așteptate (nume utilizatori, număr, corp post)
│   │   └── countries.fixture.ts  ← Valori așteptate (datele Ungariei)
│   ├── rest/
│   │   └── users.spec.ts         ← Spec REST: 6 pozitive + 2 demo
│   └── graphql/
│       └── countries.spec.ts     ← Spec GraphQL: 4 pozitive + 1 demo
│
├── Dockerfile                    ← Definiție imagine Docker
├── docker-compose.yml            ← Configurare rulare Docker
└── .github/workflows/
    └── api-tests.yml             ← Pipeline CI/CD (GitHub Actions)
```

---

## 2. Relații între fișiere (lanț)

```
Fișier Spec (.spec.ts)
  │
  ├── importă → API Object (UsersApi / CountriesGraphQLApi)
  │                │
  │                └── moștenește → BaseApiClient
  │                                    │
  │                                    └── folosește → auth.helper.ts (tokenuri)
  │
  ├── importă → Fixture (users.fixture.ts / countries.fixture.ts)
  │                └── valori așteptate pentru comparație
  │
  ├── importă → Schema (users.schema.ts / countries.schema.ts)
  │                └── Validare Zod — verificare structură răspuns
  │
  └── importă → allure.helper.ts
                   └── setTestMeta() + logResponseTime()
```

**Lanț suplimentar pentru spec GraphQL:**
```
CountriesGraphQLApi
  └── importă → countries.queries.ts (interogări cu gql tag)
                   └── folosește → fragmente (reutilizare listă de câmpuri)
```

---

## 3. Ce face fiecare fișier

| Fișier | Responsabilitate | Modifici când... |
|--------|-----------------|------------------|
| `BaseApiClient.ts` | Logică HTTP comună (headers, graphqlRequest) | Trebuie header nou peste tot |
| `UsersApi.ts` | Metode endpoint REST | Vine endpoint REST nou |
| `CountriesGraphQLApi.ts` | Apeluri query GraphQL | Vine query GraphQL nou |
| `countries.queries.ts` | String-uri query + fragmente | Se schimbă structura query-ului |
| `auth.helper.ts` | Gestionare token | Se schimbă logica de auth |
| `allure.helper.ts` | Metadata Allure + TestMeta | Feature/epic/story nou |
| `users.schema.ts` | Schemă Zod răspuns REST | Se schimbă structura răspunsului REST |
| `countries.schema.ts` | Schemă Zod răspuns GraphQL | Se schimbă structura răspunsului GraphQL |
| `users.fixture.ts` | Valori așteptate REST | Se schimbă datele de test |
| `countries.fixture.ts` | Valori așteptate GraphQL | Se schimbă datele de test |
| `users.spec.ts` | Cazuri de test REST | Trebuie test REST nou |
| `countries.spec.ts` | Cazuri de test GraphQL | Trebuie test GraphQL nou |

---

## 4. Crearea unui test nou — pas cu pas

### 4a. Test nou pentru endpoint EXISTENT

Adaugă doar un bloc `test()` nou în fișierul spec:

```typescript
// tests/rest/users.spec.ts — adăugare test nou
test('@regression shouldReturnEmptyWhenIdIsInvalid', async () => {
  await setTestMeta({ ...meta, story: 'GET /users/:id — invalid ID' });

  const response = await usersApi.getUserById(99999);

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({});
});
```

### 4b. Test pentru endpoint REST nou

**1. Extensie API Object** (`support/api-client/UsersApi.ts`):
```typescript
async deletePost(id: number) {
  return this.request.delete(`/posts/${id}`, {
    headers: this.getDefaultHeaders(),
  });
}
```

**2. Story Allure** (`support/helpers/allure.helper.ts`):
```typescript
stories: {
  // ...existente...
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

### 4c. Test pentru query GraphQL nou

**1. Query** (`support/graphql/queries/countries.queries.ts`):
```typescript
export const CountryQueries = {
  // ...existente...
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

**3. Schemă** (`schemas/countries.schema.ts`):
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

### 4d. Feature complet nou (ex. Posts)

1. `support/api-client/PostsApi.ts` — API Object nou
2. `support/graphql/queries/posts.queries.ts` — dacă e GraphQL
3. `schemas/posts.schema.ts` — schemă Zod
4. `tests/fixtures/posts.fixture.ts` — valori așteptate
5. `tests/rest/posts.spec.ts` — teste
6. `allure.helper.ts` → extensie `TestMeta.posts`

---

## 5. Munca zilnică — workflow

### Dimineață

```bash
git pull                  # Cod actualizat
npm install               # Dacă s-au schimbat dependențe (diff package.json)
npm run test:smoke        # Verificare rapidă — totul funcționează?
```

### Scrierea unui test nou

1. Citește ticket-ul / cerința
2. Decide: endpoint existent → doar extensie spec, sau endpoint nou → trebuie și API Object
3. Scrie testul conform pașilor de mai sus
4. Rulează: `npx playwright test -g "numeTest"`
5. Verifică în raportul Allure: `npm run test:allure`

### Înainte de commit

```bash
npm test                  # Toate testele rulează
npm run test:smoke        # Cel puțin smoke-ul e verde
```

### Allure trend — urmărirea istoricului între rulări

Allure poate afișa grafice de tendință (raport pass/fail, durata, reîncercări) între mai multe rulări. Cheia este păstrarea directorului `history/` între generările de rapoarte.

```bash
# După o rulare de teste — generare raport static
npm test
allure generate allure-results -o allure-report --clean

# Înainte de următoarea rulare — copierea istoricului în rezultate
cp -r allure-report/history allure-results/history

# Rulare din nou + generare — apar tendințele
npm test
allure generate allure-results -o allure-report --clean
allure open allure-report
```

> **Important:** `npm run test:allure` folosește `allure serve` (raport temporar, fără istoric). Pentru tendințe, folosiți întotdeauna `allure generate` + `allure open`.

În CI/CD, directorul `allure-report/history/` trebuie stocat în cache sau ca artifact între rulările pipeline-ului pentru a menține datele de tendință automat.

### Comenzi utile în timpul dezvoltării

```bash
# Rulează doar fișierul curent
npx playwright test tests/rest/users.spec.ts

# Doar un test după nume
npx playwright test -g "shouldReturn201"

# Mod debug (pas cu pas)
npx playwright test --debug
```
