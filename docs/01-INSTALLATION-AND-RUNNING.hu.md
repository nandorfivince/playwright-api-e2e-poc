# Telepítés és futtatás

## Tartalomjegyzék

- [1. Előfeltételek telepítése](#1-előfeltételek-telepítése)
- [2. Projekt telepítés (klónozás után)](#2-projekt-telepítés-klónozás-után)
- [3. Tesztek futtatása — terminálból](#3-tesztek-futtatása--terminálból)
- [4. Eredmények megtekintése](#4-eredmények-megtekintése)
- [5. Docker-ből futtatás](#5-docker-ből-futtatás)
- [6. Gyors referencia — parancs táblázat](#6-gyors-referencia--parancs-táblázat)

---

## 1. Előfeltételek telepítése

### Node.js (v20+)

**macOS (Homebrew):**
```bash
brew install node@20
```

**Windows:**
Töltsd le a telepítőt a [nodejs.org](https://nodejs.org/) oldalról, vagy használj Chocolatey-t:
```powershell
choco install nodejs-lts
```

**Verzió ellenőrzés:**
```bash
node -v    # v20.x.x
npm -v     # 10.x.x
```

### Allure CLI (riportokhoz)

**macOS (Homebrew):**
```bash
brew install allure
```

**npm-mel (minden OS — legegyszerűbb):**
```bash
npm install -g allure-commandline
```

**Windows (Scoop):**
```powershell
scoop install allure
```

**Verzió ellenőrzés:**
```bash
allure --version
```

### Docker (opcionális — konténerizált futtatáshoz)

**macOS:**
Töltsd le a [Docker Desktop](https://www.docker.com/products/docker-desktop/) alkalmazást.

**Windows:**
Töltsd le a [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) alkalmazást. WSL 2 backend szükséges.

**Ellenőrzés:**
```bash
docker --version
docker compose version
```

---

## 2. Projekt telepítés (klónozás után)

```bash
# Belépés a projekt mappába
cd playwright-api-e2e-poc

# Függőségek telepítése
npm install
```

Ennyi — nincs szükség Playwright böngészők telepítésére, mert ez tisztán API teszt (nincs browser).

---

## 3. Tesztek futtatása — terminálból

### Összes teszt

```bash
npm test
```

### Típus szerint

```bash
# Csak REST tesztek
npm run test:rest

# Csak GraphQL tesztek
npm run test:graphql
```

### Tag szerint

```bash
# Smoke tesztek (4 db — gyors, biztonságos, happy-path)
npm run test:smoke

# Regression tesztek (6 db — séma, CRUD, auth, content-type)
npm run test:regression

# Demo tesztek (3 db — szándékosan bukó, hibadetektálás bemutató)
npm run test:demo
```

### Egyetlen konkrét teszt futtatása

```bash
# Fájlnév alapján
npx playwright test tests/rest/users.spec.ts

# Teszt név alapján (részleges egyezés)
npx playwright test -g "shouldReturnHungaryDetails"

# Projekt + tag kombinálva
npx playwright test --project=rest-api --grep @smoke
npx playwright test --project=graphql-api --grep @regression
```

### Részletes konzol kimenet

```bash
# Lista nézet (minden teszt neve + idő)
npx playwright test --reporter=list

# Verbose mód
npx playwright test --reporter=line
```

---

## 4. Eredmények megtekintése

### Playwright HTML riport

```bash
# Riport generálás + megnyitás böngészőben
npm run test:report

# Vagy manuálisan
npx playwright show-report playwright-report
```

### Allure riport

```bash
# Tesztek futtatása (allure-results/ mappa feltöltődik)
npm test

# Allure riport megnyitása böngészőben
npm run test:allure

# Vagy manuálisan
allure serve allure-results

# Statikus riport generálás (pl. CI-hez)
allure generate allure-results -o allure-report --clean
allure open allure-report
```

### Allure Trend (futtatások közötti előzmények)

Az Allure képes trend grafikonokat megjeleníteni (pass/fail arány, futási idő, retry-ok) több futtatás között. Ehhez az előző riport history mappáját kell visszamásolni a következő futás eredményei közé.

```bash
# 1. Tesztek futtatása + riport generálás
npm test
allure generate allure-results -o allure-report --clean

# 2. A KÖVETKEZŐ futtatás előtt — history visszamásolása
cp -r allure-report/history allure-results/history

# 3. Tesztek újrafuttatása
npm test

# 4. Riport generálás — most már megjelennek a trend grafikonok
allure generate allure-results -o allure-report --clean
allure open allure-report
```

> **Megjegyzés:** A `npm run test:allure` az `allure serve`-öt használja, ami ideiglenes riportot generál — nem menti a history-t. Trendekhez mindig az `allure generate` + `allure open` párost használd.

---

## 5. Docker-ből futtatás

### Összes teszt

```bash
docker compose up --build
```

### Tag szerint Dockerből

```bash
# Smoke tesztek
docker compose run api-tests npx playwright test --grep @smoke

# Regression
docker compose run api-tests npx playwright test --grep @regression

# Demo (szándékosan bukó)
docker compose run api-tests npx playwright test --grep @demo
```

### Típus szerint Dockerből

```bash
# Csak REST
docker compose run api-tests npx playwright test tests/rest/

# Csak GraphQL
docker compose run api-tests npx playwright test tests/graphql/
```

### Egyetlen teszt Dockerből

```bash
docker compose run api-tests npx playwright test -g "shouldReturnHungaryDetails"
```

### Docker eredmények

A `docker-compose.yml` volume-ok automatikusan kihozzák az eredményeket:
- `./allure-results/` — Allure adatok
- `./playwright-report/` — HTML riport

Futtatás után a riportok megtekinthetők:

```bash
# Allure (Docker futtatás után, host gépen)
allure serve allure-results

# Playwright HTML
npx playwright show-report playwright-report
```

---

## 6. Gyors referencia — parancs táblázat

| Mit akarok? | Parancs |
|------------|---------|
| Telepítés | `npm install` |
| Összes teszt | `npm test` |
| Csak REST | `npm run test:rest` |
| Csak GraphQL | `npm run test:graphql` |
| Smoke tesztek | `npm run test:smoke` |
| Regression tesztek | `npm run test:regression` |
| Demo (bukó) tesztek | `npm run test:demo` |
| Egy konkrét teszt | `npx playwright test -g "tesztNév"` |
| Projekt + tag | `npx playwright test --project=rest-api --grep @smoke` |
| Playwright riport | `npm run test:report` |
| Allure riport | `npm run test:allure` |
| Docker — összes | `docker compose up --build` |
| Docker — smoke | `docker compose run api-tests npx playwright test --grep @smoke` |
| Docker — egy teszt | `docker compose run api-tests npx playwright test -g "tesztNév"` |
