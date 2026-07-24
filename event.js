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
import { buildICS, downloadICS, buildGoogleCalendarUrl } from "./utils.js";

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
let event, venue;
try {
  event = await getEventById(id);
  venue = event ? await fetchVenueById(event.venueId) : null;
} catch (err) {
  console.error("Failed to load event", err);
}

const attendaceMap = { "all_ages": "🅰️All Ages", "19_plus": "19+" }
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

  const options = {
    hour: "numeric",
    ...(m !== "00" && { minute: "2-digit" })
  };

  return date.toLocaleTimeString(undefined, options);
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
  document.getElementById("event-name").innerHTML =
    event.event_name || event.performers;

  const performersRow = document.getElementById("event-performers-row");
  if (event.event_name && event.performers) {
    document.getElementById("event-performers").innerHTML = event.performers;
    performersRow.hidden = false;
  } else {
    performersRow.hidden = true;
  }

  const dateText = formatDate(event.date);
  const startText = formatTime(event.start_time);
  const endText = formatTime(event.end_time);

  document.getElementById("event-datetime").textContent =
    dateText && startText && endText
      ? `${dateText} · ${startText} – ${endText}`
      : "";

  const addToCalBtn = document.getElementById("add-to-cal-btn");
  const addToCalMenu = document.getElementById("add-to-cal-menu");
  const addToCalGoogle = document.getElementById("add-to-cal-google");
  const addToCalIcs = document.getElementById("add-to-cal-ics");
  const eventVenue = venue?.name ? venue : event.venue;

  addToCalBtn.onclick = () => {
    addToCalMenu.hidden = !addToCalMenu.hidden;
  };

  addToCalGoogle.href = buildGoogleCalendarUrl({ ...event, id: id }, eventVenue);

  addToCalIcs.onclick = () => {
    const ics = buildICS({ ...event, id: id }, eventVenue);
    const filename = (event.event_name || event.performers || "event").replace(/\s+/g, "-") + ".ics";
    downloadICS(ics, filename);
    addToCalMenu.hidden = true;
  };

  document.getElementById("event-venue-name").textContent =
    venue?.name || event.venue?.name || "";

  document.getElementById("event-venue-address").textContent =
    venue?.address || event.venue?.address || "";

  document.getElementById("event-venue-accessibility").textContent =
    `Accessibility: ${venue?.accessibility || event.venue?.accessibility || ""}`

  /**
   * ----------------------------
   * Meta Information
   * ----------------------------
   */

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
        if (!urlRaw) return;

        const label = labelRaw || "";
        const url = urlRaw.startsWith("http") ? urlRaw : `https://${urlRaw}`;

        // container line
        const line = document.createElement("div");

        // TEXT: "Label - "
        if (label) {
          line.appendChild(document.createTextNode(label + " - "));
        }

        // LINK: "link.com"
        const a = document.createElement("a");
        a.href = url;
        a.textContent = urlRaw; // show raw, not https://
        a.target = "_blank";
        a.rel = "noopener noreferrer";

        line.appendChild(a);
        linksEl.appendChild(line);
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
const loadingEl = document.getElementById("event-loading");
const mainEl = document.getElementById("event-main");

if (event) {
  try {
    populateEventPage(event);
    loadingEl.hidden = true;
    mainEl.hidden = false;
  } catch (err) {
    console.error("Failed to populate event page", err);
    loadingEl.textContent = "Could not load event.";
  }
} else {
  loadingEl.textContent = "Event not found.";
}
