# Biblia POC — Documentație completă de onboarding

> Acest document este destinat unui automatizator de teste începător care întâlnește pentru prima dată acest framework. Fiecare strat, fișier, configurare și tehnică de cod este explicată în detaliu.

---

## Cuprins

1. [Ce este acest proiect?](#1-ce-este-acest-proiect)
2. [De ce Playwright și nu Cypress?](#2-de-ce-playwright-și-nu-cypress)
3. [Stack-ul tehnologic](#3-stack-ul-tehnologic)
4. [Explicarea detaliată a fișierelor de configurare](#4-explicarea-detaliată-a-fișierelor-de-configurare)
5. [Modelul API Object](#5-modelul-api-object)
6. [Moștenirea (inheritance) — cum funcționează](#6-moștenirea-inheritance--cum-funcționează)
7. [Stratul support — fișier cu fișier](#7-stratul-support--fișier-cu-fișier)
8. [Gestionarea GraphQL — query-uri, fragmente, gql tag](#8-gestionarea-graphql--query-uri-fragmente-gql-tag)
9. [Validarea schemelor Zod — ce este și de ce este necesară](#9-validarea-schemelor-zod--ce-este-și-de-ce-este-necesară)
10. [Fixture-uri — centralizarea datelor de test](#10-fixture-uri--centralizarea-datelor-de-test)
11. [Fișiere spec — anatomia testelor](#11-fișiere-spec--anatomia-testelor)
12. [Raportarea Allure — metadata și măsurare](#12-raportarea-allure--metadata-și-măsurare)
13. [Sistemul de taguri — @smoke, @regression, @demo](#13-sistemul-de-taguri--smoke-regression-demo)
14. [Docker — containerizare](#14-docker--containerizare)
15. [CI/CD — execuție automată](#15-cicd--execuție-automată)
16. [Detectarea erorilor — ce va prinde acest framework](#16-detectarea-erorilor--ce-va-prinde-acest-framework)
17. [Aspecte de management al testelor](#17-aspecte-de-management-al-testelor)
18. [Fluxul complet de date — cine pe cine apelează și de ce](#18-fluxul-complet-de-date--cine-pe-cine-apelează-și-de-ce)

---

## 1. Ce este acest proiect?

Acesta este un **Proof of Concept (POC)** — o dovadă că framework-ul Playwright este potrivit pentru testarea automată a API-urilor backend. Nu scriem teste UI care rulează în browser, ci trimitem **apeluri HTTP pure** către API-uri și verificăm răspunsurile.

POC-ul folosește două API-uri publice pentru demonstrație:
- **REST:** JSONPlaceholder (`https://jsonplaceholder.typicode.com`) — date despre utilizatori
- **GraphQL:** Countries API (`https://countries.trevorblades.com/graphql`) — date despre țări

Scopul: a demonstra că această abordare este **mai rapidă, mai simplă și mai ieftină** decât testarea backend-ului bazată pe Cypress.

---

## 2. De ce Playwright și nu Cypress?

| Criteriu | Cypress | Playwright |
|----------|---------|------------|
| **Modul de apel API** | `cy.request()` — rulează în contextul browserului | `request` API — HTTP nativ, fără browser |
| **Viteză** | Se pornește browserul → lent (5-15s overhead) | HTTP direct → rapid (<1s toate testele) |
| **Execuție paralelă** | Plătit (Cypress Cloud) | Gratuit, `fullyParallel` integrat |
| **GraphQL** | Fără suport nativ | Același apel POST, gestionat nativ |
| **TypeScript** | Suport parțial | Complet, nativ |
| **Raportare** | Cypress Dashboard (plătit) | Allure (gratuit) + HTML |
| **Docker** | Este nevoie de browser în imagine (~1GB+) | Imagine minimă Node (~200MB) |
| **CI/CD** | Mai dificil (dependințe de browser) | Mai ușor (fără dependințe de browser) |

**Pe scurt:** Dacă vrem să testăm API-ul (nu UI-ul), nu are rost să pornim un browser. `request` API-ul Playwright este exact pentru asta.

---

## 3. Stack-ul tehnologic

| Tehnologie | Versiune | Rol |
|------------|----------|-----|
| **Playwright** | 1.50+ | Execuția testelor, clienți HTTP, raportare |
| **TypeScript** | 5.7+ | Cod type-safe — erorile de scriere sunt detectate la compilare |
| **Zod** | 3.24+ | Validarea structurii răspunsului la runtime |
| **graphql-request** | 7.1+ | Query-uri GraphQL cu tag `gql` — verificare de sintaxă |
| **allure-playwright** | 3.0+ | Integrare raport Allure |
| **Docker** | - | Execuție containerizată (opțional) |
| **GitHub Actions** | - | Pipeline CI/CD (opțional) |

**În total 14 pachete npm** — amprentă minimă, instalare rapidă.

---

## 4. Explicarea detaliată a fișierelor de configurare

### `package.json` — "cartea de identitate" a proiectului

```json
{
  "name": "playwright-api-e2e-poc",     // Numele proiectului
  "private": true,                       // Nu publicăm pe npm
  "scripts": {                           // Comenzi de execuție (npm run ...)
    "test": "npx playwright test",       // Toate testele
    "test:rest": "...",                  // Doar REST
    "test:smoke": "...",                 // Doar tagul @smoke
    "test:allure": "npx allure serve allure-results"  // Deschidere Allure
  },
  "dependencies": {
    "@playwright/test": "^1.50.0",       // Execuția testelor
    "allure-playwright": "^3.0.0",       // Integrare Allure
    "graphql": "^16.10.0",              // GraphQL core (necesar pentru tag-ul gql)
    "graphql-request": "^7.1.0",        // Tag-ul template gql
    "zod": "^3.24.0"                    // Validare scheme
  }
}
```

**Ce înseamnă `^` la versiune?** De exemplu `^1.50.0` = instalează 1.50.0 sau orice versiune mai nouă, dar rămâi în cadrul 1.x. Astfel primim automat corecțiile de erori fără să apară breaking change-uri mari.

### `tsconfig.json` — Configurări TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2022",              // Spre ce JS compilează (modern)
    "module": "ESNext",              // Sintaxă import/export
    "strict": true,                  // Verificare strictă a tipurilor
    "baseUrl": ".",                  // Punctul de pornire pentru alias-uri de cale
    "paths": {
      "@support/*": ["./support/*"], // import { UsersApi } from '@support/api-client/UsersApi'
      "@schemas/*": ["./schemas/*"]  // import { UserSchema } from '@schemas/users.schema'
    }
  }
}
```

**De ce sunt necesare alias-urile de cale?** Ca să nu fie nevoie să scriem astfel: `../../support/api-client/UsersApi` — în schimb `@support/api-client/UsersApi`. Mai lizibil și la mutarea fișierelor nu trebuie rescrise căile.

### `playwright.config.ts` — configurația centrală a execuției testelor

```typescript
export default defineConfig({
  testDir: './tests',          // Unde să caute fișierele de test
  fullyParallel: true,         // Toate testele rulează în paralel
  retries: process.env.CI ? 2 : 0,  // 2 reîncercări în CI, 0 local
  timeout: 30_000,             // Maximum 30s/test (dacă nu se finalizează în acest timp, este eronat)

  globalSetup: './scripts/clean-network-data.ts',  // Curățare network-data/ înainte de rulare

  reporter: [
    ['list'],                  // Ieșire în consolă (numele testelor + timp)
    ['html', { ... }],        // Raport HTML (în directorul playwright-report/)
    ['json', { ... }],        // Raport JSON (pentru generarea Full Report)
    ['allure-playwright', { ... }],  // Raport Allure (în directorul allure-results/)
  ],

  projects: [                  // Două "proiecte" = două API-uri separate
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

**Ce este un "project" în Playwright?** O unitate de configurare a suitei de teste. Fiecare proiect poate avea propriul baseURL, propriul director de teste. Când rulează `npm test`, testele ambelor proiecte se execută.

**`fullyParallel: true`** — toate testele pornesc simultan (în workeri separați). De aceea este atât de rapid: 13 teste se finalizează în ~1.4 secunde.

---

## 5. Modelul API Object

Acesta este sufletul framework-ului. Analogic cu modelul **Page Object Model (POM)** pe care îl folosim la testele E2E mobile/web:

| POM (teste UI) | API Object Model (teste API) |
|-------------------|-------------------------------|
| `BasePage.ts` + `this.driver` | `BaseApiClient.ts` + `this.request` |
| `LoginPage.ts`, `HomePage.ts` | `UsersApi.ts`, `CountriesGraphQLApi.ts` |
| Selectori (CSS, testID) | Endpoint-uri HTTP, headere |
| `loginPage.clickSubmit()` | `usersApi.getUsers()` |
| Căutare element | Trimitere cerere HTTP |

**Esențialul:** Fișierul spec (testul) NU trimite NICIODATĂ cereri HTTP directe. Fiecare apel se face prin metoda unui API Object. Astfel, dacă URL-ul unui endpoint se schimbă, se modifică **într-un singur loc** (în API Object), nu în toate testele.

---

## 6. Moștenirea (inheritance) — cum funcționează

### Ce este moștenirea?

Baza programării orientate pe obiecte (OOP). Dacă există o clasă "părinte" (`BaseApiClient`) care conține funcții comune, clasele "copil" (`UsersApi`, `CountriesGraphQLApi`) primesc automat aceste funcții fără a fi nevoie să le rescriem.

### Cum arată în cod?

```
BaseApiClient (părinte)
├── this.request          ← Client HTTP Playwright
├── getDefaultHeaders()   ← Headere comune (auth + content-type)
├── graphqlRequest()      ← Apel POST GraphQL
│
├── UsersApi (copil — REST)
│   ├── getUsers()        ← GET /users (folosește: this.request + getDefaultHeaders)
│   ├── getUserById()     ← GET /users/:id
│   ├── createPost()      ← POST /posts
│   └── getUsersWithoutAuth()  ← GET /users (fără header — pentru testul auth)
│
└── CountriesGraphQLApi (copil — GraphQL)
    ├── getCountries()    ← query { countries } (folosește: graphqlRequest)
    ├── getCountryByCode() ← query { country(code:) }
    └── sendInvalidQuery() ← query eronat (pentru testul de erori)
```

### Cum este construit în cod?

**Clasa părinte:**
```typescript
// support/base/BaseApiClient.ts
export class BaseApiClient {
  protected readonly request: APIRequestContext;  // ← "protected" = copiii o văd

  constructor(request: APIRequestContext) {       // ← constructor: la creare primește un client HTTP
    this.request = request;
  }

  protected getDefaultHeaders() { ... }          // ← metodă "protected" = copiii o pot folosi
  protected async graphqlRequest() { ... }       // ← logică GraphQL comună
}
```

**Clasa copil:**
```typescript
// support/api-client/UsersApi.ts
export class UsersApi extends BaseApiClient {     // ← "extends" = moștenește din BaseApiClient
  async getUsers() {
    return this.request.get('/users', {           // ← this.request vine de la părinte
      headers: this.getDefaultHeaders(),          // ← getDefaultHeaders() vine de la părinte
    });
  }
}
```

**Cuvinte cheie:**
- `extends` — "această clasă moștenește din cealaltă"
- `protected` — "clasele copil o văd, dar din exterior nu"
- `this` — "obiectul curent" (poate conține proprietățile părintelui și cele proprii)
- `constructor` — "acesta se execută când creezi obiectul (`new UsersApi(request)`)"

### De ce este bună moștenirea?

Dacă mâine este nevoie de un header nou la fiecare apel API (de ex. `X-Request-ID`), îl scrii **într-un singur loc**:

```typescript
// BaseApiClient.ts — O SINGURĂ modificare
protected getDefaultHeaders() {
  return {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
    'X-Request-ID': crypto.randomUUID(),  // ← LINIE NOUĂ
  };
}
```

Automat fiecare copil (`UsersApi`, `CountriesGraphQLApi`) o primește. Nu trebuie modificat în 10 fișiere.

---

## 7. Stratul support — fișier cu fișier

### `support/base/BaseApiClient.ts`

**Ce este?** Strămoșul tuturor API Object-elor. Conține logica HTTP comună.

**Conținut:**
- `this.request` — Playwright `APIRequestContext`, acesta este clientul HTTP pe care îl folosim pentru fiecare apel
- `getDefaultHeaders()` — asamblează headerele (token auth + Content-Type)
- `graphqlRequest(query, variables)` — apel POST GraphQL într-o singură metodă centrală

**Cine o folosește?** `UsersApi` și `CountriesGraphQLApi` — ambele moștenesc din aceasta.

### `support/api-client/UsersApi.ts`

**Ce este?** REST API Object pentru endpoint-urile JSONPlaceholder `/users` și `/posts`.

**Metode:**
| Metodă | Apel HTTP | Ce testează |
|---------|-----------|---------------|
| `getUsers()` | `GET /users` | Obținerea tuturor utilizatorilor |
| `getUserById(id)` | `GET /users/:id` | Obținerea unui utilizator |
| `createPost(data)` | `POST /posts` | Crearea unei resurse noi (test CRUD) |
| `getUsersWithoutAuth()` | `GET /users` (fără header) | Testarea lipsei autentificării |

**Cine o apelează?** `tests/rest/users.spec.ts`

### `support/api-client/CountriesGraphQLApi.ts`

**Ce este?** GraphQL API Object pentru Countries API.

**Metode:**
| Metodă | Query GraphQL | Ce testează |
|---------|--------------|---------------|
| `getCountries()` | `ListCountries` | Obținerea tuturor țărilor |
| `getCountryByCode(code)` | `GetCountry($code)` | O țară după cod |
| `sendInvalidQuery()` | Sintaxă eronată | Gestionarea erorilor |

**Important:** Această clasă NU conține stringurile query! Acestea sunt importate din `countries.queries.ts`. Aceasta este separarea responsabilităților (separation of concerns).

**Cine o apelează?** `tests/graphql/countries.spec.ts`

### `support/helpers/auth.helper.ts`

**Ce este?** Gestionarea token-urilor — singurul loc unde trăiește logica de autentificare.

**Funcții:**
- `getTestToken()` — returnează token-ul JWT (din variabila de mediu sau gol)
- `getAuthHeaders()` — returnează obiectul `{ Authorization: 'Bearer ...' }`
- `isLocalEnvironment()` — rulăm în CI sau local?

**Cine o apelează?** `BaseApiClient.getDefaultHeaders()` — deci indirect fiecare API Object.

### `support/helpers/allure.helper.ts`

**Ce este?** Face două lucruri:
1. **Obiectul TestMeta** — toate metadatele Allure (epic/feature/story/severity) într-un loc central
2. **Funcții helper** — `setTestMeta()` și `logResponseTime()`

**Cine o apelează?** Fiecare fișier spec, la începutul fiecărui test.

### `support/fixtures/base.fixture.ts`

**Ce este?** Un fixture Playwright personalizat care oferă `trackedRequest` — un `APIRequestContext` înfășurat cu Proxy care urmărește automat fiecare apel API (timing, detalii request/response) fără niciun cod suplimentar în teste.

**Cum funcționează?**
- Înfășoară `request`-ul integrat Playwright cu un `Proxy` JavaScript
- Interceptează fiecare apel de metodă HTTP (GET, POST, PUT, DELETE, etc.)
- Măsoară automat timpul de răspuns
- Atașează detaliile request/response la raportul Allure
- Salvează datele apelurilor network în directorul `network-data/` pentru generarea rapoartelor

**Cine o folosește?** Fiecare fișier spec importă `test` și `expect` din acest fișier în loc de `@playwright/test`.

**Impactul asupra testelor:** Testele nu mai au nevoie de cronometrare manuală cu `Date.now()` sau apeluri `attachApiDetails()` — fixture-ul gestionează totul transparent. Testele sunt mai curate, conținând doar logica de business.

### `support/helpers/network-collector.ts`

**Ce este?** O utilitate care salvează datele apelurilor API (URL request, metodă, headere, body, status răspuns, body răspuns, durată) ca fișiere JSON individuale în directorul `network-data/`.

**De ce fișiere individuale?** Playwright rulează testele în paralel pe mai mulți workeri. Un array în memorie ar captura doar apelurile unui singur worker. Colectarea bazată pe fișiere funcționează pe toți workerii.

**Cine o apelează?** `allure.helper.ts` → `attachApiDetails()` → `saveNetworkCall()`. Aceasta se întâmplă automat prin fixture-ul `trackedRequest`.

**Cine citește datele?** Generatoarele de rapoarte post-test (`generate-network-report.ts` și `generate-full-report.ts`) citesc toate fișierele JSON din `network-data/` pentru a construi rapoartele HTML.

---

## 8. Gestionarea GraphQL — query-uri, fragmente, gql tag

### Ce este tag-ul `gql`?

Parte a pachetului `graphql-request`. Un "tagged template literal" — o sintaxă JavaScript specială care procesează string-ul query:

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

**Ce oferă?**
- Evidențierea sintaxei în IDE (codul query-ului va fi colorat)
- Validare de bază a sintaxei
- Conectarea fragmentelor (cu sintaxa `${FRAGMENT}`)

### Ce este un Fragment?

O **listă reutilizabilă de câmpuri**. Dacă mai multe query-uri solicită aceleași câmpuri, nu vrei să le repeți peste tot:

```typescript
// FĂRĂ — repetare:
const query1 = gql`{ countries { code name capital currency } }`;
const query2 = gql`{ country(code: "HU") { code name capital currency } }`;
//                                          ^^^^^^^^^^^^^^^^^^^^^^^^^ se repetă!

// CU — reutilizare:
const FIELDS = gql`fragment CountryCoreFields on Country { code name capital currency }`;
const query1 = gql`{ countries { ...CountryCoreFields } } ${FIELDS}`;
const query2 = gql`{ country(code: "HU") { ...CountryCoreFields } } ${FIELDS}`;
```

Dacă mâine este nevoie de un câmp nou (de ex. `emoji`), îl adaugi **într-un singur loc** în fragment.

### De ce într-un fișier separat (`countries.queries.ts`)?

**Regulă: string-ul query NU se pune NICIODATĂ în fișierul spec.**

Motive:
1. **Mentenabilitate** — dacă query-ul se schimbă, modifici într-un singur fișier, nu în 5 teste
2. **Lizibilitate** — fișierul spec conține doar logica testului
3. **Reutilizabilitate** — mai multe teste pot folosi același query
4. **Autocomplete** — `CountryQueries.` → IDE-ul listează query-urile disponibile

---

## 9. Validarea schemelor Zod — ce este și de ce este necesară

### Ce este Zod?

O bibliotecă TypeScript care verifică **la runtime** dacă o dată corespunde unei anumite structuri.

### De ce este necesară?

TypeScript verifică doar **la compilare**. Dacă structura răspunsului API se schimbă (redenumire câmp, schimbare tip), TypeScript nu semnalează — deoarece răspunsul vine doar la runtime.

**Fără Zod:**
```typescript
const user = await response.json();
// TypeScript nu știe ce structură are "user"
// Dacă backend-ul a redenumit "name" în "fullName", nimic nu semnalează
expect(user.name).toBe('Leanne Graham');  // undefined — eșuează silențios
```

**Cu Zod:**
```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

UserSchema.parse(user);
// Dacă "name" lipsește: ZodError: Required at "name"
// Dacă "id" e string: ZodError: Expected number, received string at "id"
// Dacă "email" nu e email: ZodError: Invalid email at "email"
```

**O singură linie de cod** prinde toate schimbările de structură. Mesajul de eroare spune exact **ce câmp** și **care este problema**.

### Cum o folosim?

```typescript
// schemas/users.schema.ts — definim structura așteptată
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

// users.spec.ts — validăm cu o singură aserțiune
expect(() => UsersListSchema.parse(users)).not.toThrow();
```

### BrokenSchema — secretul testelor demo

`UserBrokenSchema` și `CountryBrokenSchema` sunt scheme **intenționat greșite**:

```typescript
// Aceasta NU va reuși NICIODATĂ — deoarece "fullName" și "department" nu există în API
export const UserBrokenSchema = z.object({
  id: z.number(),
  fullName: z.string(),     // ← API-ul trimite "name", nu "fullName"
  department: z.string(),   // ← un astfel de câmp nu există
});
```

Cu aceasta demonstrăm: dacă un dezvoltator redenumește un câmp, Zod **îl prinde imediat** și în raportul Allure se vede clar care este eroarea.

---

## 10. Fixture-uri — centralizarea datelor de test

### Ce este un Fixture?

Un **depozit central de date** în care se găsesc valorile așteptate. Testul nu conține stringuri hardcodate — totul vine de aici.

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

### De ce nu le scrii direct în test?

```typescript
// GREȘIT — hardcodat în test:
expect(users).toHaveLength(10);
expect(user.name).toBe('Leanne Graham');

// CORECT — din fixture:
expect(users).toHaveLength(UserFixtures.totalCount);
expect(user.name).toBe(UserFixtures.firstUser.name);
```

**Motive:**
1. Dacă datele se schimbă, modifici **într-un singur loc** (nu în 5 teste)
2. **Autocomplete** — `UserFixtures.` → IDE-ul listează datele disponibile
3. **Protecție contra greșelilor de scriere** — TypeScript aruncă eroare dacă apelezi o proprietate inexistentă
4. La fel ca selectorii la testele mobile — dacă selectorul se schimbă, îl modifici în Page Object, nu în test

---

## 11. Fișiere spec — anatomia testelor

### Structura unui test

```typescript
test('@smoke shouldReturn200WithUsersListWhenCalled', async () => {
  // 1. ARRANGE — Configurarea metadatelor Allure
  await setTestMeta({ ...meta, story: meta.stories.list });

  // 2. ACT — Execuția apelului API
  const start = Date.now();
  const response = await usersApi.getUsers();
  await logResponseTime(start);

  // 3. ASSERT — Verificarea rezultatului
  const users = await response.json();
  expect(response.status()).toBe(200);
  expect(users).toHaveLength(UserFixtures.totalCount);
});
```

**Modelul AAA (Arrange-Act-Assert):**
- **Arrange** — pregătire (metadata, date de test)
- **Act** — acțiunea (apelul API)
- **Assert** — verificare (status code, body, schemă)

### Convenția de denumire a testelor

`should<Așteptare>When<Condiție>`

Exemple:
- `shouldReturn200WithUsersListWhenCalled` — trebuie să returneze 200 cu lista de utilizatori când este apelat
- `shouldReturnHungaryDetailsWhenCodeIsHU` — trebuie să returneze detaliile Ungariei când codul este HU
- `shouldDetectSchemaMismatchWhenFieldRenamed` — trebuie să detecteze neconcordanța schemei când un câmp este redenumit

### `test.describe()` și `test.beforeEach()`

```typescript
test.describe('REST — GET /users', () => {        // Grup logic
  let usersApi: UsersApi;                          // Declarare variabilă

  test.beforeEach(async ({ trackedRequest }) => {  // trackedRequest din base.fixture.ts
    usersApi = new UsersApi(trackedRequest);       // Apelurile API sunt urmărite automat
  });

  test('...', async () => { ... });                // Testul 1
  test('...', async () => { ... });                // Testul 2
});
```

**`test.beforeEach`** — rulează înainte de fiecare test. Asigură că fiecare test pornește dintr-o stare curată (nu există state partajat între teste).

**`{ trackedRequest }`** — Oferit de `base.fixture.ts`. Înfășoară `APIRequestContext`-ul Playwright cu un Proxy care măsoară automat timpul și atașează detaliile request/response la rapoarte. Testele îl folosesc exact ca `request`-ul standard — nu sunt necesare modificări de API.

---

## 12. Raportarea Allure — metadata și măsurare

### Ierarhia Allure

În raportul Allure testele apar ierarhic:

```
Epic (nivelul cel mai înalt)
└── Feature (funcționalitate)
    └── Story (user story concret)
        └── Test (un caz de test)
```

De exemplu:
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

### Cum se adaugă metadatele?

```typescript
// allure.helper.ts — obiectul central de metadata
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

// fișierul spec — un singur apel
await setTestMeta({ ...meta, story: meta.stories.list });
```

**De ce este centralizat?** Ca să nu fie nevoie să scrii manual numele epic/feature în fiecare test. Dacă se redenumește feature-ul, modifici într-un singur loc.

### Măsurarea timpului de răspuns

```typescript
const start = Date.now();                    // Pornirea cronometrului
const response = await usersApi.getUsers();  // Apelul API
const duration = await logResponseTime(start); // Înregistrarea timpului în Allure

// Opțional: test de prag
expect(duration).toBeLessThan(2000);  // Maximum 2 secunde
```

În raportul Allure acesta apare ca **parametru** la fiecare test:
```
Parameters:
  Response time (ms) → 64
```

### Grafice de tendință — urmărirea modificărilor între rulări

Allure are suport integrat pentru **grafice de tendință** care arată cum se schimbă rezultatele testelor în timp:
- **History Trend** — raportul pass/fail/broken pe rulări
- **Duration Trend** — cum se schimbă timpul de execuție
- **Categories Trend** — tipuri de erori în timp
- **Retry Trend** — pattern-uri de teste flaky

**Cum funcționează tehnic?**

Când `allure generate` creează raportul, scrie un director `history/` în interiorul `allure-report/`:

```
allure-report/
  └── history/
       ├── history.json           ← date pass/fail per test
       ├── history-trend.json     ← date de tendință agregate
       ├── duration-trend.json    ← tendință timp de execuție
       ├── categories-trend.json  ← tendință categorii de erori
       └── retry-trend.json       ← tendință reîncercări
```

Pentru ca **următoarea** rulare să arate tendința, acest director `history/` trebuie să fie prezent în `allure-results/` **înainte de** generare:

```bash
# Pasul 1: Rulare teste + generare raport (prima rulare — fără tendință încă)
npm test
allure generate allure-results -o allure-report --clean

# Pasul 2: Înainte de următoarea rulare — copierea istoricului înapoi
cp -r allure-report/history allure-results/history

# Pasul 3: Rulare teste din nou
npm test

# Pasul 4: Generare raport — graficele de tendință apar acum!
allure generate allure-results -o allure-report --clean
allure open allure-report
```

**De ce `allure serve` nu arată tendințe?** Pentru că `allure serve` generează raportul într-un director temporar și îl șterge la închidere. Nu păstrează niciodată istoricul.

**În CI/CD:** Directorul `allure-report/history/` trebuie stocat în cache (de ex. GitHub Actions artifact sau cache action) între rulările pipeline-ului. Astfel, tendințele se construiesc automat cu fiecare execuție a pipeline-ului.

```yaml
# Exemplu abordare GitHub Actions:
# 1. Descărcare allure-report/history/ anterior din artifacts
# 2. Copiere în allure-results/history/
# 3. Rulare teste
# 4. allure generate
# 5. Upload allure-report/ ca artifact (include noul history/)
```

**Ce vede Test Managerul?** După 3-5 rulări cu istoricul păstrat, dashboard-ul Allure afișează grafice liniare care arată stabilitatea, modificările de viteză și pattern-urile de regresie în timp — esențiale pentru sprint review-uri și raportarea calității.

### Network Report și Full Report — raportare suplimentară

Dincolo de Allure, framework-ul generează automat două rapoarte HTML suplimentare după fiecare rulare de teste:

**Network Report** (`playwright-report/network-report.html`)
- Interfață stil Chrome DevTools Network tab (temă întunecată)
- Fiecare apel API listat cu: status code, metodă, URL, timestamp, durată
- Click pe orice apel → tab-uri Request/Response — tabel headere, JSON body cu buton Copy
- Filtrare după status (All / 2xx / 4xx / 5xx) și căutare text
- Util pentru: copierea datelor request/response în OpenSearch, partajarea detaliilor API cu dezvoltatorii backend

**Full Report** (`playwright-report/full-report.html`)
- Rezultate teste combinate + date network într-o singură vizualizare
- Panel stâng: listă teste cu iconițe pass/fail, durată, fișier:linie, taguri
- Panel drept per test: detalii erori (cu fragment cod sursă pentru eșecuri), apeluri network (colapsabile, cu tab-uri request/response)
- Similar cu Cypress Cloud Test Replay — dar gratuit, offline, HTML autonom

**Comenzi:**
```bash
npm run test:network      # Deschidere Network Report în browser
npm run test:full-report  # Deschidere Full Report în browser
npm run report:network    # Doar generare Network Report
npm run report:full       # Doar generare Full Report
```

> **Notă:** Toate comenzile `npm test` / `npm run test:*` generează automat ambele rapoarte după rularea testelor. Comenzile separate `report:*` sunt pentru regenerare fără rerularea testelor.

---

## 13. Sistemul de taguri — @smoke, @regression, @demo

Tag-ul se află în numele testului (Playwright `--grep` filtrează):

```typescript
test('@smoke shouldReturn200WithUsersListWhenCalled', ...);     // Tag Smoke
test('@regression shouldReturn201WhenPostIsCreated', ...);      // Tag Regression
test('@demo shouldDetectSchemaMismatchWhenFieldRenamed', ...);  // Tag Demo
```

| Tag | Scop | Când rulezi? | Așteptare |
|-----|------|-------------|-----------|
| `@smoke` | Happy-path rapid | La fiecare push, dimineața, după deploy | Toate verzi |
| `@regression` | Acoperire completă | Zilnic, per PR | Toate verzi |
| `@demo` | Demonstrație erori | La ocazii de demo | Toate ROȘII (intenționat) |

Execuție: `npm run test:smoke`, `npm run test:regression`, `npm run test:demo`

---

## 14. Docker — containerizare

### Ce este Docker și de ce este necesar?

Docker este o tehnologie de "containere": împachetează aplicația ta (și toate dependințele) într-o cutie care **rulează la fel oriunde**. Nu mai există problema "la mine funcționează, la tine nu".

### `Dockerfile` — rețeta imaginii

```dockerfile
FROM node:20-slim           # Bază: imagine minimă Node.js 20
WORKDIR /app                # Directorul de lucru în container
COPY package.json ./        # Mai întâi doar package.json (optimizare cache)
RUN npm ci                  # Instalarea dependințelor
COPY . .                    # Apoi întregul cod sursă
CMD ["npx", "playwright", "test"]  # Comanda implicită: execuția testelor
```

### `docker-compose.yml` — execuție simplificată

```yaml
services:
  api-tests:
    build: .                # Construiește imaginea din Dockerfile
    environment:            # Variabile de mediu
      - BASE_URL_REST=...
      - BASE_URL_GRAPHQL=...
    volumes:                # Rezultatele ies din container pe host
      - ./allure-results:/app/allure-results
```

`volumes` este esențial: directoarele allure-results și playwright-report vor fi accesibile și pe mașina host după execuție.

---

## 15. CI/CD — execuție automată

### Ce este CI/CD?

- **CI (Continuous Integration)** — la fiecare modificare de cod testele rulează automat
- **CD (Continuous Delivery)** — livrare automată (deploy)

### Workflow GitHub Actions

Pipeline-ul are două job-uri: `test-and-deploy` (rularea testelor + generarea tuturor rapoartelor) și `deploy` (publicare pe GitHub Pages).

```yaml
on:
  push:                        # Fiecare push declanșează pipeline-ul
  pull_request:                # Fiecare PR de asemenea
  workflow_dispatch:           # Declanșare manuală din interfața GitHub

permissions:
  pages: write                 # Necesar pentru deploy pe GitHub Pages
  id-token: write              # Token OIDC pentru Pages

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - checkout               # Descărcarea codului
      - setup-node             # Instalarea Node.js 20
      - npm ci                 # Instalarea dependințelor
      - install allure CLI     # Pentru generarea HTML Allure
      - npm test               # Toate testele + generare Network/Full rapoarte
      - allure generate        # Generare HTML Allure în playwright-report/allure/
      - upload-artifact        # Arhivarea tuturor rapoartelor (30 zile)
      - upload-pages-artifact  # Pregătire pentru deploy Pages
      - print report URLs      # 4 linkuri clickabile în consolă

  deploy:
    needs: test-and-deploy
    steps:
      - deploy-pages           # Publicare pe GitHub Pages
      - print report URLs      # 4 linkuri clickabile în consolă
```

**Rezultat:** Fiecare push rulează toate testele și publică cele 4 rapoarte pe GitHub Pages. În consolă apar URL-uri clickabile:

```
Reports available at:
  Playwright HTML  → https://nandorfivince.github.io/playwright-api-e2e-poc/
  Allure Report    → https://nandorfivince.github.io/playwright-api-e2e-poc/allure/index.html
  Network Report   → https://nandorfivince.github.io/playwright-api-e2e-poc/network-report.html
  Full Report      → https://nandorfivince.github.io/playwright-api-e2e-poc/full-report.html
```

Nu trebuie descărcat nimic — click și vizualizare în browser, exact ca linkurile Cypress Cloud.

---

## 16. Detectarea erorilor — ce va prinde acest framework

| # | Tip de eroare | Cum o detectăm | Exemplu |
|---|---------------|----------------|---------|
| 1 | Redenumire câmp | Validare schemă Zod | `name` → `fullName` → ZodError |
| 2 | Dispariție câmp | Validare schemă Zod | `population` lipsește → ZodError |
| 3 | Eroare query GraphQL | Verificare `body.errors` | Schema backend-ului s-a schimbat |
| 4 | Eroare de sintaxă GraphQL | Validare răspuns de eroare | Gestionarea query-ului eronat |
| 5 | Endpoint dispărut | Assert pe codul de stare HTTP | 404 în loc de 200 |
| 6 | Schimbare format răspuns | Verificare tip Zod | Obiect în loc de array |
| 7 | Defect autentificare | Test header | 401 unde ar trebui 200 |
| 8 | Defect CRUD | Status POST/PUT/DELETE | 500 în loc de 201 |
| 9 | Regresie date | Comparare fixture | null în loc de "Budapest" |
| 10 | Degradare timp de răspuns | Prag timp de răspuns | 5000ms în loc de 200ms |
| +1 | Content-type | Assert header | text/html în loc de JSON |

---

## 17. Aspecte de management al testelor

### Ce vede Test Managerul în raportul Allure?

1. **Dashboard** — raport sumar pass/fail, grafic de tendință
2. **Suites** — teste grupate (REST / GraphQL)
3. **Behaviors** — ierarhie Epic → Feature → Story
4. **Timeline** — execuție paralelă vizualizată (cât de rapid)
5. **Categories** — tipuri de erori (Product defect, Test defect)
6. **Retries** — identificarea testelor flaky
7. **Duration** — care test este cel mai lent
8. **Full Report** — pass/fail combinat + detalii erori + apeluri network per test — ideal pentru depanare rapidă fără comutare între instrumente

### Trasabilitate (Traceability)

În raportul Allure fiecare test conține:
- **Epic** — care zonă funcțională mare
- **Feature** — care endpoint API
- **Story** — exact ce comportament
- **Severity** — critical / normal
- **Parameters** — Response time

Ulterior poate fi extins cu linkuri către issue tracker:
```typescript
await allure.link('https://jira.example.com/browse/PROJ-123', 'PROJ-123', 'issue');
```

### Cost

**$0** — toate componentele sunt gratuite și open source:
- Playwright (licență MIT)
- Allure (Apache 2.0)
- Zod (MIT)
- GitHub Actions (gratuit pentru repo-uri publice)

---

## 18. Fluxul complet de date — cine pe cine apelează și de ce

```
┌────────────────────────────────────────────────────────────────┐
│  playwright.config.ts                                          │
│  "Unde sunt testele? Spre ce URL merg? Ce raportează?"         │
│  Configurează: testDir, baseURL, reporter, parallel, retry     │
└────────────────────┬───────────────────────────────────────────┘
                     │ pornește
                     ▼
┌────────────────────────────────────────────────────────────────┐
│  users.spec.ts / countries.spec.ts                             │
│  "Care este scenariul de test?"                                │
│  Conține: describe, beforeEach, blocuri test (AAA)             │
│                                                                │
│  Importă:                                                      │
│  ┌─────────────────┐  ┌───────────────┐  ┌──────────────────┐ │
│  │ API Object      │  │ Fixture       │  │ Schema           │ │
│  │ (ce apelez?)    │  │ (ce aștept?)  │  │ (cum să fie?)    │ │
│  └────────┬────────┘  └───────────────┘  └──────────────────┘ │
│           │  + allure.helper.ts (metadata + timing)            │
└───────────┼────────────────────────────────────────────────────┘
            │ apelează
            ▼
┌────────────────────────────────────────────────────────────────┐
│  UsersApi.ts / CountriesGraphQLApi.ts                          │
│  "Cum trebuie apelat API-ul?"                                  │
│  Conține: metode (getUsers, getCountryByCode, etc.)            │
│                                                                │
│  Moștenește: din BaseApiClient                                 │
│  ┌──────────────────────────────────┐                          │
│  │ BaseApiClient.ts                 │                          │
│  │ this.request (client HTTP)       │                          │
│  │ getDefaultHeaders()              │──→ auth.helper.ts (token)│
│  │ graphqlRequest()                 │                          │
│  └──────────────────────────────────┘                          │
│                                                                │
│  GraphQL API Object extra:                                     │
│  └── importă: countries.queries.ts                             │
│                └── stringuri query + fragmente                  │
└────────────────────────────────────────────────────────────────┘
            │ trimite cerere HTTP
            ▼
┌────────────────────────────────────────────────────────────────┐
│  API extern (JSONPlaceholder / Countries API)                  │
│  Răspunde: JSON body + status code + headere                   │
└────────────────────────────────────────────────────────────────┘
            │ răspunsul se întoarce
            ▼
┌────────────────────────────────────────────────────────────────┐
│  Fișierul spec — partea ASSERT                                 │
│  Verificări:                                                   │
│  1. Status code    → expect(response.status()).toBe(200)       │
│  2. Valori body    → expect(user.name).toBe(Fixture.name)     │
│  3. Schemă         → expect(() => Schema.parse(body)).not...   │
│  4. Timp           → expect(duration).toBeLessThan(2000)       │
│  5. Headere        → expect(contentType).toContain('json')     │
└────────────────────────────────────────────────────────────────┘
            │ rezultat
            ▼
┌────────────────────────────────────────────────────────────────┐
│  Reporteri (definiți în playwright.config.ts)                   │
│  ├── list         → ieșire consolă (✓ / ✘ + timp)              │
│  ├── html         → playwright-report/ (fișiere HTML)           │
│  ├── json         → playwright-report/test-results.json        │
│  └── allure       → allure-results/ (fișiere JSON)              │
│                      └── allure serve → dashboard în browser    │
│                                                                │
│  Generatoare rapoarte post-test (rulează după teste):          │
│  ├── network-report → playwright-report/network-report.html    │
│  └── full-report    → playwright-report/full-report.html       │
└────────────────────────────────────────────────────────────────┘
```

---

> **Felicitări!** Dacă ai ajuns până aici, înțelegi deja tot ce este necesar pentru acest framework. Următorul pas: scrie primul tău test pe baza documentului [Structura și munca zilnică](./02-STRUCTURE-AND-DAILY-WORK.ro.md).
