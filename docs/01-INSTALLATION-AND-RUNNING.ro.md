# Instalare și rulare

## Cuprins

- [1. Instalarea cerințelor preliminare](#1-instalarea-cerințelor-preliminare)
- [2. Instalarea proiectului (după clonare)](#2-instalarea-proiectului-după-clonare)
- [3. Rularea testelor — din terminal](#3-rularea-testelor--din-terminal)
- [4. Vizualizarea rezultatelor](#4-vizualizarea-rezultatelor)
- [5. Rulare din Docker](#5-rulare-din-docker)
- [6. Referință rapidă — tabel de comenzi](#6-referință-rapidă--tabel-de-comenzi)

---

## 1. Instalarea cerințelor preliminare

### Node.js (v20+)

**macOS (Homebrew):**
```bash
brew install node@20
```

**Windows:**
Descărcați installerul de pe [nodejs.org](https://nodejs.org/), sau folosiți Chocolatey:
```powershell
choco install nodejs-lts
```

**Verificare versiune:**
```bash
node -v    # v20.x.x
npm -v     # 10.x.x
```

### Allure CLI (pentru rapoarte)

**macOS (Homebrew):**
```bash
brew install allure
```

**Cu npm (toate OS-urile — cel mai simplu):**
```bash
npm install -g allure-commandline
```

**Windows (Scoop):**
```powershell
scoop install allure
```

**Verificare versiune:**
```bash
allure --version
```

### Docker (opțional — pentru rulare în container)

**macOS:**
Descărcați [Docker Desktop](https://www.docker.com/products/docker-desktop/).

**Windows:**
Descărcați [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/). Necesită backend WSL 2.

**Verificare:**
```bash
docker --version
docker compose version
```

---

## 2. Instalarea proiectului (după clonare)

```bash
# Intrare în directorul proiectului
cd playwright-api-e2e-poc

# Instalare dependențe
npm install
```

Atât — nu este nevoie de instalarea browserelor Playwright, deoarece aceasta este testare API pură (fără browser).

---

## 3. Rularea testelor — din terminal

### Toate testele

```bash
npm test
```

### După tip

```bash
# Doar teste REST
npm run test:rest

# Doar teste GraphQL
npm run test:graphql
```

### După tag

```bash
# Teste smoke (4 — rapide, sigure, happy-path)
npm run test:smoke

# Teste regression (6 — schemă, CRUD, auth, content-type)
npm run test:regression

# Teste demo (3 — eșuează intenționat, demonstrație detectare erori)
npm run test:demo
```

### Rularea unui singur test specific

```bash
# După numele fișierului
npx playwright test tests/rest/users.spec.ts

# După numele testului (potrivire parțială)
npx playwright test -g "shouldReturnHungaryDetails"

# Proiect + tag combinat
npx playwright test --project=rest-api --grep @smoke
npx playwright test --project=graphql-api --grep @regression
```

### Ieșire detaliată în consolă

```bash
# Vizualizare listă (numele fiecărui test + durata)
npx playwright test --reporter=list

# Mod verbose
npx playwright test --reporter=line
```

---

## 4. Vizualizarea rezultatelor

### Raport HTML Playwright

```bash
# Generare raport + deschidere în browser
npm run test:report

# Sau manual
npx playwright show-report playwright-report
```

### Raport Allure

```bash
# Rulare teste (directorul allure-results/ se populează)
npm test

# Deschidere raport Allure în browser
npm run test:allure

# Sau manual
allure serve allure-results

# Generare raport static (ex. pentru CI)
allure generate allure-results -o allure-report --clean
allure open allure-report
```

### Allure Trend (istoricul între rulări)

Allure poate afișa grafice de tendință (raport pass/fail, durata, reîncercări) între mai multe rulări de teste. Pentru aceasta, istoricul din raportul anterior trebuie copiat în rezultatele următoarei rulări.

```bash
# 1. Rulare teste + generare raport
npm test
allure generate allure-results -o allure-report --clean

# 2. Înainte de URMĂTOAREA rulare — copierea istoricului înapoi
cp -r allure-report/history allure-results/history

# 3. Rulare teste din nou
npm test

# 4. Generare raport — acum apar graficele de tendință
allure generate allure-results -o allure-report --clean
allure open allure-report
```

> **Notă:** `npm run test:allure` folosește `allure serve` care generează un raport temporar — nu păstrează istoricul. Pentru tendințe, folosiți întotdeauna `allure generate` + `allure open`.

---

## 5. Rulare din Docker

### Toate testele

```bash
docker compose up --build
```

### După tag din Docker

```bash
# Teste smoke
docker compose run api-tests npx playwright test --grep @smoke

# Regression
docker compose run api-tests npx playwright test --grep @regression

# Demo (eșuează intenționat)
docker compose run api-tests npx playwright test --grep @demo
```

### După tip din Docker

```bash
# Doar REST
docker compose run api-tests npx playwright test tests/rest/

# Doar GraphQL
docker compose run api-tests npx playwright test tests/graphql/
```

### Un singur test din Docker

```bash
docker compose run api-tests npx playwright test -g "shouldReturnHungaryDetails"
```

### Rezultate Docker

Volume-urile din `docker-compose.yml` exportă automat rezultatele:
- `./allure-results/` — date Allure
- `./playwright-report/` — raport HTML

După rulare, rapoartele pot fi vizualizate:

```bash
# Allure (după rulare Docker, pe mașina gazdă)
allure serve allure-results

# Playwright HTML
npx playwright show-report playwright-report
```

---

## 6. Referință rapidă — tabel de comenzi

| Ce vreau? | Comandă |
|-----------|---------|
| Instalare | `npm install` |
| Toate testele | `npm test` |
| Doar REST | `npm run test:rest` |
| Doar GraphQL | `npm run test:graphql` |
| Teste smoke | `npm run test:smoke` |
| Teste regression | `npm run test:regression` |
| Teste demo (eșuează) | `npm run test:demo` |
| Un test specific | `npx playwright test -g "numeleTestului"` |
| Proiect + tag | `npx playwright test --project=rest-api --grep @smoke` |
| Raport Playwright | `npm run test:report` |
| Raport Allure | `npm run test:allure` |
| Docker — toate | `docker compose up --build` |
| Docker — smoke | `docker compose run api-tests npx playwright test --grep @smoke` |
| Docker — un test | `docker compose run api-tests npx playwright test -g "numeleTestului"` |
