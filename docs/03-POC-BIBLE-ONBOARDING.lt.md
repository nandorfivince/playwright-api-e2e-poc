# POC Biblija — Pilna onboarding dokumentacija

> Šis dokumentas skirtas pradedančiam testų automatizuotojui, kuris pirmą kartą susiduria su šia karkaso sistema. Kiekvienas sluoksnis, failas, konfigūracija ir kodo technika yra detaliai paaiškinti.

---

## Turinys

1. [Kas yra šis projektas?](#1-kas-yra-šis-projektas)
2. [Kodėl Playwright, o ne Cypress?](#2-kodėl-playwright-o-ne-cypress)
3. [Technologijų rinkinys](#3-technologijų-rinkinys)
4. [Detalus konfigūracinių failų paaiškinimas](#4-detalus-konfigūracinių-failų-paaiškinimas)
5. [API Object Model šablonas](#5-api-object-model-šablonas)
6. [Paveldėjimas (inheritance) — kaip veikia](#6-paveldėjimas-inheritance--kaip-veikia)
7. [Support sluoksnis — failas po failo](#7-support-sluoksnis--failas-po-failo)
8. [GraphQL valdymas — query, fragment, gql tag](#8-graphql-valdymas--query-fragment-gql-tag)
9. [Zod schemos validacija — kas tai ir kodėl reikia](#9-zod-schemos-validacija--kas-tai-ir-kodėl-reikia)
10. [Fixture — centralizuoti testų duomenys](#10-fixture--centralizuoti-testų-duomenys)
11. [Spec failai — testų anatomija](#11-spec-failai--testų-anatomija)
12. [Allure ataskaitų sistema — metaduomenys ir matavimai](#12-allure-ataskaitų-sistema--metaduomenys-ir-matavimai)
13. [Žymų sistema — @smoke, @regression, @demo](#13-žymų-sistema--smoke-regression-demo)
14. [Docker — konteinerizacija](#14-docker--konteinerizacija)
15. [CI/CD — automatinis vykdymas](#15-cicd--automatinis-vykdymas)
16. [Klaidų aptikimas — ką aptinka ši sistema](#16-klaidų-aptikimas--ką-aptinka-ši-sistema)
17. [Testų valdymo aspektai](#17-testų-valdymo-aspektai)
18. [Pilnas duomenų srautas — kas ką kviečia ir kodėl](#18-pilnas-duomenų-srautas--kas-ką-kviečia-ir-kodėl)

---

## 1. Kas yra šis projektas?

Tai yra **Proof of Concept (POC)** — įrodymas, kad Playwright karkasas tinkamas backend API automatizuotam testavimui. Nerašome naršyklėje veikiančių UI testų, o siunčiame **grynus HTTP užklausas** API ir tikriname atsakymus.

POC naudoja dvi viešas API demonstracijai:
- **REST:** JSONPlaceholder (`https://jsonplaceholder.typicode.com`) — naudotojų duomenys
- **GraphQL:** Countries API (`https://countries.trevorblades.com/graphql`) — šalių duomenys

Tikslas: parodyti, kad šis metodas yra **greitesnis, paprastesnis ir pigesnis** nei Cypress pagrindu veikiantis backend testavimas.

---

## 2. Kodėl Playwright, o ne Cypress?

| Aspektas | Cypress | Playwright |
|----------|---------|------------|
| **API kvietimo būdas** | `cy.request()` — veikia naršyklės kontekste | `request` API — natyvus HTTP, nėra naršyklės |
| **Greitis** | Paleidžiama naršyklė → lėta (5-15s papildomas laikas) | Tiesioginis HTTP → greitas (<1s visiems testams) |
| **Lygiagretus vykdymas** | Mokama (Cypress Cloud) | Nemokama, integruotas `fullyParallel` |
| **GraphQL** | Nėra natyvaus palaikymo | Tas pats POST kvietimas, natyviai apdorojamas |
| **TypeScript** | Dalinis palaikymas | Pilnas, natyvus |
| **Ataskaitos** | Cypress Dashboard (mokama) | Allure (nemokama) + HTML |
| **Docker** | Reikia naršyklės image (~1GB+) | Minimalus Node image (~200MB) |
| **CI/CD** | Sudėtingiau (naršyklės priklausomybės) | Paprasčiau (nėra naršyklės priklausomybių) |

**Apibendrinant:** Jei norime testuoti API (ne UI), nereikia paleisti naršyklės. Playwright `request` API būtent tam skirta.

---

## 3. Technologijų rinkinys

| Technologija | Versija | Paskirtis |
|------------|--------|--------|
| **Playwright** | 1.50+ | Testų vykdymas, HTTP klientai, ataskaitos |
| **TypeScript** | 5.7+ | Tipų saugus kodas — rašybos klaidos aptinkamos kompiliavimo metu |
| **Zod** | 3.24+ | Atsakymo struktūros validacija vykdymo metu |
| **graphql-request** | 7.1+ | GraphQL užklausos su `gql` žyma — sintaksės tikrinimas |
| **allure-playwright** | 3.0+ | Allure ataskaitų integracija |
| **Docker** | - | Konteinerizuotas vykdymas (neprivaloma) |
| **GitHub Actions** | - | CI/CD pipeline (neprivaloma) |

**Iš viso 14 npm paketų** — minimalus dydis, greitas diegimas.

---

## 4. Detalus konfigūracinių failų paaiškinimas

### `package.json` — projekto "asmens dokumentas"

```json
{
  "name": "playwright-api-e2e-poc",     // Projekto pavadinimas
  "private": true,                       // Nepublikuojama į npm
  "scripts": {                           // Vykdymo komandos (npm run ...)
    "test": "npx playwright test",       // Visi testai
    "test:rest": "...",                  // Tik REST
    "test:smoke": "...",                 // Tik @smoke žyma
    "test:allure": "npx allure serve allure-results"  // Allure atidarymas
  },
  "dependencies": {
    "@playwright/test": "^1.50.0",       // Testų vykdymas
    "allure-playwright": "^3.0.0",       // Allure integracija
    "graphql": "^16.10.0",              // GraphQL branduolys (reikalingas gql žymai)
    "graphql-request": "^7.1.0",        // gql template žyma
    "zod": "^3.24.0"                    // Schemos validacija
  }
}
```

**Ką reiškia `^` versijoje?** Pavyzdžiui `^1.50.0` = įdiekite 1.50.0 arba bet kurią naujesnę versiją, bet likite 1.x ribose. Taip automatiškai gauname klaidų pataisymus be didelių breaking change.

### `tsconfig.json` — TypeScript nustatymai

```json
{
  "compilerOptions": {
    "target": "ES2022",              // Į kokį JS kompiliuoja (modernus)
    "module": "ESNext",              // Import/export sintaksė
    "strict": true,                  // Griežtas tipų tikrinimas
    "baseUrl": ".",                  // Path alias pradžios taškas
    "paths": {
      "@support/*": ["./support/*"], // import { UsersApi } from '@support/api-client/UsersApi'
      "@schemas/*": ["./schemas/*"]  // import { UserSchema } from '@schemas/users.schema'
    }
  }
}
```

**Kodėl reikia path alias?** Kad nereikėtų rašyti tokių dalykų: `../../support/api-client/UsersApi` — vietoj to `@support/api-client/UsersApi`. Lengviau skaitoma ir perkeliant failą nereikia perrašinėti kelių.

### `playwright.config.ts` — centrinis testų vykdymo konfigūracijos failas

```typescript
export default defineConfig({
  testDir: './tests',          // Kur ieškoti testų failų
  fullyParallel: true,         // Visi testai vykdomi lygiagrečiai
  retries: process.env.CI ? 2 : 0,  // CI aplinkoje 2 pakartojimas, lokaliai 0
  timeout: 30_000,             // Maksimaliai 30s/testui (jei nepasibaigs per tiek — klaida)

  reporter: [
    ['list'],                  // Konsolės išvestis (testų pavadinimai + laikas)
    ['html', { ... }],        // HTML ataskaita (į playwright-report/ katalogą)
    ['allure-playwright', { ... }],  // Allure ataskaita (į allure-results/ katalogą)
  ],

  projects: [                  // Du "projektai" = dvi atskiros API
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

**Kas yra "project" Playwright aplinkoje?** Testų rinkinio konfigūracijos vienetas. Kiekvienas projektas gali turėti savo baseURL, savo testų katalogą. Kai vykdomas `npm test`, abiejų projektų testai paleidžiami.

**`fullyParallel: true`** — visi testai paleidžiami vienu metu (atskiruose worker procesuose). Todėl taip greitai: 13 testų ~1.4 sekundės.

---

## 5. API Object Model šablonas

Tai yra karkaso esmė. Analogiškas **Page Object Model (POM)** šablonui, kurį naudojame mobiliuose/web E2E testuose:

| POM (UI testai) | API Object Model (API testai) |
|-------------------|-------------------------------|
| `BasePage.ts` + `this.driver` | `BaseApiClient.ts` + `this.request` |
| `LoginPage.ts`, `HomePage.ts` | `UsersApi.ts`, `CountriesGraphQLApi.ts` |
| Selektoriai (CSS, testID) | HTTP endpoint, antraštės |
| `loginPage.clickSubmit()` | `usersApi.getUsers()` |
| Elemento paieška | HTTP užklausos siuntimas |

**Esmė:** Spec failas (testas) NIEKADA nesiunčia tiesioginio HTTP kvietimo. Viskas vyksta per API Object metodą. Taip, jei pasikeičia endpoint URL, **vienoje vietoje** reikia keisti (API Object), o ne visuose testuose.

---

## 6. Paveldėjimas (inheritance) — kaip veikia

### Kas yra paveldėjimas?

Objektinio programavimo (OOP) pagrindas. Jei yra "tėvinė" klasė (`BaseApiClient`), turinti bendras funkcijas, "vaikinės" klasės (`UsersApi`, `CountriesGraphQLApi`) automatiškai jas gauna, nereikia perrašyti.

### Kaip atrodo kode?

```
BaseApiClient (tėvinė)
├── this.request          ← Playwright HTTP klientas
├── getDefaultHeaders()   ← Bendros antraštės (auth + content-type)
├── graphqlRequest()      ← GraphQL POST kvietimas
│
├── UsersApi (vaikinė — REST)
│   ├── getUsers()        ← GET /users (naudoja: this.request + getDefaultHeaders)
│   ├── getUserById()     ← GET /users/:id
│   ├── createPost()      ← POST /posts
│   └── getUsersWithoutAuth()  ← GET /users (be antraščių — auth testui)
│
└── CountriesGraphQLApi (vaikinė — GraphQL)
    ├── getCountries()    ← query { countries } (naudoja: graphqlRequest)
    ├── getCountryByCode() ← query { country(code:) }
    └── sendInvalidQuery() ← klaidinga užklausa (klaidos testui)
```

### Kaip tai realizuota kode?

**Tėvinė klasė:**
```typescript
// support/base/BaseApiClient.ts
export class BaseApiClient {
  protected readonly request: APIRequestContext;  // ← "protected" = vaikinės klasės mato

  constructor(request: APIRequestContext) {       // ← constructor: sukūrimo metu gauna HTTP klientą
    this.request = request;
  }

  protected getDefaultHeaders() { ... }          // ← "protected" metodas = vaikinės klasės gali naudoti
  protected async graphqlRequest() { ... }       // ← bendra GraphQL logika
}
```

**Vaikinė klasė:**
```typescript
// support/api-client/UsersApi.ts
export class UsersApi extends BaseApiClient {     // ← "extends" = paveldi iš BaseApiClient
  async getUsers() {
    return this.request.get('/users', {           // ← this.request ateina iš tėvinės klasės
      headers: this.getDefaultHeaders(),          // ← getDefaultHeaders() ateina iš tėvinės klasės
    });
  }
}
```

**Raktažodžiai:**
- `extends` — "ši klasė paveldi iš kitos"
- `protected` — "vaikinės klasės mato, bet iš išorės nepasiekiama"
- `this` — "dabartinis objektas" (gali turėti tiek tėvinės, tiek savo savybes)
- `constructor` — "vykdomas kuriant objektą (`new UsersApi(request)`)"

### Kodėl paveldėjimas yra naudingas?

Jei rytoj reikės naujos antraštės kiekvienam API kvietimui (pvz., `X-Request-ID`), **vienoje vietoje** įrašote:

```typescript
// BaseApiClient.ts — VIENAS pakeitimas
protected getDefaultHeaders() {
  return {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
    'X-Request-ID': crypto.randomUUID(),  // ← NAUJA eilutė
  };
}
```

Automatiškai visos vaikinės klasės (`UsersApi`, `CountriesGraphQLApi`) tai gauna. Nereikia keisti 10 failų.

---

## 7. Support sluoksnis — failas po failo

### `support/base/BaseApiClient.ts`

**Kas tai?** Visų API Object protėvis. Turi bendrą HTTP logiką.

**Turinys:**
- `this.request` — Playwright `APIRequestContext`, tai HTTP klientas, naudojamas kiekvienam kvietimui
- `getDefaultHeaders()` — surinkia antraštes (auth token + Content-Type)
- `graphqlRequest(query, variables)` — GraphQL POST kvietimas viename centriniame metode

**Kas naudoja?** `UsersApi` ir `CountriesGraphQLApi` — abi iš jo paveldi.

### `support/api-client/UsersApi.ts`

**Kas tai?** REST API Object JSONPlaceholder `/users` ir `/posts` endpoint.

**Metodai:**
| Metodas | HTTP kvietimas | Ką testuoja |
|---------|-----------|---------------|
| `getUsers()` | `GET /users` | Visų naudotojų gavimas |
| `getUserById(id)` | `GET /users/:id` | Vieno naudotojo gavimas |
| `createPost(data)` | `POST /posts` | Naujo resurso sukūrimas (CRUD testas) |
| `getUsersWithoutAuth()` | `GET /users` (be antraščių) | Autentifikacijos nebuvimo testavimas |

**Kas kviečia?** `tests/rest/users.spec.ts`

### `support/api-client/CountriesGraphQLApi.ts`

**Kas tai?** GraphQL API Object Countries API.

**Metodai:**
| Metodas | GraphQL užklausa | Ką testuoja |
|---------|--------------|---------------|
| `getCountries()` | `ListCountries` | Visų šalių gavimas |
| `getCountryByCode(code)` | `GetCountry($code)` | Vienos šalies pagal kodą |
| `sendInvalidQuery()` | Klaidinga sintaksė | Klaidų apdorojimas |

**Svarbu:** Ši klasė NESAUGO užklausų eilučių! Jos importuojamos iš `countries.queries.ts`. Tai atsakomybių atskyrimas (separation of concerns).

**Kas kviečia?** `tests/graphql/countries.spec.ts`

### `support/helpers/auth.helper.ts`

**Kas tai?** Tokenų valdymas — vienintelė vieta, kur gyvena autentifikacijos logika.

**Funkcijos:**
- `getTestToken()` — grąžina JWT tokeną (iš aplinkos kintamojo arba tuščią)
- `getAuthHeaders()` — grąžina `{ Authorization: 'Bearer ...' }` objektą
- `isLocalEnvironment()` — ar veikiame CI aplinkoje, ar lokaliai?

**Kas kviečia?** `BaseApiClient.getDefaultHeaders()` — taigi netiesiogiai kiekvienas API Object.

### `support/helpers/allure.helper.ts`

**Kas tai?** Atlieka du dalykus:
1. **TestMeta objektas** — visi Allure metaduomenys (epic/feature/story/severity) vienoje centrinėje vietoje
2. **Pagalbinės funkcijos** — `setTestMeta()` ir `logResponseTime()`

**Kas kviečia?** Kiekvienas spec failas, kiekvieno testo pradžioje.

---

## 8. GraphQL valdymas — query, fragment, gql tag

### Kas yra `gql` žyma?

`graphql-request` paketo dalis. Tai "tagged template literal" — speciali JavaScript sintaksė, kuri apdoroja užklausos eilutę:

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

**Ką suteikia?**
- IDE sintaksės spalvinimas (užklausos kodas bus nuspalvintas)
- Bazinė sintaksės validacija
- Fragment sujungimas (`${FRAGMENT}` sintakse)

### Kas yra Fragment?

**Daugkartinio naudojimo laukų sąrašas**. Jei kelios užklausos prašo tų pačių laukų, nenorime visur kartoti:

```typescript
// BE JO — pasikartojimas:
const query1 = gql`{ countries { code name capital currency } }`;
const query2 = gql`{ country(code: "HU") { code name capital currency } }`;
//                                          ^^^^^^^^^^^^^^^^^^^^^^^^^ kartojasi!

// SU JUO — pakartotinis naudojimas:
const FIELDS = gql`fragment CountryCoreFields on Country { code name capital currency }`;
const query1 = gql`{ countries { ...CountryCoreFields } } ${FIELDS}`;
const query2 = gql`{ country(code: "HU") { ...CountryCoreFields } } ${FIELDS}`;
```

Jei rytoj reikės naujo lauko (pvz., `emoji`), **vienoje vietoje** pridėsite prie fragmento.

### Kodėl atskirame faile (`countries.queries.ts`)?

**Taisyklė: užklausos eilutė NIEKADA nekeliauja į spec failą.**

Priežastys:
1. **Priežiūros paprastumas** — jei užklausa keičiasi, keičiate viename faile, ne 5 testuose
2. **Skaitomumas** — spec failas turi tik testų logiką
3. **Pakartotinis naudojimas** — keli testai gali naudoti tą pačią užklausą
4. **Autocomplete** — `CountryQueries.` → IDE rodo galimas užklausas

---

## 9. Zod schemos validacija — kas tai ir kodėl reikia

### Kas yra Zod?

TypeScript biblioteka, kuri **vykdymo metu** tikrina, ar duomenys atitinka nurodytą struktūrą.

### Kodėl to reikia?

TypeScript tikrina tik **kompiliavimo metu**. Jei API atsakymo struktūra pasikeičia (lauko pervadinimas, tipo pakeitimas), TypeScript nepraneša — nes atsakymas ateina tik vykdymo metu.

**Be Zod:**
```typescript
const user = await response.json();
// TypeScript nežino, kokia "user" struktūra
// Jei backend pervadino "name" į "fullName", niekas nepraneša
expect(user.name).toBe('Leanne Graham');  // undefined — tyliai nepavyksta
```

**Su Zod:**
```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

UserSchema.parse(user);
// Jei "name" trūksta: ZodError: Required at "name"
// Jei "id" yra string: ZodError: Expected number, received string at "id"
// Jei "email" nėra email: ZodError: Invalid email at "email"
```

**Viena kodo eilutė** aptinka visus struktūros pokyčius. Klaidos pranešimas tiksliai nurodo, **kuris laukas** ir **kokia problema**.

### Kaip naudojame?

```typescript
// schemas/users.schema.ts — apibrėžiame laukiamą struktūrą
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

// users.spec.ts — vienu assertion validuojame
expect(() => UsersListSchema.parse(users)).not.toThrow();
```

### BrokenSchema — demo testų paslaptis

`UserBrokenSchema` ir `CountryBrokenSchema` yra **tyčia klaidingos** schemos:

```typescript
// Tai NIEKADA nepavyks — nes "fullName" ir "department" neegzistuoja API
export const UserBrokenSchema = z.object({
  id: z.number(),
  fullName: z.string(),     // ← API siunčia "name", ne "fullName"
  department: z.string(),   // ← tokio lauko nėra
});
```

Taip demonstruojame: jei programuotojas pervadina lauką, Zod **iš karto aptinka** ir Allure ataskaitoje aiškiai matoma, kokia klaida.

---

## 10. Fixture — centralizuoti testų duomenys

### Kas yra Fixture?

**Centralizuota duomenų saugykla**, kurioje saugomi laukiami reikšmės. Testas neturi hardcoded eilučių — viskas ateina iš čia.

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

### Kodėl nerašote tiesiogiai teste?

```typescript
// BLOGAI — hardcoded teste:
expect(users).toHaveLength(10);
expect(user.name).toBe('Leanne Graham');

// GERAI — iš fixture:
expect(users).toHaveLength(UserFixtures.totalCount);
expect(user.name).toBe(UserFixtures.firstUser.name);
```

**Priežastys:**
1. Jei duomenys keičiasi, **vienoje vietoje** keičiate (ne 5 testuose)
2. **Autocomplete** — `UserFixtures.` → IDE rodo galimus duomenis
3. **Apsauga nuo klaidų** — TypeScript meta klaidą, jei kviečiate neegzistuojančią savybę
4. Kaip mobiliuose testuose selektoriai — jei selektorius keičiasi, keičiate Page Object, ne teste

---

## 11. Spec failai — testų anatomija

### Testo struktūra

```typescript
test('@smoke shouldReturn200WithUsersListWhenCalled', async () => {
  // 1. ARRANGE — Allure metaduomenų nustatymas
  await setTestMeta({ ...meta, story: meta.stories.list });

  // 2. ACT — API kvietimo vykdymas
  const start = Date.now();
  const response = await usersApi.getUsers();
  await logResponseTime(start);

  // 3. ASSERT — rezultatų tikrinimas
  const users = await response.json();
  expect(response.status()).toBe(200);
  expect(users).toHaveLength(UserFixtures.totalCount);
});
```

**AAA šablonas (Arrange-Act-Assert):**
- **Arrange** — paruošimas (metaduomenys, testų duomenys)
- **Act** — veiksmas (API kvietimas)
- **Assert** — tikrinimas (status kodas, body, schema)

### Testų pavadinimų konvencija

`should<Laukiamas>When<Sąlyga>`

Pavyzdžiai:
- `shouldReturn200WithUsersListWhenCalled` — turi grąžinti 200 su naudotojų sąrašu, kai kviečiamas
- `shouldReturnHungaryDetailsWhenCodeIsHU` — turi grąžinti Vengrijos duomenis, kai kodas yra HU
- `shouldDetectSchemaMismatchWhenFieldRenamed` — turi aptikti schemos neatitikimą, kai laukas pervadintas

### `test.describe()` ir `test.beforeEach()`

```typescript
test.describe('REST — GET /users', () => {        // Loginė grupė
  let usersApi: UsersApi;                          // Kintamojo deklaracija

  test.beforeEach(async ({ request }) => {         // Vykdomas PRIEŠ kiekvieną testą
    usersApi = new UsersApi(request);              // Naujo API Object sukūrimas
  });

  test('...', async () => { ... });                // Testas 1
  test('...', async () => { ... });                // Testas 2
});
```

**`test.beforeEach`** — vykdomas prieš kiekvieną testą. Užtikrina, kad kiekvienas testas prasideda švariu būsena (nėra bendrinamo state tarp testų).

**`{ request }`** — Playwright automatiškai suteikia `APIRequestContext`. Tai HTTP klientas, siunčiantis užklausas į sukonfigūruotą `baseURL`.

---

## 12. Allure ataskaitų sistema — metaduomenys ir matavimai

### Allure hierarchija

Allure ataskaitoje testai rodomi hierarchiškai:

```
Epic (aukščiausias lygis)
└── Feature (funkcionalumas)
    └── Story (konkreti user story)
        └── Test (vienas testo atvejis)
```

Pavyzdžiui:
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

### Kaip metaduomenys patenka?

```typescript
// allure.helper.ts — centrinis metaduomenų objektas
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

// spec failas — vienas kvietimas
await setTestMeta({ ...meta, story: meta.stories.list });
```

**Kodėl centralizuota?** Kad nereikėtų kiekviename teste rankiniu būdu rašyti epic/feature pavadinimus. Jei feature pervadinamas, keičiate vienoje vietoje.

### Atsakymo laiko matavimas

```typescript
const start = Date.now();                    // Laiko matavimo pradžia
const response = await usersApi.getUsers();  // API kvietimas
const duration = await logResponseTime(start); // Laiko įrašymas į Allure

// Pasirinktinai: slenksčio testas
expect(duration).toBeLessThan(2000);  // Maksimaliai 2 sekundės
```

Allure ataskaitoje tai rodoma kaip **parametras** prie kiekvieno testo:
```
Parameters:
  Response time (ms) → 64
```

### Tendencijų grafikai — pokyčių sekimas tarp paleidimų

Allure turi integruotą **tendencijų grafikų** palaikymą, kurie rodo, kaip keičiasi testų rezultatai laikui bėgant:
- **History Trend** — pass/fail/broken santykis pagal paleidimus
- **Duration Trend** — kaip keičiasi testų vykdymo laikas
- **Categories Trend** — klaidų tipai laikui bėgant
- **Retry Trend** — flaky testų šablonai

**Kaip tai veikia techniškai?**

Kai `allure generate` sukuria ataskaitą, jis įrašo `history/` katalogą `allure-report/` viduje:

```
allure-report/
  └── history/
       ├── history.json           ← pass/fail duomenys kiekvienam testui
       ├── history-trend.json     ← agreguoti tendencijų duomenys
       ├── duration-trend.json    ← vykdymo laiko tendencija
       ├── categories-trend.json  ← klaidų kategorijų tendencija
       └── retry-trend.json       ← pakartojimų tendencija
```

Kad **kitas** paleidimas rodytų tendenciją, šis `history/` katalogas turi būti `allure-results/` viduje **prieš** generavimą:

```bash
# 1 žingsnis: Testų paleidimas + ataskaitos generavimas (pirmas paleidimas — dar nėra tendencijos)
npm test
allure generate allure-results -o allure-report --clean

# 2 žingsnis: Prieš kitą paleidimą — istorijos kopijavimas atgal
cp -r allure-report/history allure-results/history

# 3 žingsnis: Testų paleidimas iš naujo
npm test

# 4 žingsnis: Ataskaitos generavimas — tendencijų grafikai dabar atsiranda!
allure generate allure-results -o allure-report --clean
allure open allure-report
```

**Kodėl `allure serve` nerodo tendencijų?** Nes `allure serve` generuoja ataskaitą į laikiną katalogą ir ištrina jį uždarius. Niekada nesaugo istorijos.

**CI/CD aplinkoje:** `allure-report/history/` katalogą reikia saugoti kaip cache (pvz., GitHub Actions artifact arba cache action) tarp pipeline paleidimų. Taip tendencijos automatiškai kaupiasi su kiekvienu pipeline vykdymu.

```yaml
# GitHub Actions pavyzdinis metodas:
# 1. Ankstesnio allure-report/history/ parsisiuntimas iš artifacts
# 2. Kopijavimas į allure-results/history/
# 3. Testų paleidimas
# 4. allure generate
# 5. allure-report/ įkėlimas kaip artifact (su nauja history/)
```

**Ką mato Test Manager?** Po 3-5 paleidimų su išsaugota istorija Allure dashboard rodo linijų grafikus, kurie rodo stabilumą, greičio pokyčius ir regresijos šablonus laikui bėgant — būtini sprint peržiūroms ir kokybės ataskaitoms.

---

## 13. Žymų sistema — @smoke, @regression, @demo

Žyma yra testo pavadinime (Playwright `--grep` filtruoja):

```typescript
test('@smoke shouldReturn200WithUsersListWhenCalled', ...);     // Smoke žyma
test('@regression shouldReturn201WhenPostIsCreated', ...);      // Regression žyma
test('@demo shouldDetectSchemaMismatchWhenFieldRenamed', ...);  // Demo žyma
```

| Žyma | Paskirtis | Kada vykdoma? | Laukiamas rezultatas |
|-----|-----|----------------|---------|
| `@smoke` | Greitas happy-path | Kiekvieno push, ryte, po deploy | Visi žali |
| `@regression` | Pilna aprėptis | Kasdien, kiekvienam PR | Visi žali |
| `@demo` | Klaidos demonstracija | Demonstracijų metu | Visi RAUDONI (tyčia) |

Vykdymas: `npm run test:smoke`, `npm run test:regression`, `npm run test:demo`

---

## 14. Docker — konteinerizacija

### Kas yra Docker ir kodėl jo reikia?

Docker yra "konteinerio" technologija: jūsų programą (ir visas priklausomybes) supakuoja į dėžę, kuri **bet kur veikia vienodai**. Nėra "pas mane veikia, pas tave ne" problemos.

### `Dockerfile` — image receptas

```dockerfile
FROM node:20-slim           # Pagrindas: minimalus Node.js 20 image
WORKDIR /app                # Darbo katalogas konteineryje
COPY package.json ./        # Pirmiausia tik package.json (cache optimizavimas)
RUN npm ci                  # Priklausomybių diegimas
COPY . .                    # Tada visas išeities kodas
CMD ["npx", "playwright", "test"]  # Numatytoji komanda: testų vykdymas
```

### `docker-compose.yml` — paprastas vykdymas

```yaml
services:
  api-tests:
    build: .                # Sukurti image iš Dockerfile
    environment:            # Aplinkos kintamieji
      - BASE_URL_REST=...
      - BASE_URL_GRAPHQL=...
    volumes:                # Rezultatai perkeliami iš konteinerio į host
      - ./allure-results:/app/allure-results
```

`volumes` yra esminis: allure-results ir playwright-report katalogai bus pasiekiami host kompiuteryje po vykdymo.

---

## 15. CI/CD — automatinis vykdymas

### Kas yra CI/CD?

- **CI (Continuous Integration)** — kiekvieno kodo pakeitimo metu automatiškai vykdomi testai
- **CD (Continuous Delivery)** — automatinis pristatymas (deploy)

### GitHub Actions workflow

```yaml
on:
  pull_request:              # Vykdoma kiekvienam PR
  schedule:
    - cron: '0 6 * * 1-5'   # Pirmadienį–penktadienį 6 val. ryte

jobs:
  test:
    runs-on: ubuntu-latest   # Vykdoma Ubuntu serveryje
    steps:
      - checkout             # Kodo parsisiuntimas
      - setup-node           # Node.js diegimas
      - npm ci               # Priklausomybių diegimas
      - playwright test      # Testų vykdymas
      - upload-artifact      # Ataskaitos archyvavimas (30 dienų)
```

**Rezultatas:** Kiekvieno PR metu automatiškai vykdomi visi testai. Jei kas nors nepavyksta, PR turės raudoną check.

---

## 16. Klaidų aptikimas — ką aptinka ši sistema

| # | Klaidos tipas | Kaip aptinkame | Pavyzdys |
|---|-----------|-------------------|-------|
| 1 | Lauko pervadinimas | Zod schemos validacija | `name` → `fullName` → ZodError |
| 2 | Lauko dingimas | Zod schemos validacija | `population` trūksta → ZodError |
| 3 | GraphQL užklausos klaida | `body.errors` tikrinimas | Backend schema pasikeitė |
| 4 | GraphQL sintaksės klaida | Klaidos atsakymo validacija | Klaidingos užklausos apdorojimas |
| 5 | Endpoint dingo | HTTP status kodo tikrinimas | 404 vietoj 200 |
| 6 | Atsakymo formato pakeitimas | Zod tipo tikrinimas | Masyvas vietoj objekto |
| 7 | Auth sutrikimas | Antraštės testas | 401 kur turėtų būti 200 |
| 8 | CRUD sutrikimas | POST/PUT/DELETE statusas | 500 vietoj 201 |
| 9 | Duomenų regresija | Fixture palyginimas | "Budapest" vietoj null |
| 10 | Atsakymo laiko pablogėjimas | Response time slenkstis | 5000ms vietoj 200ms |
| +1 | Content-type | Antraštės tikrinimas | text/html vietoj JSON |

---

## 17. Testų valdymo aspektai

### Ką mato Test Manager Allure ataskaitoje?

1. **Dashboard** — bendras pass/fail santykis, tendencijų grafikas
2. **Suites** — sugrupuoti testai (REST / GraphQL)
3. **Behaviors** — Epic → Feature → Story hierarchija
4. **Timeline** — lygiagrečio vykdymo vizualizacija (koks greitis)
5. **Categories** — klaidų tipai (Product defect, Test defect)
6. **Retries** — flaky testų identifikavimas
7. **Duration** — kuris testas lėčiausias

### Atsekamumas (Traceability)

Allure ataskaitoje kiekvienas testas turi:
- **Epic** — kuriam dideliam funkciniam srityje priklauso
- **Feature** — kuris API endpoint
- **Story** — tiksliai koks elgesys
- **Severity** — critical / normal
- **Parameters** — Response time

Vėliau galima papildyti issue tracker nuorodomis:
```typescript
await allure.link('https://jira.example.com/browse/PROJ-123', 'PROJ-123', 'issue');
```

### Kaina

**$0** — visi komponentai yra nemokami ir atviro kodo:
- Playwright (MIT licencija)
- Allure (Apache 2.0)
- Zod (MIT)
- GitHub Actions (nemokamai viešoms saugykloms)

---

## 18. Pilnas duomenų srautas — kas ką kviečia ir kodėl

```
┌────────────────────────────────────────────────────────────────┐
│  playwright.config.ts                                          │
│  "Kur yra testai? Kokiu URL siųsti? Kas generuoja ataskaitas?"│
│  Nustato: testDir, baseURL, reporter, parallel, retry          │
└────────────────────┬───────────────────────────────────────────┘
                     │ paleidžia
                     ▼
┌────────────────────────────────────────────────────────────────┐
│  users.spec.ts / countries.spec.ts                             │
│  "Koks testo scenarijus?"                                      │
│  Turi: describe, beforeEach, test blokus (AAA)                 │
│                                                                │
│  Importuoja:                                                   │
│  ┌─────────────────┐  ┌───────────────┐  ┌──────────────────┐ │
│  │ API Object      │  │ Fixture       │  │ Schema           │ │
│  │ (ką kviesti?)   │  │ (ko tikėtis?) │  │ (kokia turi būti)│ │
│  └────────┬────────┘  └───────────────┘  └──────────────────┘ │
│           │  + allure.helper.ts (metaduomenys + laikas)        │
└───────────┼────────────────────────────────────────────────────┘
            │ kviečia
            ▼
┌────────────────────────────────────────────────────────────────┐
│  UsersApi.ts / CountriesGraphQLApi.ts                          │
│  "Kaip iškviesti API?"                                         │
│  Turi: metodus (getUsers, getCountryByCode, ir kt.)            │
│                                                                │
│  Paveldi: iš BaseApiClient                                     │
│  ┌──────────────────────────────┐                              │
│  │ BaseApiClient.ts             │                              │
│  │ this.request (HTTP klientas) │                              │
│  │ getDefaultHeaders()          │──→ auth.helper.ts (tokenas)  │
│  │ graphqlRequest()             │                              │
│  └──────────────────────────────┘                              │
│                                                                │
│  GraphQL API Object papildomai:                                │
│  └── importuoja: countries.queries.ts                          │
│                   └── užklausų eilutės + fragmentai             │
└────────────────────────────────────────────────────────────────┘
            │ siunčia HTTP užklausą
            ▼
┌────────────────────────────────────────────────────────────────┐
│  Išorinė API (JSONPlaceholder / Countries API)                 │
│  Atsako: JSON body + status kodas + antraštės                  │
└────────────────────────────────────────────────────────────────┘
            │ atsakymas grįžta
            ▼
┌────────────────────────────────────────────────────────────────┐
│  Spec failas — ASSERT dalis                                    │
│  Tikrinimai:                                                   │
│  1. Status kodas   → expect(response.status()).toBe(200)       │
│  2. Body reikšmės  → expect(user.name).toBe(Fixture.name)     │
│  3. Schema         → expect(() => Schema.parse(body)).not...   │
│  4. Laikas         → expect(duration).toBeLessThan(2000)      │
│  5. Antraštės      → expect(contentType).toContain('json')    │
└────────────────────────────────────────────────────────────────┘
            │ rezultatas
            ▼
┌────────────────────────────────────────────────────────────────┐
│  Reporter (apibrėžti playwright.config.ts)                     │
│  ├── list         → konsolės išvestis (✓ / ✘ + laikas)         │
│  ├── html         → playwright-report/ (HTML failai)           │
│  └── allure       → allure-results/ (JSON failai)              │
│                      └── allure serve → naršyklės dashboard    │
└────────────────────────────────────────────────────────────────┘
```

---

> **Sveikiname!** Jei pasiekėte šią vietą, jau suprantate viską, ko reikia šiai karkaso sistemai. Kitas žingsnis: parašykite savo pirmąjį testą pagal [Struktūra ir kasdienis darbas](./02-STRUCTURE-AND-DAILY-WORK.lt.md) dokumentą.
