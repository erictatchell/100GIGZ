# Frontend Architecture

This app is a raw HTML + ES module frontend. The codebase is being moved away from a single monolithic `public/static/app.js` file toward small browser-native modules that can be imported directly without a build step.

## Current Shape

- `public/index.html` owns the page shell, modals, route sections, and static markup.
- `public/static/app.js` is still the composition/root runtime. It owns Firebase wiring, app state, event delegation, route rendering, and most UI renderers.
- `public/static/strings.js` owns static display text.
- `public/static/modules/core/utils.js` owns pure formatting, escaping, slugging, timestamp, route-id, and filename helpers.
- `tests/smoke.test.mjs` covers the first smoke-test layer for utilities, DOM contracts, delegated action hooks, SPA routes, and static module serving.

The old root-level app entry points were removed because Firebase Hosting serves `public/index.html`, which loads `/static/app.js`. Keeping duplicate app files made it unclear which one was live.

## Refactor Rules

1. Extract pure helpers first.
   Helpers with no DOM, Firebase, or global app state should live under `public/static/modules/core/`.

2. Extract renderers by feature next.
   Good future boundaries are:
   - `public/static/modules/archive/` for trips, folders, media rows, and mobile cards.
   - `public/static/modules/social/` for comments, replies, likes, wall posts, and feed cards.
   - `public/static/modules/profile/` for profile page rendering and editing.
   - `public/static/modules/vault/` for the vault gate, intro video, and legal modal.

3. Keep state ownership explicit.
   Do not let extracted modules mutate `public/static/app.js` globals directly. Pass state into renderers and return markup, or pass a small service object for side effects.

4. Keep event delegation centralized until features are fully extracted.
   `public/static/app.js` should remain the event wiring shell while modules are peeled off. This avoids duplicate listeners and keeps interaction behavior stable.

5. Comment exported functions.
   New module functions should include a short comment describing purpose and the main caller/feature area. Existing monolith functions should be documented as they are moved.

## Smoke Tests

Run the syntax checks:

```powershell
node --check server.js
node --check public\static\app.js
node --check public\static\strings.js
node --check public\static\modules\core\utils.js
node --check functions\index.js
```

Run the smoke tests directly:

```powershell
node --preserve-symlinks --input-type=module -e "await import('./tests/smoke.test.mjs')"
```

Package scripts are also available:

```powershell
npm run check
npm run smoke
npm test
```

In the Codex sandbox, `npm` itself may fail while resolving parent paths. The direct `node --preserve-symlinks ...` command is the verified fallback.

## What The Smoke Tests Guard

- Core utility behavior.
- `public/static/app.js` imports the extracted utility module instead of redefining those helpers.
- Hard `document.getElementById(...)` lookups still match `public/index.html`, except explicit optional legacy hooks.
- Critical delegated `data-action` interactions are still present in rendered/static source.
- The local preview server returns `/api/health`, SPA routes such as `/feed`, `public/static/app.js`, and extracted module files.
