/**
 * ============================================================
 * ADMIN EVENT EDIT PAGE
 * ------------------------------------------------------------
 * Handles:
 * - Fetching an event by ID
 * - Populating the edit form
 * - Updating venue, attendance, and event metadata
 * - Approving the event
 *
 * IMPORTANT:
 * All real security must be enforced in Firestore rules.
 * This file assumes the user already has admin access.
 * ============================================================
 */

import { fetchVenues, fetchVenuesWithId, getEventById, updateEvent } from "./dbScript.js";

/**
 * ============================================================
 * INITIAL STATE / QUERY PARAMS
 * ============================================================
 */

// Extract event ID from query string
const queryString = window.location.search;
const params = new URLSearchParams(queryString);
const id = params.get("id");

// Admin approval button
const btnEl = document.getElementById("approve-btn");

// Fetch event and venue data
const event = await getEventById(id);
const venueOptions = await fetchVenuesWithId();
/**
 * ============================================================
 * GENERIC FORM UTILITIES
 * ============================================================
 */

/**
 * Safely sets the value of an input/textarea by ID.
 * Uses fallback if value is null/undefined.
 */
function setValue(id, value, fallback = "") {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value ?? fallback;
}

/**
 * ============================================================
 * FORM POPULATION
 * ============================================================
 */

/**
 * Populates standard event fields.
 * Does NOT handle venue or attendance.
 */
function populateEditEvent(event) {
  setValue("edit-email", event.email);
  setValue("edit-name", event.event_name);
  setValue("edit-artists", event.performers);
  setValue("edit-date", event.date);
  setValue("edit-start-time", event.start_time);
  setValue("edit-end-time", event.end_time);
  setValue("edit-doors-time", event.doors_time);
  setValue("edit-cost", event.cost);
  setValue("edit-links", event.links);
  setValue("edit-description", event.description);
  if (event.imageUrl) {
    document.getElementById("edit-img").src = event.imageUrl;
  }
}

/**
 * Populates venue fields from structured venue object.
 */
function populateVenue(event) {
  const select = document.getElementById("venue-select");

  if (event.venueId) {
    select.value = event.venueId;
  } else if (event.venue) {
    toggleManualVenue(true);
    setValue("venue-name", event.venue.name);
    setValue("venue-address", event.venue.address);
    setValue("venue-accessibility", event.venue.accessibility);
  }
}

function populateVenueSelect(venues) {
  const select = document.getElementById("venue-select");

  venues.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = v.data.name;
    select.appendChild(opt);
  });
}

populateVenueSelect(venueOptions);


/**
 * Populates attendance radio buttons and optional "other" field.
 */
function populateAttendance(event) {
  const radios = document.querySelectorAll('input[name="attendance"]');
  const otherInput = document.getElementById("attendance-other-text");

  radios.forEach(r => (r.checked = false));
  otherInput.value = "";
  otherInput.disabled = true;

  if (event.attendance) {
    const selected = document.querySelector(
      `input[name="attendance"][value="${event.attendance}"]`
    );

    if (selected) {
      selected.checked = true;

      if (event.attendance === "other") {
        otherInput.disabled = false;
        otherInput.value = event.attendance_other || "";
      }
    }
  }
}

/**
 * Populate all form sections once event data is available.
 */
if (event) {
  populateEditEvent(event);
  populateVenue(event);
  populateAttendance(event);
  populateNotaflof(event.notaflof);
}

function populateNotaflof(bool) {
  const el = document.getElementById("notaflof-note");

  if (bool) {
    el.innerHTML = "*This event was marked as notaflof"
  } else {
    el.innerHTML = "*This event was <em>not</em> marked as notaflof when submitted. If unsure, contact submitter for confirmation"
  }
}

/**
 * ============================================================
 * FORM COLLECTION
 * ============================================================
 */

/**
 * Collects current form values into an event object.
 * Returned object is suitable for Firestore update.
 */
function collectEditEvent() {
  const selectedAttendance = document.querySelector(
    'input[name="attendance"]:checked'
  );

  const venueSelectVal = document.getElementById("venue-select").value;

  let venue = null;
  let venueId = null;

  if (venueSelectVal) {
    // Existing venue
    venueId = venueSelectVal;
  } else {
    // Manual venue
    venue = {
      name: document.getElementById("venue-name").value || null,
      address: document.getElementById("venue-address").value || null,
      accessibility: document.getElementById("venue-accessibility").value || null
    };
  }


  return {
    email: document.getElementById("edit-email").value || null,
    event_name: document.getElementById("edit-name").value || null,
    performers: document.getElementById("edit-artists").value || null,
    date: document.getElementById("edit-date").value || null,
    start_time: document.getElementById("edit-start-time").value || null,
    end_time: document.getElementById("edit-end-time").value || null,
    doors_time: document.getElementById("edit-doors-time").value || null,
    venueId: venueId,
    venue: {
      name: document.getElementById("venue-name").value || null,
      address: document.getElementById("venue-address").value || null,
      accessibility: document.getElementById("venue-accessibility").value || null,
    },

    attendance: selectedAttendance?.value || null,
    attendance_other:
      selectedAttendance?.value === "other"
        ? document.getElementById("attendance-other-text").value || null
        : null,

    cost: document.getElementById("edit-cost").value || null,
    links: document.getElementById("edit-links").value || null,
    description: document.getElementById("edit-description").value || null
  };
}

/**
 * ============================================================
 * SUBMISSION / APPROVAL
 * ============================================================
 */

/**
 * Approves and updates the event, then redirects back to admin.
 */
btnEl.addEventListener("click", async (e) => {
  e.preventDefault();

  const eventData = collectEditEvent();

  await updateEvent(id, {
    ...eventData,
    confirmed: true
  });

  window.location.replace("./admin.html");
});

/**
 * ============================================================
 * ATTENDANCE UI INTERACTIONS
 * ============================================================
 */

/**
 * Enables/disables the "attendance other" text field
 * based on radio selection.
 */
const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
const attendanceOtherInput = document.getElementById("attendance-other-text");

attendanceRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    if (radio.value === "other") {
      attendanceOtherInput.disabled = false;
      attendanceOtherInput.focus();
    } else {
      attendanceOtherInput.disabled = true;
      attendanceOtherInput.value = "";
    }
  });
});

const costRadios = document.querySelectorAll('input[name="costType"]');
const pwywInput = document.getElementById("pwywAmount");
const otherInput = document.getElementById("otherAmount");

costRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    pwywInput.disabled = radio.value !== "PWYW";
    otherInput.disabled = radio.value !== "other";

    if (radio.value !== "PWYW") pwywInput.value = "";
    if (radio.value !== "other") otherInput.value = "";
  });
});