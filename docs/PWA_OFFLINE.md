# PWA and Offline Behaviour

## Objective

Provide an installable app-like experience while preserving the security of protected learning content.

## Installability (Phase 6.5.2A Verified)

Implemented via `public/manifest.webmanifest` and `index.html`:

- Application name: `BLS Course Companion`
- Short name: `BLS Companion`
- Description: `Physical-course companion for Basic Life Support training.`
- Icons:
  - `favicon.svg` (SVG mark with HeartPulse emblem)
  - `icon-192.png` (192×192 PNG)
  - `icon-512.png` (512×512 PNG)
  - `icon-maskable.png` (512×512 PNG maskable icon with safe zone)
- Theme colour: `#174f7a` (matching brand primary)
- Background colour: `#faf8f5` (warm background token)
- Display mode: `standalone`
- Orientation: natural device orientation across phone, tablet, and desktop (unconstrained)
- Relative `start_url` (`./`) and `scope` (`./`) ensuring seamless resolution at both local dev root (`/`) and GitHub Pages (`/bls/`)
- Mobile viewport: `width=device-width, initial-scale=1.0, viewport-fit=cover` enabling iOS safe-area handling.

## Application-shell caching (Phase 6.5.2A)

Managed by `public/sw.js` with policy logic in `src/pwa/pwa-policy.ts`.

Cache name: `bls-shell-v1`

Eligible for cache (static assets only):

- HTML entry shell (`index.html`)
- JavaScript bundles (hashed `/assets/*.js`)
- CSS bundles (hashed `/assets/*.css`)
- Manifest (`manifest.webmanifest`)
- Icons and favicons (`favicon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable.png`)
- Web fonts and static branding assets

## Protected dynamic content (Strictly Network-Only, Never Cached)

The fundamental privacy rule is: **Never cache authenticated Supabase application data.**

The service worker strictly excludes the following from Cache Storage and passes them directly to the network:

- All Supabase endpoints (`*.supabase.co`, `*.supabase.in`)
- REST API queries (`/rest/v1/*`)
- Database RPC invocations (`/rpc/*`, `/rest/v1/rpc/*`)
- Authentication endpoints (`/auth/v1/*`)
- Storage API and signed PDF URLs (`/storage/v1/*`)
- Supabase Edge Functions (`/functions/v1/*`)
- Any request with sensitive query tokens (`token=`, `apikey=`, `signature=`, `auth=`)
- Active quiz attempts and submitted learner answers
- Learner scoring, results, and item analysis
- Administrative reports and CSV exports

## Offline states

When offline:

- The application shell may open.
- A clear offline banner appears.
- Safe previously loaded navigation may remain visible.
- Protected resources do not open.
- New quiz attempts cannot start.
- Quiz submission should not be designed as offline-first in version 1.
- Administrative mutations are disabled.

## Active quiz and connectivity

Recommended first-release behaviour:

- Autosave requires online access.
- If connection fails, keep the current answer locally in memory.
- Show an unsaved warning.
- Retry when connectivity returns.
- Do not allow final submission until required answers are saved.
- The server timer remains authoritative.

## Service-worker updates

When a new build is available:

```text
A new version is available.
[Update now]
```

During an active quiz:

```text
An update is available and will be applied after submission.
```

Do not force-refresh during an active assessment.

## Cache invalidation

- Version application-shell assets by build hash.
- Remove obsolete caches on activation.
- Do not persist signed URLs.
- Clear relevant in-memory state on logout.
- Avoid broad runtime caching rules.

## Installation guidance

Provide a small help section for:

- Android Chrome
- Desktop Chrome or Edge
- iOS Safari where supported
- Removing the installed app
- Updating the app
- Offline limitations

## Future offline expansion

Only consider offline protected content if the project later adopts:

- Encrypted local storage
- Device-bound authorization
- Explicit expiry
- Remote revocation strategy
- Stronger native or managed-app packaging

This is out of scope for the initial release.
