/**
 * Computes the shared fields (times, summary, location, description) used
 * by both the .ics file and the Google Calendar link.
 * Uses floating local time (no TZID) — appropriate for a Toronto-only site.
 */
function getEventFields(event, venue) {
  const dateStr = event.date?.replace(/-/g, "") ?? "";

  function toMinutes(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  }

  function fromMinutes(dateBase, totalMins) {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return (
      dateBase +
      "T" +
      String(h).padStart(2, "0") +
      String(m).padStart(2, "0") +
      "00"
    );
  }

  function toICSTime(dateBase, timeStr) {
    if (!timeStr) return dateBase + "T000000";
    const [h, m] = timeStr.split(":");
    return dateBase + "T" + h.padStart(2, "0") + m.padStart(2, "0") + "00";
  }

  const dtstart = toICSTime(dateStr, event.start_time);
  const dtend = event.end_time
    ? toICSTime(dateStr, event.end_time)
    : event.start_time
      ? fromMinutes(dateStr, toMinutes(event.start_time) + 90)
      : toICSTime(dateStr, null);

  function stripTags(str) {
    return str.replace(/<[^>]*>/g, "");
  }

  const summary = [event.event_name, event.performers]
    .filter(Boolean)
    .map(stripTags)
    .join(": ");
  const location = [venue?.name, venue?.address].filter(Boolean).join(", ");
  const description = event.description || "";

  return { dtstart, dtend, summary, location, description };
}

/**
 * Builds an .ics file string for a single event.
 */
export function buildICS(event, venue) {
  const dateStr = event.date?.replace(/-/g, "") ?? "";
  const { dtstart, dtend, summary, location, description } = getEventFields(
    event,
    venue,
  );

  function icsEscape(str) {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  const uid = `earlobe-${event.id || dateStr}-${Date.now()}@earlobe.ca`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Earlobe//earlobe.ca//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${icsEscape(summary)}`,
    location ? `LOCATION:${icsEscape(location)}` : null,
    description ? `DESCRIPTION:${icsEscape(description)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/**
 * Builds a Google Calendar "add event" link for a single event.
 */
export function buildGoogleCalendarUrl(event, venue) {
  const { dtstart, dtend, summary, location, description } = getEventFields(
    event,
    venue,
  );

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: summary,
    dates: `${dtstart}/${dtend}`,
    details: description,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Triggers a download of an .ics file from a string.
 */
export function downloadICS(icsString, filename) {
  const blob = new Blob([icsString], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
