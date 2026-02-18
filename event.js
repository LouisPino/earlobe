/**
 * ============================================================
 * EVENT DETAIL PAGE
 * ------------------------------------------------------------
 * Fetches a single event by ID and populates the public
 * event detail view.
 *
 * Assumes:
 * - Event data is already confirmed / approved
 * - Venue is stored as a structured object
 * ============================================================
 */

import { getEventById, fetchVenueById } from "./dbScript.js";

/**
 * ============================================================
 * INITIAL STATE / QUERY PARAMS
 * ============================================================
 */

// Extract event ID from URL
const queryString = window.location.search;
const params = new URLSearchParams(queryString);
const id = params.get("id");

// Fetch event data
const event = await getEventById(id);
const venue = await fetchVenueById(event.venueId)

console.log(venue)
const attendaceMap = { "all_ages": "All Ages", "19_plus": "19+" }
/**
 * ============================================================
 * UTILITY FUNCTIONS
 * ============================================================
 */

/**
 * Formats YYYY-MM-DD into a readable date string.
 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/**
 * Formats HH:MM into a readable local time string.
 */
function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const date = new Date();
  date.setHours(h, m);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });
}

/**
 * ============================================================
 * PAGE POPULATION
 * ============================================================
 */

/**
 * Populates the event detail page with fetched event data.
 */
function populateEventPage(event) {
  if (!event) return;

  /**
   * ----------------------------
   * Header
   * ----------------------------
   */
  if (event.imageUrl) {

    document.getElementById("event-img").src =
      event.imageUrl;
  }
  document.getElementById("event-name").textContent =
    event.event_name || event.performers;

  const dateText = formatDate(event.date);
  const startText = formatTime(event.start_time);
  const endText = formatTime(event.end_time);

  document.getElementById("event-datetime").textContent =
    dateText && startText && endText
      ? `${dateText} · ${startText} – ${endText}`
      : "";

  document.getElementById("event-venue-name").textContent =
    venue.name || event.venue.name || "";

  document.getElementById("event-venue-address").textContent =
    venue.address || event.venue.address || "";

  document.getElementById("event-venue-accessibility").textContent =
    `Accessibility: ${venue.accessibility || event.venue.accessibility || ""}`

  /**
   * ----------------------------
   * Meta Information
   * ----------------------------
   */

  document.getElementById("event-performers").textContent =
    event.performers || "—";

  document.getElementById("event-cost").textContent =
    event.cost || "—";

  document.getElementById("event-attendance").textContent =
    event.attendance_other || attendaceMap[event.attendance] || "—";

  document.getElementById("event-doors").textContent =
    formatTime(event.doors_time) || "—";

  document.getElementById("event-start").textContent =
    formatTime(event.start_time) || "—";

  document.getElementById("event-end").textContent =
    formatTime(event.end_time) || "—";

  /**
   * ----------------------------
   * Description
   * ----------------------------
   */

  document.getElementById("event-description").textContent =
    event.description || "";

  /**
   * ----------------------------
   * External Links (Optional)
   * ----------------------------
   * Supports comma-separated URLs.
   */
  const linksSection = document.getElementById("event-links-section");
  const linksEl = document.getElementById("event-links");

  linksEl.innerHTML = "";

  if (event.links) {
    const pairs = event.links
      .split(",")
      .map(l => l.trim())
      .filter(Boolean);

    if (pairs.length) {
      pairs.forEach((pair, i) => {
        const [labelRaw, urlRaw] = pair.split(" - ").map(s => s?.trim());

        if (!urlRaw) return; // skip malformed

        const label = labelRaw || urlRaw;
        const url = urlRaw.startsWith("http") ? urlRaw : `https://${urlRaw}`;

        const a = document.createElement("a");
        a.href = url;
        a.textContent = label;
        a.target = "_blank";
        a.rel = "noopener noreferrer";

        linksEl.appendChild(a);

        if (i < pairs.length - 1) {
          linksEl.appendChild(document.createElement("br"));
        }
      });

      linksSection.hidden = false;
    } else {
      linksSection.hidden = true;
    }
  } else {
    linksSection.hidden = true;
  }

  /**
   * ----------------------------
   * Footer / Contact
   * ----------------------------
   */

  const emailEl = document.getElementById("event-email");
  emailEl.href = `mailto:${event.email}`;
  emailEl.textContent = event.email || "";
}

/**
 * ============================================================
 * EXECUTION
 * ============================================================
 */

// Populate page once event data is loaded
populateEventPage(event);
