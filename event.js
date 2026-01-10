import { getEventById } from "./dbScript.js";

const queryString = window.location.search;
const params = new URLSearchParams(queryString);
const id = params.get("id");

const event = await getEventById(id);


// Utility: format YYYY-MM-DD to readable date
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

// Utility: format HH:MM to readable time
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

function populateEventPage(event) {
  if (!event) return;

  // Header
  document.getElementById("event-name").textContent =
    event.event_name || "Untitled Event";

  const dateText = formatDate(event.date);
  const startText = formatTime(event.start_time);
  const endText = formatTime(event.end_time);

  document.getElementById("event-datetime").textContent =
    dateText && startText && endText
      ? `${dateText} · ${startText} – ${endText}`
      : "";

  document.getElementById("event-venue").textContent =
    event.venue || "";

  // Meta
  document.getElementById("event-performers").textContent =
    event.performers || "—";

  document.getElementById("event-cost").textContent =
    event.cost || "—";

  document.getElementById("event-attendance").textContent =
    event.attendance_other || event.attendance || "—";

  document.getElementById("event-doors").textContent =
    formatTime(event.doors_time) || "—";

  document.getElementById("event-start").textContent =
    formatTime(event.start_time) || "—";

  document.getElementById("event-end").textContent =
    formatTime(event.end_time) || "—";

  // Description
  document.getElementById("event-description").textContent =
    event.description || "";
  // Links (optional, comma-separated)
  const linksSection = document.getElementById("event-links-section");
  const linksEl = document.getElementById("event-links");

  // Clear any previous links
  linksEl.innerHTML = "";

  if (event.links) {
    const links = event.links
      .split(",")
      .map(l => l.trim())
      .filter(Boolean);

    if (links.length) {
      links.forEach((url, i) => {
        const a = document.createElement("a");
        a.href = url;
        a.textContent = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";

        linksEl.appendChild(a);

        // Line break between links
        if (i < links.length - 1) {
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


  // Footer
  const emailEl = document.getElementById("event-email");
  emailEl.href = `mailto:${event.email}`;
  emailEl.textContent = event.email || "";
}

// Call after fetch
populateEventPage(event);
