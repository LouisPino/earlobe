# Database

Earlobe uses Firebase (Firestore + Storage + Auth). All database access goes through `dbScript.js`, which exports named functions used by page scripts.

## Authentication

Anonymous sign-in is required before any Firestore read. `ensureAuth()` in `dbScript.js` calls `signInAnonymously` and caches the promise so it only runs once per session. All `fetch*` functions call `ensureAuth()` at the top.

## Collections

### `event`

Submitted events. Each document contains:

| Field | Type | Notes |
|---|---|---|
| `event_name` | string \| null | Name of the event |
| `performers` | string \| null | Performing artists; at least one of `event_name` or `performers` is required |
| `date` | string | `YYYY-MM-DD` |
| `start_time` | string | `HH:MM` (24h) |
| `end_time` | string \| null | `HH:MM` |
| `doors_time` | string \| null | `HH:MM` |
| `venueId` | string | Firestore doc ID of the associated venue |
| `venue` | object \| null | Inline venue snapshot (fallback if venue is later deleted) |
| `attendance` | string | `"all_ages"`, `"19_plus"`, or `"other"` |
| `attendance_other` | string \| null | Free-text attendance note when `attendance === "other"` |
| `cost` | string \| null | Free-text cost string (e.g. `"🌀Free"`, `"💲$20"`) |
| `links` | string \| null | Comma-separated `Label - URL` pairs |
| `description` | string \| null | |
| `email` | string | Submitter contact |
| `imageUrl` | string \| null | Firebase Storage download URL; set to `null` when poster is deleted by admin |
| `confirmed` | boolean | `false` on creation; set to `true` by admin on approval |
| `createdAt` | Timestamp | Set at submission time |

### `venue`

Venue records. Each document contains:

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `address` | string | |
| `accessibility` | string | Free-text description |
| `accessibilityEmoji` | string \| null | One of `♿️`, `☑️`, `📶`, `❓` |
| `accessLink` | string \| null | URL to detailed accessibility info |
| `mapLink` | string \| null | URL to map (e.g. Google Maps) |
| `link` | string \| null | Venue website |
| `notes` | string \| null | Admin notes |
| `approved` | boolean | `false` when created by a public submitter; `true` when approved by admin (or created directly by admin) |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | Set on admin save |

### `archive`

Past event archive entries. Each document contains:

| Field | Type | Notes |
|---|---|---|
| `title` | string | Expected format: `"Month Nth, YYYY"` (e.g. `"September 1st, 2025"`) — used for grouping by month |
| `links` | string | URL to the archived event |
| `createdAt` | Timestamp | Set on initial creation |
| `updatedAt` | Timestamp | Set when an existing archive entry's link is updated |

## Storage

Event images are uploaded to Firebase Storage under `images/<timestamp>-<filename>`. The public download URL is stored as `imageUrl` on the event document. Deleting a poster in the admin edit form sets `imageUrl` to `null` on save — the Storage file itself is not deleted.

## Key functions (`dbScript.js`)

| Function | Description |
|---|---|
| `fetchEvents()` | All events (confirmed + unconfirmed) |
| `fetchVenues()` | All venues sorted by name (ignores leading "The") |
| `fetchVenuesWithId()` | Same but returns `{ data, id }` objects |
| `fetchVenueById(id)` | Single venue by Firestore doc ID; returns `null` if not found |
| `getEventById(id)` | Single event by Firestore doc ID; returns `null` if not found |
| `addEvent(obj)` | Creates event with `confirmed: false` |
| `addVenue(obj)` | Creates venue |
| `addArchive(obj)` | Upserts archive entry by title — updates `links` if a doc with matching `title` exists, otherwise creates new |
| `updateEvent(id, data)` | Partial update on an event |
| `updateVenue(id, data)` | Partial update on a venue |
| `deleteEventById(id)` | Deletes an event document |
| `deleteVenueById(id)` | Deletes a venue document |
| `uploadImage(file)` | Uploads to Storage, returns download URL |
| `getUnapprovedEventCount()` | Count of events with `confirmed === false` |
