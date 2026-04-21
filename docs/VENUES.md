# Venues

## Venue sources

Venues enter the database two ways:

1. **Public submission** — when a user submits an event and selects "Add New Venue", a venue is created with `approved: false` and its Firestore doc ID is stored as `venueId` on the event.
2. **Admin creation** — admin can create a venue directly from the "Add Venue" modal on `admin.html`. These are created with `approved: true` immediately.

## Approval flow

Unapproved venues appear in the venue management section of `admin.html` (rendered by `admin.js`). The admin fills in or corrects all fields and clicks "Approve Venue", which calls `updateVenue` with `approved: true`.

Only approved venues appear in the public event submission form's venue dropdown (filtered in `script.js`: `venueOptions = venueOptionsResp.filter(v => v.data.approved)`).

Only approved venues appear on the public `venues.html` page (filtered in `venues.js`).

## Accessibility fields

Each venue has two complementary accessibility fields:

- `accessibilityEmoji` — one of `♿️` (accessible), `☑️` (accessible with caveats), `📶` (stairs / not accessible), `❓` (unknown). Set by radio button in the admin UI.
- `accessibility` — free-text description of the accessibility situation.
- `accessLink` — optional URL pointing to detailed third-party accessibility info (e.g. AccessNow).

The emoji is displayed inline on event rows in the listing. The full text description appears on `venues.html` and `event.html`.

## Venue data on event cards

Event cards resolve venue data live from Firestore using `venueId`. If the venue document has been deleted, the card falls back to the `event.venue` inline snapshot — a copy of basic venue fields (`name`, `address`, `accessibility`) saved at submission time. The fallback won't have `accessibilityEmoji`, `mapLink`, or `accessLink`.

## Sorting

`fetchVenues()` and `fetchVenuesWithId()` both sort results alphabetically by name, ignoring a leading "The " (case-insensitive) so e.g. "The Garrison" sorts under G.
