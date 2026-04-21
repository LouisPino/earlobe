# Events

## Submission flow

1. Public user fills out `submit.html` (powered by `script.js`).
2. Enter key is blocked on all form inputs except textareas to prevent accidental submission.
3. If an image is attached, it is uploaded to Firebase Storage first and the download URL is stored.
4. If the user selects "Add New Venue", a new venue document is created with `approved: false` and its ID is stored on the event.
5. The event is written to Firestore with `confirmed: false`.
6. An admin reviews and approves the event via `admin.html` → `edit.html`.

## Approval flow

1. Admin opens `admin.html`, which shows the count of unconfirmed events.
2. The event list (rendered by `script.js`) shows all events on the admin page, including unconfirmed ones (styled differently).
3. Admin clicks EDIT on an event → `edit.html?id=<docId>`.
4. Admin edits fields as needed. If a poster image should be removed, clicking "Delete Poster" opens a confirmation modal and — on confirm — clears the `<img>` src in the form (the `imageUrl` is saved as `null` when the form is submitted).
5. Admin clicks "Approve" → `updateEvent` is called with `confirmed: true` → redirects back to `admin.html`.

## Event listing and grouping (`script.js`)

`loadEvents()` fetches all events, then splits them into three buckets:

- **This Week** — events within the next 7 days (`weekEventsGrid`)
- **Future Events** — events more than 7 days out (`upcomingEventsGrid`)
- **Past / Unconfirmed** — past events that have not been confirmed (admin view only, `pastGrid`)

Public view filters to `confirmed === true` only. Admin view shows all events.

Within each bucket, events are grouped by `date` and sorted chronologically. Within each date, events are sorted by `start_time`.

## Event card rendering

`createEventCard()` in `script.js` renders a single event row. Venue data is resolved live from Firestore by `venueId`. If the venue document no longer exists, it falls back to the inline `event.venue` snapshot stored at submission time.

Time formatting omits the minutes when they are `:00` (e.g. "8 PM" instead of "8:00 PM").

Attendance is displayed as:
- `🅰️` for `all_ages`
- `<span class="nineteen-red">19+</span>` for `19_plus`
- Free-text value of `attendance_other` otherwise

Cost is displayed verbatim from the `cost` field.

## Calendar widget (`calendar.js`)

FullCalendar (loaded from CDN) renders a month grid. Days with at least one approved event are highlighted. Clicking a future date with events smooth-scrolls to the `#date-YYYY-MM-DD` anchor in the event list. Clicking a past date with events navigates to `archive.html`.

## Links field format

The `links` field on an event is a comma-separated string of `Label - URL` pairs, e.g.:

```
Tickets - https://ra.co/events/123, Facebook - https://fb.com/event/456
```

`event.js` parses this at render time and outputs each pair as a labelled link. URLs without `http` are prefixed with `https://` automatically.
