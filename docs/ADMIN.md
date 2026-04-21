# Admin

## Accessing the admin area

Navigate to `/admin.html`. A password modal appears on load. The password is `Earl0be2025` and is stored in `sessionStorage` under the key `admin_unlocked` after a successful entry. This is UI-only friction — it is not real authentication. All actual security must be enforced through Firestore rules.

The `isAdmin` flag used in `script.js` is set simply by checking `window.location.pathname.includes("admin")`, so any page at a path containing "admin" gets admin-mode rendering (unconfirmed events visible, EDIT/DELETE controls shown).

## Dashboard (`admin.html` + `admin.js`)

On load, the dashboard shows:
- Count of events awaiting approval (`confirmed === false`)
- Count of venues awaiting approval (`approved === false`)
- A link to the event listing (rendered by `script.js` in admin mode)
- A venue management section (rendered by `admin.js`)
- An archive submission form

## Approving events

1. In the event listing, unconfirmed events are visually distinguished (`.unconfirmed` class).
2. Click **EDIT** on an event → navigates to `edit.html?id=<docId>`.
3. Review and correct all fields.
4. Optionally delete the poster image: click "Delete Poster" → confirm in the modal → the image src is cleared in the form. On save, `imageUrl` is written as `null`.
5. Click **Approve** → sets `confirmed: true` and writes all form fields to Firestore → redirects to `admin.html`.

Deleting an event from the listing triggers a confirmation modal before calling `deleteEventById`.

## Approving venues

The venues section in `admin.html` renders all venues (approved and unapproved) as editable cards. For each venue:

- Fill in name, address, accessibility text, accessibility emoji (radio), access link, map link, website link, and notes.
- Click **Approve Venue** → calls `updateVenue` with `approved: true` and all form fields.
- Click **Delete Venue** → triggers a confirmation modal before calling `deleteVenueById`.

Unapproved venues are styled with the `.unapproved` class; approved ones get `.approved`.

## Adding venues directly

Click **Add Venue** (opens a modal) → fill in fields → click **Create Venue**. Venues created this way are set to `approved: true` immediately.

## Archive submissions

The archive form on `admin.html` takes a title and a link. `addArchive` performs an upsert — if a document with the same `title` already exists it updates the `links` field; otherwise it creates a new document.

The title is expected to follow the format `"Month Nth, YYYY"` (e.g. `"September 1st, 2025"`) because `archive.js` parses the title string to group entries by month on the archive page.
