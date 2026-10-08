# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Front-end only for Traccar GPS tracking platform: React 19 + MUI + MapLibre SPA built with Vite, plain JavaScript (`.js`/`.jsx`, no TypeScript sources). Talks to a Traccar server over REST (`/api/*`) and a WebSocket (`/api/socket`). Backend lives in the separate `traccar/traccar` repo.

## Commands

```bash
npm install
npm start          # Vite dev server on :3000, proxies /api and /api/socket to TRACCAR_SERVER
npm run build      # production bundle into build/
npm run lint       # eslint, --max-warnings 0 (CI fails on any warning)
npm run lint:fix
```

There is no test suite. CI (`.github/workflows`) runs only `npm run build` and `npm run lint`. The dev proxy target comes from `TRACCAR_SERVER` in `.env.local` (git-ignored), defaulting to `http://localhost:8082`; a reachable Traccar server is required for the dev server to work.

Formatting is Prettier via ESLint (`singleQuote`, `printWidth: 100`).

## Architecture

**Bootstrap chain** (`src/index.jsx`): Redux `Provider` → `LocalizationProvider` → `AppThemeProvider` → `ServerProvider` (fetches `/api/server` before anything renders) → `BrowserRouter` → `Navigation`.

**Routing** (`src/Navigation.jsx`): all routes declared here; nearly every page is `lazy()`-loaded. Authenticated routes nest under `App.jsx`, which fetches `/api/session` (redirects to `/login` or `/register` on failure), enforces terms acceptance, and mounts the background controllers: `SocketController` (WebSocket live updates for devices/positions/events/logs, alarm sounds), `CachingController` (preloads groups, drivers, maintenances, calendars, geofences into the store), `UpdateController` (PWA updates), `MotionController`.

**Source layout by feature**: `main/` (live map + device list home page), `map/` (map layers), `reports/`, `settings/` (CRUD pages for server entities), `other/` (replay, geofences, event/position detail, etc.), `login/`, `common/` (shared components, `attributes/` hooks describing known attribute keys, `util/`, `theme/`), `store/` (Redux Toolkit slices).

**State**: Redux Toolkit slices in `src/store/`, each exporting `xxxActions` re-exported from `store/index.js`. `session` slice holds `server`, `user`, and live `positions`. `throttleMiddleware.js` batches high-frequency `devices/update` and `session/updatePositions` actions when socket traffic exceeds ~3/sec — keep that in mind when adding actions that should flow through it.

**API calls & errors** (`src/reactHelper.js`, `common/util/fetchOrThrow.js`):
- Use `fetchOrThrow` (throws with response text on non-OK) rather than raw `fetch` for mutations.
- Wrap async handlers in `useCatch` / `useCatchCallback`; for effect-time loading use `useAsyncTask(async ({ signal }) => ..., deps)` (abortable, may return a cleanup fn). All three route errors to the `messages` slice, shown as snackbars by `MessageHandler`. ESLint's exhaustive-deps rule is configured to check `useCatchCallback` / `useAsyncTask` deps.

**Settings pages pattern**: edit pages wrap `settings/components/EditItemView` with an `endpoint` (e.g. `"groups"`), which handles GET/POST/PUT against `/api/<endpoint>`; list pages use `CollectionActions` / `CollectionFab`. Custom per-entity attributes are edited via `EditAttributesAccordion` using definitions from `common/attributes/use*Attributes.js`.

**Map** (`src/map/`): `map/core/MapView.jsx` creates a single module-level MapLibre `map` instance shared app-wide (the DOM element is reattached, not recreated). Map features are React components that render `null` and add/remove sources, layers, or controls in effects, gated on `useMapReady()` — follow `map/MapScale.js` as a minimal example. Map styles/providers are in `map/core/useMapStyles.js`; marker images preloaded via `map/core/preloadImages.js`.

**Preferences**: read user/server settings with `usePreference(key)` / `useAttributePreference(key)` (`common/util/preferences.js`), which resolve user vs. server values and honor `server.forceSettings`. Unit/format conversions live in `common/util/converter.js` and `formatter.js`.

**Localization**: strings live in `src/resources/l10n/*.json`; use `const t = useTranslation()` from `common/components/LocalizationProvider`. Only add/edit keys in `en.json` — other locale files are pulled from Transifex (`.tx/config`, `translation.yml` workflow) and overwritten. Keys are prefixed by area (`shared*`, `device*`, `settings*`, `report*`, …).

**Native app bridge**: `common/components/NativeInterface.js` handles messaging with the Traccar mobile app wrapper (login tokens, push notifications).

**Theming / styles**: MUI theme in `common/theme/`; component styles use `makeStyles` from `tss-react/mui`. RTL supported via `stylis-plugin-rtl`.

`simple/index.html` is a standalone, unrelated minimal demo client (CDN React/MapLibre) — not part of the Vite build.
