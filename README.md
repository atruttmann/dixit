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
- [Embla Carousel](https://www.embla-carousel.com/) for swipeable card strips (`embla-carousel-react`)
- GitHub Pages deployment workflow

## Local setup

1. Install dependencies:

```bash
yarn install
```

2. Copy `.env.example` to `.env` and fill your Firebase Web App values:

```bash
cp .env.example .env
```

3. Start dev server:

```bash
yarn dev
```

## Firebase setup

1. Create a Firebase project.
2. Enable Firestore.
3. Create a Web app and copy config values into `.env`.
4. Apply Firestore rules from `firestore.rules`.

The included rules are intentionally permissive for rapid MVP iteration. Lock them down before production use.

### Card media (Firebase Storage)

The deck is built from files in your **default Storage bucket**, under the folder **`cards/`** (change with `VITE_FIREBASE_CARDS_STORAGE_PREFIX` in `.env`). Supported types include common **images** (`.png`, `.jpg`, `.webp`, …) and **videos** (`.mp4`, `.webm`, `.mov`, …). In the game UI, videos play **muted**, **loop**, and show **controls**; clicking the video uses the controls without selecting the card (use the card edge or the index badge to select).

1. In Firebase Console, open **Build → Storage** and create the bucket if needed.
2. Create a folder **`cards`** and upload your files. Nested subfolders are supported.
3. Set **Storage rules** so clients can read those files, for example:

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /cards/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

4. Set **`VITE_FIREBASE_STORAGE_BUCKET`** in `.env` to your bucket name (shown in Storage settings, often `PROJECT_ID.appspot.com`).

The host’s browser loads the file list when **Start game** runs; all players resolve the same media URLs from Storage when they open the game screen.

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

### Subfolder URL (e.g. `yoursite.com/dixit`)

If the app is not at the domain root, set **`VITE_BASE_PATH`** to that path with a **trailing slash** (e.g. `/dixit/`). The GitHub Action sets `VITE_BASE_PATH: /dixit/`; change it if your public path differs. Add the same to `.env` when running **`yarn build`** locally so assets and routes match production.

The build copies **`index.html`** to **`404.html`** so deep links like `/dixit/lobby/ABC` load the app on GitHub Pages (otherwise the server returns a plain 404).

**Router:** `BrowserRouter` uses Vite’s `base`; lobby links shared from the lobby screen include this prefix automatically.

## Scripts

- `yarn dev` - local development
- `yarn lint` - ESLint checks
- `yarn build` - typecheck + production build
- `yarn preview` - preview production build locally
