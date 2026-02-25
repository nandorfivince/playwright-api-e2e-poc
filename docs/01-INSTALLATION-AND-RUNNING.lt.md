# Diegimas ir paleidimas

## Turinys

- [1. Būtinų komponentų diegimas](#1-būtinų-komponentų-diegimas)
- [2. Projekto diegimas (po klonavimo)](#2-projekto-diegimas-po-klonavimo)
- [3. Testų paleidimas — iš terminalo](#3-testų-paleidimas--iš-terminalo)
- [4. Rezultatų peržiūra](#4-rezultatų-peržiūra)
- [5. Paleidimas iš Docker](#5-paleidimas-iš-docker)
- [6. Greita nuoroda — komandų lentelė](#6-greita-nuoroda--komandų-lentelė)

---

## 1. Būtinų komponentų diegimas

### Node.js (v20+)

**macOS (Homebrew):**
```bash
brew install node@20
```

**Windows:**
Atsisiųskite diegimo programą iš [nodejs.org](https://nodejs.org/), arba naudokite Chocolatey:
```powershell
choco install nodejs-lts
```

**Versijos patikrinimas:**
```bash
node -v    # v20.x.x
npm -v     # 10.x.x
```

### Allure CLI (ataskaitoms)

**macOS (Homebrew):**
```bash
brew install allure
```

**Su npm (visos OS — paprasčiausias būdas):**
```bash
npm install -g allure-commandline
```

**Windows (Scoop):**
```powershell
scoop install allure
```

**Versijos patikrinimas:**
```bash
allure --version
```

### Docker (neprivaloma — konteineriuotam paleidimui)

**macOS:**
Atsisiųskite [Docker Desktop](https://www.docker.com/products/docker-desktop/).

**Windows:**
Atsisiųskite [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/). Reikalingas WSL 2 backend.

**Patikrinimas:**
```bash
docker --version
docker compose version
```

---

## 2. Projekto diegimas (po klonavimo)

```bash
# Įeiti į projekto katalogą
cd playwright-api-e2e-poc

# Priklausomybių diegimas
npm install
```

Viskas — nereikia diegti Playwright naršyklių, nes tai grynas API testavimas (be naršyklės).

---

## 3. Testų paleidimas — iš terminalo

### Visi testai

```bash
npm test
```

### Pagal tipą

```bash
# Tik REST testai
npm run test:rest

# Tik GraphQL testai
npm run test:graphql
```

### Pagal žymą

```bash
# Smoke testai (4 — greiti, saugūs, happy-path)
npm run test:smoke

# Regression testai (6 — schema, CRUD, auth, content-type)
npm run test:regression

# Demo testai (3 — tyčia nepavykstantys, klaidų aptikimo demonstracija)
npm run test:demo
```

### Vieno konkretaus testo paleidimas

```bash
# Pagal failo pavadinimą
npx playwright test tests/rest/users.spec.ts

# Pagal testo pavadinimą (dalinis atitikimas)
npx playwright test -g "shouldReturnHungaryDetails"

# Projektas + žyma kombinuojant
npx playwright test --project=rest-api --grep @smoke
npx playwright test --project=graphql-api --grep @regression
```

### Detali konsolės išvestis

```bash
# Sąrašo vaizdas (kiekvieno testo pavadinimas + laikas)
npx playwright test --reporter=list

# Verbose režimas
npx playwright test --reporter=line
```

---

## 4. Rezultatų peržiūra

### Playwright HTML ataskaita

```bash
# Ataskaitos generavimas + atidarymas naršyklėje
npm run test:report

# Arba rankiniu būdu
npx playwright show-report playwright-report
```

### Allure ataskaita

```bash
# Testų paleidimas (allure-results/ katalogas užpildomas)
npm test

# Allure ataskaitos atidarymas naršyklėje
npm run test:allure

# Arba rankiniu būdu
allure serve allure-results

# Statinės ataskaitos generavimas (pvz. CI)
allure generate allure-results -o allure-report --clean
allure open allure-report
```

### Allure tendencija (istorija tarp paleidimų)

Allure gali rodyti tendencijų grafikus (pass/fail santykis, trukmė, pakartojimas) tarp kelių testų paleidimų. Tam reikia nukopijuoti ankstesnės ataskaitos istoriją į kitų paleidimo rezultatus.

```bash
# 1. Testų paleidimas + ataskaitos generavimas
npm test
allure generate allure-results -o allure-report --clean

# 2. Prieš KITĄ paleidimą — istorijos kopijavimas atgal
cp -r allure-report/history allure-results/history

# 3. Testų paleidimas iš naujo
npm test

# 4. Ataskaitos generavimas — dabar rodomi tendencijų grafikai
allure generate allure-results -o allure-report --clean
allure open allure-report
```

> **Pastaba:** `npm run test:allure` naudoja `allure serve`, kuris generuoja laikiną ataskaitą — nesaugo istorijos. Tendencijoms visada naudokite `allure generate` + `allure open`.

---

## 5. Paleidimas iš Docker

### Visi testai

```bash
docker compose up --build
```

### Pagal žymą iš Docker

```bash
# Smoke testai
docker compose run api-tests npx playwright test --grep @smoke

# Regression
docker compose run api-tests npx playwright test --grep @regression

# Demo (tyčia nepavykstantys)
docker compose run api-tests npx playwright test --grep @demo
```

### Pagal tipą iš Docker

```bash
# Tik REST
docker compose run api-tests npx playwright test tests/rest/

# Tik GraphQL
docker compose run api-tests npx playwright test tests/graphql/
```

### Vienas testas iš Docker

```bash
docker compose run api-tests npx playwright test -g "shouldReturnHungaryDetails"
```

### Docker rezultatai

`docker-compose.yml` tomai automatiškai eksportuoja rezultatus:
- `./allure-results/` — Allure duomenys
- `./playwright-report/` — HTML ataskaita

Po paleidimo ataskaitas galima peržiūrėti:

```bash
# Allure (po Docker paleidimo, pagrindinėje mašinoje)
allure serve allure-results

# Playwright HTML
npx playwright show-report playwright-report
```

---

## 6. Greita nuoroda — komandų lentelė

| Ką noriu? | Komanda |
|-----------|---------|
| Diegimas | `npm install` |
| Visi testai | `npm test` |
| Tik REST | `npm run test:rest` |
| Tik GraphQL | `npm run test:graphql` |
| Smoke testai | `npm run test:smoke` |
| Regression testai | `npm run test:regression` |
| Demo (nepavykstantys) testai | `npm run test:demo` |
| Konkretus testas | `npx playwright test -g "testoPavadinimas"` |
| Projektas + žyma | `npx playwright test --project=rest-api --grep @smoke` |
| Playwright ataskaita | `npm run test:report` |
| Allure ataskaita | `npm run test:allure` |
| Docker — visi | `docker compose up --build` |
| Docker — smoke | `docker compose run api-tests npx playwright test --grep @smoke` |
| Docker — vienas testas | `docker compose run api-tests npx playwright test -g "testoPavadinimas"` |
