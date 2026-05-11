# Dixit Firebase MVP

Online multiplayer Dixit built with Vite + React + TypeScript + SCSS and Firebase Firestore.

## Implemented MVP features

- Lobby create/join via random lobby code
- Name-only identity persisted in browser
- 3 to 10 player lobby validation
- Core game loop:
  - storyteller clue + storyteller card
  - other players submit one card
  - reveal and vote
  - official Dixit scoring
  - redraw and rotate storyteller
- Non-reused deck dealing from shuffled draw pile
- Deck-exhaustion game ending with winner by highest score
- Realtime state sync through Firestore snapshots
- Transaction-protected critical game actions

## Stack

- React 19 + TypeScript
- Vite
- SCSS
- Firebase Firestore
- GitHub Pages deployment workflow

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill your Firebase Web App values:

```bash
cp .env.example .env
```

3. Start dev server:

```bash
npm run dev
```

## Firebase setup

1. Create a Firebase project.
2. Enable Firestore.
3. Create a Web app and copy config values into `.env`.
4. Apply Firestore rules from `firestore.rules`.

The included rules are intentionally permissive for rapid MVP iteration. Lock them down before production use.

## GitHub Pages deployment

Deployment is configured in `.github/workflows/deploy.yml`.

Set these GitHub repository secrets:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`

Then:

1. Push to `main`
2. GitHub Actions builds and deploys `dist` to Pages
3. In repository settings, confirm Pages source is GitHub Actions

## Scripts

- `npm run dev` - local development
- `npm run lint` - ESLint checks
- `npm run build` - typecheck + production build
- `npm run preview` - preview production build locally
