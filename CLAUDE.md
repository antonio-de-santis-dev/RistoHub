# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Panoramica del Progetto

**RistoHub** è un'applicazione web full-stack per la gestione di menù di ristoranti con condivisione tramite QR code. Generata con JHipster 8.11.0, usa Spring Boot 3.4.5 (Java 17) per il backend e Angular 19 per il frontend.

## Comandi Principali

### Sviluppo

```bash
# Avviare backend (Spring Boot su porta 8080)
./mvnw

# Avviare frontend (Angular dev server su porta 4200, con HMR)
./npmw start

# Avviare entrambi in contemporanea
npm run watch

# Backend in modalità debug (porta 8000)
npm run backend:debug
```

### Build

```bash
# Build produzione (JAR)
npm run java:jar:prod

# Build immagine Docker produzione
npm run java:docker:prod
```

### Test

```bash
# Test frontend (Jest, con coverage)
npm test

# Test frontend in watch mode
npm run test:watch

# Test backend (JUnit 5)
npm run backend:unit:test
```

### Linting e Formattazione

```bash
# ESLint
npm run lint
npm run lint:fix

# Prettier
npm run prettier:check
npm run prettier:format

# Checkstyle (Java)
npm run backend:nohttp:test
```

### Database / Docker

```bash
# Avviare PostgreSQL in Docker
npm run docker:db:up

# Fermare PostgreSQL
npm run docker:db:down
```

## Architettura

### Backend (Java / Spring Boot)

Struttura a layer classica JHipster:

- **`domain/`** — Entità JPA: `Menu`, `Portata`, `Prodotto`, `Allergene`, `ImmagineMenu`, `PiattoDelGiorno`. Chiavi UUID, cascading delete Menu → Portata → Prodotto.
- **`repository/`** — Spring Data JPA con query personalizzate (es. `findByRistoratoreIsCurrentUser()`).
- **`service/`** — Logica di business transazionale con mapping via MapStruct. `MenuCompletoService` aggrega il menù con tutte le entità correlate. `MenuService.checkOwnership()` verifica che il menù appartenga all'utente corrente.
- **`web/rest/`** — Controller REST. `MenuPublicResource` espone API pubbliche (senza auth) per la visualizzazione del menù via QR code.
- **`config/`** — Configurazione Spring (sicurezza, cache EhCache, database, Liquibase).

**Database:** H2 su file in dev (`./target/h2db/db/ristoHub`), PostgreSQL in prod. Le migrazioni sono gestite da Liquibase in `src/main/resources/db/changelog/`.

**Autenticazione:** Session-based (non JWT). `@Secured` per autorizzazione a livello di metodo.

### Frontend (Angular 19)

- **Standalone components** — Nessun NgModule; tutti i componenti sono standalone.
- **`app.routes.ts`** — Routing con lazy loading (`loadComponent` / `loadChildren`). Guard `UserRouteAccessService` per le rotte protette.
- **Route pubblica** — `/menu-public/:id` accessibile senza autenticazione (visualizzazione menù via QR).
- **Route protette principali** — `menu-wizard`, `menu-list`, `menu-view/:id`, `menu-cover-editor/:id`, `piatti-giorno-gestione`, `contatti-gestione`.
- **`app.config.ts`** — Providers globali (HTTP, i18n, interceptors).
- **Interceptors** — `core/interceptor/` per gestione chiamate HTTP.
- **i18n** — `@ngx-translate/core` con 5 lingue (Italiano default, EN, FR, DE, ES). File di traduzione in `src/main/webapp/i18n/{lang}/`.
- **Stile** — SCSS + Bootstrap 5.3.6 + ng-bootstrap.

### Configurazioni di Build

- Angular compila in `target/classes/static/` — servito direttamente da Spring Boot.
- Webpack custom in `webpack/webpack.custom.js` (BrowserSync su porta 9000, bundle analyzer in prod).
- Dev proxy definito in `webpack/proxy.conf.js` → backend su `http://localhost:8080`.

## Entità JDL

Il file `jhipster-jdl.jdl` definisce le relazioni tra entità. Per rigenerare codice dopo modifiche al JDL: `jhipster import-jdl jhipster-jdl.jdl`.

## Note Importanti

- **Pre-commit hooks** (Husky + lint-staged) eseguono Prettier automaticamente ad ogni commit.
- Le variabili CSS custom (`colorePrimario`, `coloreSecondario`) definiscono il tema visivo dell'app.
- Il Service Worker Angular è presente ma **disabilitato** per default (`ngsw-config.json`).
- `AbstractAuditingEntity` fornisce audit automatico (createdBy, createdDate, ecc.) su tutte le entità principali.
