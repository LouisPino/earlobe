# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Earlobe (earlobe.ca) is a static multi-page website listing experimental music and sound art events in Toronto. There is no build step, no bundler, and no package manager — everything runs directly in the browser using native ES modules and CDN-loaded dependencies.

## Running locally

Open the files directly in a browser, or use any static file server:

```bash
npx serve .
# or
python3 -m http.server
```

Because all JS files use `import`/`export` (ES modules), they must be served over HTTP — opening `index.html` as a `file://` URL will fail with CORS errors.

## Architecture

### No build pipeline

There is no `package.json`, no bundler, no TypeScript, and no framework. All JavaScript is plain ES modules loaded directly via `<script type="module">`.

### Firebase backend

All data is stored in Firebase (Firestore + Storage + Auth). The Firebase config is in `dbScript.js` — the API keys are intentionally public (Firebase web keys are not secrets; security is enforced through Firestore rules).

All database functions are exported from `dbScript.js` and imported by page scripts. `ensureAuth()` signs in anonymously before any Firestore read to satisfy auth rules.

### Collections

- `event` — submitted events; `confirmed: false` until approved by admin
- `venue` — venue records; `approved: false` until reviewed by admin
- `archive` — past event archive entries

### Page / script structure

Each HTML page has a corresponding JS file:

| Page | Script | Purpose |
|---|---|---|
| `index.html` | `script.js` + `calendar.js` | Event listing + FullCalendar widget |
| `submit.html` | `script.js` | Public event submission form |
| `admin.html` | `admin.js` + `script.js` | Admin dashboard (event/venue review) |
| `edit.html` | `edit.js` | Admin event edit/approve form |
| `event.html` | `event.js` | Public single-event detail page |
| `venues.html` | `venues.js` | Public venues list |
| `archive.html` | `archive.js` | Past events archive |

`layout.js` is loaded on every page — it fetches `header.html` and injects it into `#site-header`, then wires up the mobile burger menu.

`dbScript.js` is the data layer — imported by all page scripts, never directly loaded in HTML (except `index.html` where it is loaded to make `fetchEvents` available to `calendar.js`).

### Admin authentication

Admin access uses a client-side password gate (`admin.js`) with `sessionStorage`. The password (`Earl0be2025`) is visible in source — this is intentional; real security is in Firestore rules. The `isAdmin` flag in `script.js` is set by checking `window.location.pathname.includes("admin")`.

### FullCalendar

Loaded from CDN (`https://cdn.jsdelivr.net/npm/fullcalendar@6.1.20/index.global.min.js`). `calendar.js` imports `fetchEvents` from `dbScript.js` at runtime and renders a month grid where days with approved events are highlighted. Clicking a future date with events scrolls the list; clicking a past date with events navigates to `archive.html`.

### Event card / venue lookup

`createEventCard()` in `script.js` resolves venue data live from Firestore by `venueId`. If the venue has been deleted, it falls back to the inline `event.venue` object stored at submission time.

### Deployment

The site is deployed to GitHub Pages. The `CNAME` file sets the custom domain to `earlobe.ca`. There is no CI — pushing to `main` publishes automatically.
