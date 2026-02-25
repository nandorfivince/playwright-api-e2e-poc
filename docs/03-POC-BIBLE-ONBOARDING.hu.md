# POC Biblia — Teljes onboarding dokumentáció

> Ez a dokumentum egy kezdő teszt automatizáló számára készült, aki először találkozik ezzel a keretrendszerrel. Minden réteg, fájl, konfiguráció és kód technika részletesen el van magyarázva.

---

## Tartalomjegyzék

1. [Mi ez a projekt?](#1-mi-ez-a-projekt)
2. [Miért Playwright és nem Cypress?](#2-miért-playwright-és-nem-cypress)
3. [A technológiai stack](#3-a-technológiai-stack)
4. [Konfigurációs fájlok részletes magyarázata](#4-konfigurációs-fájlok-részletes-magyarázata)
5. [Az API Object Model minta](#5-az-api-object-model-minta)
6. [Öröklés (inheritance) — hogyan működik](#6-öröklés-inheritance--hogyan-működik)
7. [A support réteg — fájlról fájlra](#7-a-support-réteg--fájlról-fájlra)
8. [GraphQL kezelés — query-k, fragment-ek, gql tag](#8-graphql-kezelés--query-k-fragment-ek-gql-tag)
9. [Zod séma validáció — mi ez és miért kell](#9-zod-séma-validáció--mi-ez-és-miért-kell)
10. [Fixture-ök — teszt adatok központosítása](#10-fixture-ök--teszt-adatok-központosítása)
11. [Spec fájlok — a tesztek anatómiája](#11-spec-fájlok--a-tesztek-anatómiája)
12. [Allure riportolás — metadata és mérés](#12-allure-riportolás--metadata-és-mérés)
13. [Tag rendszer — @smoke, @regression, @demo](#13-tag-rendszer--smoke-regression-demo)
14. [Docker — konténerizálás](#14-docker--konténerizálás)
15. [CI/CD — automatikus futtatás](#15-cicd--automatikus-futtatás)
16. [Hibadetektálás — mit fog ez a framework](#16-hibadetektálás--mit-fog-ez-a-framework)
17. [Teszt management szempontok](#17-teszt-management-szempontok)
18. [Teljes adatfolyam — ki kit hív és miért](#18-teljes-adatfolyam--ki-kit-hív-és-miért)

---

## 1. Mi ez a projekt?

Ez egy **Proof of Concept (POC)** — egy bizonyíték arra, hogy a Playwright keretrendszer alkalmas backend API-k automatizált tesztelésére. Nem böngészőben futó UI teszteket írunk, hanem **tisztán HTTP hívásokat** küldünk API-knak és ellenőrizzük a válaszokat.

A POC két nyilvános API-t használ demonstrációra:
- **REST:** JSONPlaceholder (`https://jsonplaceholder.typicode.com`) — felhasználó adatok
- **GraphQL:** Countries API (`https://countries.trevorblades.com/graphql`) — ország adatok

A cél: bemutatni, hogy ez a megközelítés **gyorsabb, egyszerűbb és olcsóbb** mint a Cypress-alapú backend tesztelés.

---

## 2. Miért Playwright és nem Cypress?

| Szempont | Cypress | Playwright |
|----------|---------|------------|
| **API hívás módja** | `cy.request()` — böngésző kontextusban fut | `request` API — natív HTTP, nincs böngésző |
| **Sebesség** | Böngésző indul → lassú (5-15mp overhead) | Közvetlen HTTP → gyors (<1mp az összes teszt) |
| **Párhuzamos futtatás** | Fizetős (Cypress Cloud) | Ingyenes, beépített `fullyParallel` |
| **GraphQL** | Nincs natív támogatás | Ugyanúgy POST hívás, natívan kezeli |
| **TypeScript** | Részleges támogatás | Teljes, natív |
| **Riportolás** | Cypress Dashboard (fizetős) | Allure (ingyenes) + HTML |
| **Docker** | Böngésző kell az image-be (~1GB+) | Minimális Node image (~200MB) |
| **CI/CD** | Nehezebb (böngésző függőségek) | Könnyebb (nincs böngésző dep) |

**Összefoglalva:** Ha az API-t akarjuk tesztelni (nem a UI-t), felesleges böngészőt indítani. A Playwright `request` API pont erre való.

---

## 3. A technológiai stack

| Technológia | Verzió | Szerepe |
|------------|--------|--------|
| **Playwright** | 1.50+ | Teszt futtatás, HTTP kliensek, riportolás |
| **TypeScript** | 5.7+ | Típusbiztos kód — elírások fordítási időben kiderülnek |
| **Zod** | 3.24+ | Response struktúra validáció futási időben |
| **graphql-request** | 7.1+ | GraphQL query-k `gql` tag-gel — szintaxis ellenőrzés |
| **allure-playwright** | 3.0+ | Allure riport integráció |
| **Docker** | - | Konténerizált futtatás (opcionális) |
| **GitHub Actions** | - | CI/CD pipeline (opcionális) |

**Összesen 14 npm package** — minimális footprint, gyors telepítés.

---

## 4. Konfigurációs fájlok részletes magyarázata

### `package.json` — a projekt "személyi igazolványa"

```json
{
  "name": "playwright-api-e2e-poc",     // Projekt neve
  "private": true,                       // Nem publikáljuk npm-re
  "scripts": {                           // Futtatási parancsok (npm run ...)
    "test": "npx playwright test",       // Összes teszt
    "test:rest": "...",                  // Csak REST
    "test:smoke": "...",                 // Csak @smoke tag
    "test:allure": "npx allure serve allure-results"  // Allure megnyitás
  },
  "dependencies": {
    "@playwright/test": "^1.50.0",       // Teszt futtatás
    "allure-playwright": "^3.0.0",       // Allure integráció
    "graphql": "^16.10.0",              // GraphQL core (gql tag-hez kell)
    "graphql-request": "^7.1.0",        // gql template tag
    "zod": "^3.24.0"                    // Séma validáció
  }
}
```

**Mit jelent a `^` a verziónál?** Például `^1.50.0` = telepítsd az 1.50.0-t vagy bármelyik újabbat, de maradj az 1.x-en belül. Így automatikusan kapjuk a hibajavításokat anélkül, hogy nagy breaking change-ek jönnének.

### `tsconfig.json` — TypeScript beállítások

```json
{
  "compilerOptions": {
    "target": "ES2022",              // Milyen JS-re fordít (modern)
    "module": "ESNext",              // Import/export szintaxis
    "strict": true,                  // Szigorú típusellenőrzés
    "baseUrl": ".",                  // Path alias-ok kiindulópontja
    "paths": {
      "@support/*": ["./support/*"], // import { UsersApi } from '@support/api-client/UsersApi'
      "@schemas/*": ["./schemas/*"]  // import { UserSchema } from '@schemas/users.schema'
    }
  }
}
```

**Miért kellenek path alias-ok?** Hogy ne kelljen ilyeneket írni: `../../support/api-client/UsersApi` — ehelyett `@support/api-client/UsersApi`. Olvashatóbb és a fájl mozgatásakor nem kell átírni az útvonalakat.

### `playwright.config.ts` — a teszt futtatás központi konfigja

```typescript
export default defineConfig({
  testDir: './tests',          // Hol keresse a teszt fájlokat
  fullyParallel: true,         // Minden teszt párhuzamosan fut
  retries: process.env.CI ? 2 : 0,  // CI-ben 2 retry, lokálban 0
  timeout: 30_000,             // Maximum 30mp/teszt (ha ennyi idő alatt sem fut le, hibás)

  reporter: [
    ['list'],                  // Konzol kimenet (teszt nevek + idő)
    ['html', { ... }],        // HTML riport (playwright-report/ mappába)
    ['allure-playwright', { ... }],  // Allure riport (allure-results/ mappába)
  ],

  projects: [                  // Két "projekt" = két külön API
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

**Mi az a "project" Playwright-ban?** Egy teszt suite konfigurációs egysége. Minden projektnek lehet saját baseURL-je, saját teszt mappája. Amikor `npm test` fut, mindkét projekt tesztjei lefutnak.

**`fullyParallel: true`** — minden teszt egyszerre indul el (külön worker-ben). Ezért olyan gyors: 13 teszt ~1.4 másodperc alatt fut le.

---

## 5. Az API Object Model minta

Ez a keretrendszer lelke. Analóg a **Page Object Model (POM)** mintával amit a mobil/web E2E teszteknél használunk:

| POM (UI tesztek) | API Object Model (API tesztek) |
|-------------------|-------------------------------|
| `BasePage.ts` + `this.driver` | `BaseApiClient.ts` + `this.request` |
| `LoginPage.ts`, `HomePage.ts` | `UsersApi.ts`, `CountriesGraphQLApi.ts` |
| Selektorok (CSS, testID) | HTTP endpointok, headerek |
| `loginPage.clickSubmit()` | `usersApi.getUsers()` |
| Elem keresés | HTTP kérés küldés |

**A lényeg:** A spec fájl (teszt) SOHA nem küld közvetlen HTTP kérést. Mindig egy API Object metódusán keresztül történik minden hívás. Így ha egy endpoint URL változik, **egy helyen** kell módosítani (az API Object-ben), nem az összes tesztben.

---

## 6. Öröklés (inheritance) — hogyan működik

### Mi az öröklés?

Az objektum-orientált programozás (OOP) alapja. Ha van egy "szülő" osztály (`BaseApiClient`) ami tartalmaz közös funkciókat, a "gyermek" osztályok (`UsersApi`, `CountriesGraphQLApi`) automatikusan megkapják ezeket a funkciókat anélkül, hogy újra le kellene írni.

### Hogyan néz ki a kódban?

```
BaseApiClient (szülő)
├── this.request          ← Playwright HTTP kliens
├── getDefaultHeaders()   ← Közös header-ek (auth + content-type)
├── graphqlRequest()      ← GraphQL POST hívás
│
├── UsersApi (gyermek — REST)
│   ├── getUsers()        ← GET /users (használja: this.request + getDefaultHeaders)
│   ├── getUserById()     ← GET /users/:id
│   ├── createPost()      ← POST /posts
│   └── getUsersWithoutAuth()  ← GET /users (header nélkül — auth teszthez)
│
└── CountriesGraphQLApi (gyermek — GraphQL)
    ├── getCountries()    ← query { countries } (használja: graphqlRequest)
    ├── getCountryByCode() ← query { country(code:) }
    └── sendInvalidQuery() ← hibás query (error teszthez)
```

### Hogyan épül fel a kódban?

**Szülő osztály:**
```typescript
// support/base/BaseApiClient.ts
export class BaseApiClient {
  protected readonly request: APIRequestContext;  // ← "protected" = gyermekek látják

  constructor(request: APIRequestContext) {       // ← constructor: a létrehozáskor kap egy HTTP klienst
    this.request = request;
  }

  protected getDefaultHeaders() { ... }          // ← "protected" metódus = gyermekek használhatják
  protected async graphqlRequest() { ... }       // ← közös GraphQL logika
}
```

**Gyermek osztály:**
```typescript
// support/api-client/UsersApi.ts
export class UsersApi extends BaseApiClient {     // ← "extends" = örököl a BaseApiClient-ből
  async getUsers() {
    return this.request.get('/users', {           // ← this.request a szülőtől jön
      headers: this.getDefaultHeaders(),          // ← getDefaultHeaders() a szülőtől jön
    });
  }
}
```

**Kulcsszavak:**
- `extends` — "ez az osztály örököl a másikból"
- `protected` — "a gyermek osztályok látják, de kívülről nem"
- `this` — "az aktuális objektum" (tartalmazhatja a szülő és a saját tulajdonságait)
- `constructor` — "ez fut le amikor létrehozod az objektumot (`new UsersApi(request)`)"

### Miért jó az öröklés?

Ha holnap kell egy új header minden API híváshoz (pl. `X-Request-ID`), **egyetlen helyen** írod be:

```typescript
// BaseApiClient.ts — EGY módosítás
protected getDefaultHeaders() {
  return {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
    'X-Request-ID': crypto.randomUUID(),  // ← ÚJ sor
  };
}
```

Automatikusan minden gyermek (`UsersApi`, `CountriesGraphQLApi`) megkapja. Nem kell 10 fájlban módosítani.

---

## 7. A support réteg — fájlról fájlra

### `support/base/BaseApiClient.ts`

**Mi ez?** Az összes API Object őse. Közös HTTP logikát tartalmaz.

**Tartalom:**
- `this.request` — Playwright `APIRequestContext`, ez az HTTP kliens amit minden híváshoz használunk
- `getDefaultHeaders()` — összerakja a headereket (auth token + Content-Type)
- `graphqlRequest(query, variables)` — GraphQL POST hívás egyetlen központi metódusban

**Ki használja?** `UsersApi` és `CountriesGraphQLApi` — mindkettő ebből örököl.

### `support/api-client/UsersApi.ts`

**Mi ez?** REST API Object a JSONPlaceholder `/users` és `/posts` endpointokhoz.

**Metódusok:**
| Metódus | HTTP hívás | Mire teszteli |
|---------|-----------|---------------|
| `getUsers()` | `GET /users` | Összes felhasználó lekérése |
| `getUserById(id)` | `GET /users/:id` | Egy felhasználó lekérése |
| `createPost(data)` | `POST /posts` | Új erőforrás létrehozása (CRUD teszt) |
| `getUsersWithoutAuth()` | `GET /users` (header nélkül) | Auth hiány tesztelés |

**Ki hívja?** `tests/rest/users.spec.ts`

### `support/api-client/CountriesGraphQLApi.ts`

**Mi ez?** GraphQL API Object a Countries API-hoz.

**Metódusok:**
| Metódus | GraphQL query | Mire teszteli |
|---------|--------------|---------------|
| `getCountries()` | `ListCountries` | Összes ország lekérése |
| `getCountryByCode(code)` | `GetCountry($code)` | Egy ország kód alapján |
| `sendInvalidQuery()` | Hibás szintaxis | Error handling |

**Fontos:** Ez az osztály NEM tartalmazza a query stringeket! Azokat a `countries.queries.ts`-ből importálja. Ez a felelősség szétválasztás (separation of concerns).

**Ki hívja?** `tests/graphql/countries.spec.ts`

### `support/helpers/auth.helper.ts`

**Mi ez?** Token kezelés — egyetlen hely ahol az autentikáció logikája él.

**Funkciók:**
- `getTestToken()` — visszaadja a JWT tokent (env változóból vagy üreset)
- `getAuthHeaders()` — `{ Authorization: 'Bearer ...' }` objektumot ad vissza
- `isLocalEnvironment()` — CI-ben futunk vagy lokálban?

**Ki hívja?** `BaseApiClient.getDefaultHeaders()` — tehát közvetetten minden API Object.

### `support/helpers/allure.helper.ts`

**Mi ez?** Két dolgot csinál:
1. **TestMeta objektum** — az összes Allure metadata (epic/feature/story/severity) egy központi helyen
2. **Helper funkciók** — `setTestMeta()` és `logResponseTime()`

**Ki hívja?** Minden spec fájl, minden teszt elején.

---

## 8. GraphQL kezelés — query-k, fragment-ek, gql tag

### Mi az a `gql` tag?

A `graphql-request` csomag része. Egy "tagged template literal" — egy speciális JavaScript szintaxis ami a query stringet feldolgozza:

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

**Mit ad?**
- IDE szintaxis kiemelés (a query kód színezve lesz)
- Alap szintaxis validáció
- Fragment-ek összekapcsolása (`${FRAGMENT}` szintaxissal)

### Mi az a Fragment?

Egy **újrahasználható mezőlista**. Ha több query is ugyanazokat a mezőket kéri le, nem akarod mindenhol megismételni:

```typescript
// NÉLKÜLE — ismétlődés:
const query1 = gql`{ countries { code name capital currency } }`;
const query2 = gql`{ country(code: "HU") { code name capital currency } }`;
//                                          ^^^^^^^^^^^^^^^^^^^^^^^^^ ismétlődik!

// VELE — újrahasználás:
const FIELDS = gql`fragment CountryCoreFields on Country { code name capital currency }`;
const query1 = gql`{ countries { ...CountryCoreFields } } ${FIELDS}`;
const query2 = gql`{ country(code: "HU") { ...CountryCoreFields } } ${FIELDS}`;
```

Ha holnap kell egy új mező (pl. `emoji`), **egy helyen** adod hozzá a fragment-hez.

### Miért külön fájlban (`countries.queries.ts`)?

**Szabály: query string SOHA nem kerül spec fájlba.**

Okai:
1. **Karbantarthatóság** — ha a query változik, egy fájlban módosítod, nem 5 tesztben
2. **Olvashatóság** — a spec fájl csak teszt logikát tartalmaz
3. **Újrahasználhatóság** — több teszt ugyanazt a query-t használhatja
4. **Autocomplete** — `CountryQueries.` → IDE listázza az elérhető query-ket

---

## 9. Zod séma validáció — mi ez és miért kell

### Mi az a Zod?

Egy TypeScript könyvtár ami **futási időben** ellenőrzi hogy egy adat megfelel-e egy adott struktúrának.

### Miért kell ez?

TypeScript csak **fordítási időben** ellenőriz. Ha az API válasz szerkezete megváltozik (mező átnevezés, típus változás), a TypeScript nem szól — hiszen a válasz csak futáskor jön.

**Zod nélkül:**
```typescript
const user = await response.json();
// TypeScript nem tudja hogy a "user" milyen szerkezetű
// Ha a backend átnevezte "name"-et "fullName"-re, semmi nem szól
expect(user.name).toBe('Leanne Graham');  // undefined — csendben elbukik
```

**Zod-dal:**
```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

UserSchema.parse(user);
// Ha "name" hiányzik: ZodError: Required at "name"
// Ha "id" string: ZodError: Expected number, received string at "id"
// Ha "email" nem email: ZodError: Invalid email at "email"
```

**Egy sor kód** elkapja az összes struktúra változást. A hibaüzenet pontosan megmondja **melyik mező** és **mi a probléma**.

### Hogyan használjuk?

```typescript
// schemas/users.schema.ts — definiáljuk az elvárt struktúrát
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

// users.spec.ts — egy assertionnel validálunk
expect(() => UsersListSchema.parse(users)).not.toThrow();
```

### BrokenSchema — a demo tesztek titka

A `UserBrokenSchema` és `CountryBrokenSchema` **szándékosan rossz** sémák:

```typescript
// Ez SOSEM fog sikerülni — mert "fullName" és "department" nem létezik az API-ban
export const UserBrokenSchema = z.object({
  id: z.number(),
  fullName: z.string(),     // ← az API "name"-et küld, nem "fullName"-et
  department: z.string(),   // ← ilyen mező nincs
});
```

Ezzel demonstráljuk: ha egy fejlesztő átnevez egy mezőt, a Zod **azonnal elkapja** és az Allure riportban tisztán látszik mi a hiba.

---

## 10. Fixture-ök — teszt adatok központosítása

### Mi az a Fixture?

Egy **központi adattár** amiben az elvárt értékek vannak. A teszt nem tartalmaz hardcoded stringeket — minden innen jön.

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

### Miért nem a tesztbe írod bele?

```typescript
// ROSSZ — hardcoded a tesztben:
expect(users).toHaveLength(10);
expect(user.name).toBe('Leanne Graham');

// JÓ — fixture-ből:
expect(users).toHaveLength(UserFixtures.totalCount);
expect(user.name).toBe(UserFixtures.firstUser.name);
```

**Okai:**
1. Ha az adat változik, **egy helyen** módosítod (nem 5 tesztben)
2. **Autocomplete** — `UserFixtures.` → IDE listázza az elérhető adatokat
3. **Elírás védelem** — TypeScript hibát dob ha nem létező property-t hívsz
4. Mint a mobil teszteknél a selectorok — ha a selector változik, a Page Object-ben módosítod, nem a tesztben

---

## 11. Spec fájlok — a tesztek anatómiája

### Egy teszt felépítése

```typescript
test('@smoke shouldReturn200WithUsersListWhenCalled', async () => {
  // 1. ARRANGE — Allure metadata beállítása
  await setTestMeta({ ...meta, story: meta.stories.list });

  // 2. ACT — API hívás végrehajtása
  const start = Date.now();
  const response = await usersApi.getUsers();
  await logResponseTime(start);

  // 3. ASSERT — eredmény ellenőrzése
  const users = await response.json();
  expect(response.status()).toBe(200);
  expect(users).toHaveLength(UserFixtures.totalCount);
});
```

**AAA minta (Arrange-Act-Assert):**
- **Arrange** — előkészítés (metadata, teszt adat)
- **Act** — a cselekvés (API hívás)
- **Assert** — ellenőrzés (state code, body, séma)

### Teszt elnevezési konvenció

`should<Elvárás>When<Feltétel>`

Példák:
- `shouldReturn200WithUsersListWhenCalled` — 200-at kell adnia user listával ha meghívjuk
- `shouldReturnHungaryDetailsWhenCodeIsHU` — Magyarország adatait kell adnia ha a kód HU
- `shouldDetectSchemaMismatchWhenFieldRenamed` — Séma eltérést kell jelezni ha mező nevet változtattak

### `test.describe()` és `test.beforeEach()`

```typescript
test.describe('REST — GET /users', () => {        // Logikai csoport
  let usersApi: UsersApi;                          // Változó deklaráció

  test.beforeEach(async ({ request }) => {         // MINDEN teszt előtt lefut
    usersApi = new UsersApi(request);              // Új API Object létrehozás
  });

  test('...', async () => { ... });                // Teszt 1
  test('...', async () => { ... });                // Teszt 2
});
```

**`test.beforeEach`** — minden teszt előtt fut. Biztosítja, hogy minden teszt tiszta állapotból indul (nincs megosztott state a tesztek között).

**`{ request }`** — Playwright automatikusan ad egy `APIRequestContext`-et. Ez az HTTP kliens ami a konfigurált `baseURL`-re küld kéréseket.

---

## 12. Allure riportolás — metadata és mérés

### Allure hierarchia

Az Allure riportban a tesztek hierarchikusan jelennek meg:

```
Epic (legmagasabb szint)
└── Feature (funkció)
    └── Story (konkrét user story)
        └── Test (egy teszt eset)
```

Például:
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

### Hogyan kerül be a metadata?

```typescript
// allure.helper.ts — központi metadata objektum
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

// spec fájl — egyetlen hívás
await setTestMeta({ ...meta, story: meta.stories.list });
```

**Miért központosított?** Hogy ne kelljen minden tesztben kézzel írni az epic/feature neveket. Ha átnevezik a feature-t, egy helyen módosítod.

### Response time mérés

```typescript
const start = Date.now();                    // Időmérés indítása
const response = await usersApi.getUsers();  // API hívás
const duration = await logResponseTime(start); // Idő rögzítése Allure-ben

// Opcionálisan: küszöb teszt
expect(duration).toBeLessThan(2000);  // Maximum 2 másodperc
```

Az Allure riportban ez **paraméterként** jelenik meg minden tesztnél:
```
Parameters:
  Response time (ms) → 64
```

### Trend grafikonok — változások nyomon követése futtatások között

Az Allure beépítetten támogatja a **trend grafikonokat**, amelyek megmutatják hogyan változnak a teszt eredmények az idő múlásával:
- **History Trend** — pass/fail/broken arány futtatásonként
- **Duration Trend** — hogyan változik a teszt futási idő
- **Categories Trend** — hiba típusok időben
- **Retry Trend** — flaky teszt minták

**Hogyan működik technikailag?**

Amikor az `allure generate` elkészíti a riportot, egy `history/` mappát ír az `allure-report/`-on belül:

```
allure-report/
  └── history/
       ├── history.json           ← pass/fail adat tesztenként
       ├── history-trend.json     ← összesített trend adat
       ├── duration-trend.json    ← futási idő trend
       ├── categories-trend.json  ← hiba kategóriák trend
       └── retry-trend.json       ← retry trend
```

A **következő** futtatásnál a trend megjelenéséhez ennek a `history/` mappának jelen kell lennie az `allure-results/` mappán belül a generálás **előtt**:

```bash
# 1. lépés: Tesztek futtatása + riport generálás (első futás — még nincs trend)
npm test
allure generate allure-results -o allure-report --clean

# 2. lépés: A következő futás előtt — history visszamásolása
cp -r allure-report/history allure-results/history

# 3. lépés: Tesztek újrafuttatása
npm test

# 4. lépés: Riport generálás — megjelennek a trend grafikonok!
allure generate allure-results -o allure-report --clean
allure open allure-report
```

**Miért nem mutat trendet az `allure serve`?** Mert az `allure serve` egy ideiglenes mappába generál és bezáráskor eldobja. Soha nem őrzi meg a history-t.

**CI/CD-ben:** Az `allure-report/history/` mappát cache-elni kell (pl. GitHub Actions artifact vagy cache action) a pipeline futtatások között. Így a trend automatikusan épül minden pipeline futtatással.

```yaml
# Példa GitHub Actions megközelítés:
# 1. Előző allure-report/history/ letöltése artifact-ból
# 2. Másolás az allure-results/history/-ba
# 3. Tesztek futtatása
# 4. allure generate
# 5. allure-report/ feltöltése artifact-ként (benne az új history/)
```

**Mit lát a Test Manager?** 3-5 futtatás után megőrzött history-val az Allure dashboard vonaldiagramokat jelenít meg, amelyek mutatják a stabilitást, sebességváltozásokat és regressziós mintákat az idő múlásával — nélkülözhetetlenek a sprint review-khoz és minőségi riportoláshoz.

---

## 13. Tag rendszer — @smoke, @regression, @demo

A tag a teszt nevében van (Playwright `--grep` szűri):

```typescript
test('@smoke shouldReturn200WithUsersListWhenCalled', ...);     // Smoke tag
test('@regression shouldReturn201WhenPostIsCreated', ...);      // Regression tag
test('@demo shouldDetectSchemaMismatchWhenFieldRenamed', ...);  // Demo tag
```

| Tag | Cél | Mikor futtatod? | Elvárás |
|-----|-----|----------------|---------|
| `@smoke` | Gyors happy-path | Minden push, reggel, deploy után | Mind zöld |
| `@regression` | Teljes fedettség | Napi, PR-enként | Mind zöld |
| `@demo` | Hiba bemutató | Demó alkalmakkor | Mind PIROS (szándékos) |

Futtatás: `npm run test:smoke`, `npm run test:regression`, `npm run test:demo`

---

## 14. Docker — konténerizálás

### Mi az a Docker és miért kell?

Docker egy "konténer" technológia: az alkalmazásodat (és az összes függőségét) becsomagolja egy dobozba ami **bárhol ugyanúgy fut**. Nincs "nálam működik, nálad nem" probléma.

### `Dockerfile` — az image receptje

```dockerfile
FROM node:20-slim           # Alap: minimális Node.js 20 image
WORKDIR /app                # Munkakönyvtár a konténerben
COPY package.json ./        # Először csak a package.json (cache optimalizáció)
RUN npm ci                  # Függőségek telepítése
COPY . .                    # Majd a teljes forráskód
CMD ["npx", "playwright", "test"]  # Alapértelmezett parancs: tesztek futtatása
```

### `docker-compose.yml` — egyszerű futtatás

```yaml
services:
  api-tests:
    build: .                # Dockerfile-ból építs image-et
    environment:            # Környezeti változók
      - BASE_URL_REST=...
      - BASE_URL_GRAPHQL=...
    volumes:                # Eredmények kijönnek a konténerből a host-ra
      - ./allure-results:/app/allure-results
```

A `volumes` kulcsfontosságú: az allure-results és playwright-report mappák a host gépen is elérhetők lesznek a futtatás után.

---

## 15. CI/CD — automatikus futtatás

### Mi az a CI/CD?

- **CI (Continuous Integration)** — minden kód változásnál automatikusan futnak a tesztek
- **CD (Continuous Delivery)** — automatikus kiszállítás (deploy)

### GitHub Actions workflow

```yaml
on:
  pull_request:              # Minden PR-nél fut
  schedule:
    - cron: '0 6 * * 1-5'   # Hétfőtől péntekig reggel 6-kor

jobs:
  test:
    runs-on: ubuntu-latest   # Ubuntu szerveren fut
    steps:
      - checkout             # Kód letöltése
      - setup-node           # Node.js telepítése
      - npm ci               # Függőségek telepítése
      - playwright test      # Tesztek futtatása
      - upload-artifact      # Riport archiválás (30 napig)
```

**Eredmény:** Minden PR-nél automatikusan lefut az összes teszt. Ha bármi elbukik, a PR-en piros lesz a check.

---

## 16. Hibadetektálás — mit fog ez a framework

| # | Hiba típus | Hogyan detektáljuk | Példa |
|---|-----------|-------------------|-------|
| 1 | Mező átnevezés | Zod séma validáció | `name` → `fullName` → ZodError |
| 2 | Mező eltűnés | Zod séma validáció | `population` hiányzik → ZodError |
| 3 | GraphQL query hiba | `body.errors` check | Backend séma változott |
| 4 | GraphQL szintaxis hiba | Error response validáció | Hibás query kezelés |
| 5 | Endpoint eltűnt | HTTP status code assert | 404 a 200 helyett |
| 6 | Response formátum változás | Zod típus ellenőrzés | Tömb helyett objektum |
| 7 | Auth törés | Header teszt | 401 ahol 200 kellene |
| 8 | CRUD törés | POST/PUT/DELETE status | 500 a 201 helyett |
| 9 | Adat regresszió | Fixture összehasonlítás | "Budapest" helyett null |
| 10 | Válaszidő romlás | Response time threshold | 5000ms a 200ms helyett |
| +1 | Content-type | Header assert | text/html a JSON helyett |

---

## 17. Teszt management szempontok

### Mit lát a Test Manager az Allure riportban?

1. **Dashboard** — összesített pass/fail arány, trend grafikon
2. **Suites** — tesztek csoportosítva (REST / GraphQL)
3. **Behaviors** — Epic → Feature → Story hierarchia
4. **Timeline** — párhuzamos futás vizualizálva (milyen gyors)
5. **Categories** — hiba típusok (Product defect, Test defect)
6. **Retries** — flaky tesztek azonosítása
7. **Duration** — melyik teszt a leglassabb

### Nyomonkövethetőség (Traceability)

Az Allure riportban minden teszt tartalmazza:
- **Epic** — melyik nagy funkcionális terület
- **Feature** — melyik API endpoint
- **Story** — pontosan milyen viselkedés
- **Severity** — critical / normal
- **Parameters** — Response time

Később bővíthető issue tracker link-kel is:
```typescript
await allure.link('https://jira.example.com/browse/PROJ-123', 'PROJ-123', 'issue');
```

### Költség

**$0** — minden komponens ingyenes és nyílt forráskódú:
- Playwright (MIT licensz)
- Allure (Apache 2.0)
- Zod (MIT)
- GitHub Actions (ingyenes publikus repókhoz)

---

## 18. Teljes adatfolyam — ki kit hív és miért

```
┌────────────────────────────────────────────────────────────────┐
│  playwright.config.ts                                          │
│  "Hol vannak a tesztek? Milyen URL-re menjenek? Mi riportolja?"│
│  Beállítja: testDir, baseURL, reporter, parallel, retry        │
└────────────────────┬───────────────────────────────────────────┘
                     │ indítja
                     ▼
┌────────────────────────────────────────────────────────────────┐
│  users.spec.ts / countries.spec.ts                             │
│  "Mi a teszt forgatókönyv?"                                    │
│  Tartalmaz: describe, beforeEach, test blokkok (AAA)           │
│                                                                │
│  Importál:                                                     │
│  ┌─────────────────┐  ┌───────────────┐  ┌──────────────────┐ │
│  │ API Object      │  │ Fixture       │  │ Schema           │ │
│  │ (mit hívjak?)   │  │ (mit várok?)  │  │ (milyen legyen?) │ │
│  └────────┬────────┘  └───────────────┘  └──────────────────┘ │
│           │  + allure.helper.ts (metadata + timing)            │
└───────────┼────────────────────────────────────────────────────┘
            │ hív
            ▼
┌────────────────────────────────────────────────────────────────┐
│  UsersApi.ts / CountriesGraphQLApi.ts                          │
│  "Hogyan kell meghívni az API-t?"                              │
│  Tartalmaz: metódusok (getUsers, getCountryByCode, stb.)       │
│                                                                │
│  Örököl: BaseApiClient-ből                                     │
│  ┌──────────────────────────────┐                              │
│  │ BaseApiClient.ts             │                              │
│  │ this.request (HTTP kliens)   │                              │
│  │ getDefaultHeaders()          │──→ auth.helper.ts (token)    │
│  │ graphqlRequest()             │                              │
│  └──────────────────────────────┘                              │
│                                                                │
│  GraphQL API Object extra:                                     │
│  └── importálja: countries.queries.ts                          │
│                   └── query stringek + fragment-ek             │
└────────────────────────────────────────────────────────────────┘
            │ küld HTTP kérést
            ▼
┌────────────────────────────────────────────────────────────────┐
│  Külső API (JSONPlaceholder / Countries API)                   │
│  Válaszol: JSON body + status code + headers                   │
└────────────────────────────────────────────────────────────────┘
            │ válasz visszajön
            ▼
┌────────────────────────────────────────────────────────────────┐
│  Spec fájl — ASSERT rész                                       │
│  Ellenőrzések:                                                 │
│  1. Status code    → expect(response.status()).toBe(200)       │
│  2. Body értékek   → expect(user.name).toBe(Fixture.name)     │
│  3. Séma           → expect(() => Schema.parse(body)).not...   │
│  4. Timing         → expect(duration).toBeLessThan(2000)      │
│  5. Headers        → expect(contentType).toContain('json')    │
└────────────────────────────────────────────────────────────────┘
            │ eredmény
            ▼
┌────────────────────────────────────────────────────────────────┐
│  Reporter-ek (playwright.config.ts-ben definiálva)             │
│  ├── list         → konzol kimenet (✓ / ✘ + idő)              │
│  ├── html         → playwright-report/ (HTML fájlok)           │
│  └── allure       → allure-results/ (JSON fájlok)              │
│                      └── allure serve → böngészős dashboard    │
└────────────────────────────────────────────────────────────────┘
```

---

> **Gratulálunk!** Ha idáig eljutottál, már értesz mindent ami ehhez a keretrendszerhez kell. A következő lépés: írd meg az első saját tesztedet a [Struktúra és napi munka](./02-STRUCTURE-AND-DAILY-WORK.hu.md) dokumentum alapján.
