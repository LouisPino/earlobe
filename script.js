/**
 * ============================================================
 * EVENTS PAGE / SUBMISSION + LISTING LOGIC
 * ------------------------------------------------------------
 * Responsibilities:
 * - Handle public event submission form
 * - Populate venue selector
 * - Render event cards (public + admin)
 * - Group and display events by date
 * - Seed sample data (admin-only utility)
 *
 * IMPORTANT:
 * - Real security must be enforced in Firestore rules
 * - Admin checks here are UI-only
 * ============================================================
 */

import { fetchEvents, addEvent, addVenue, fetchVenues, uploadImage } from "./dbScript.js";

/**
 * ============================================================
 * INITIAL STATE / DOM REFERENCES
 * ============================================================
 */

// Fetch existing venues for select dropdown
const venueOptions = await fetchVenues();

// Event grids
const weekGrid = document.getElementById("weekEventsGrid");
const upcomingGrid = document.getElementById("upcomingEventsGrid");
const pastGrid = document.getElementById("pastEventsGrid");

// Simple admin detection based on URL
const isAdmin = window.location.pathname.includes("admin");

// Event submission form (may not exist on all pages)
const form = document.getElementById("earlobeForm");
const submittingModal = document.querySelector(".submitting-modal")
const submittingBackdrop = document.getElementById("submittingBackdrop")

/**
 * ============================================================
 * EVENT SUBMISSION (PUBLIC FORM)
 * ============================================================
 */

form?.addEventListener("submit", async (e) => {
    e.preventDefault(); // prevent full page reload
    submittingModal.style.display = "block"
    submittingBackdrop.style.display = "flex"
    let url = null
    const formData = new FormData(form);
    const imageEl = document.getElementById("imageInput")
    if (imageEl.files && imageEl.files.length > 0) {
        const file = imageEl.files[0];
        url = await uploadImage(file);
    }

    const venueChoice = formData.get("venue");
    let venue;

    // Handle custom venue entry
    if (venueChoice === "other") {
        const name = formData.get("venue_name");
        const address = formData.get("venue_address");
        const accessibility = formData.get("venue_accessibility");

        venue = {
            name,
            address,
            accessibility
        };


        // Store venue separately for reuse
        addVenue(venue);
    } else {
        for (let option of venueOptions) {
            if (option.name === venueChoice) {
                venue = option
            }
        }
    }

    // Construct event object
    const eventObj = {
        email: formData.get("email"),
        event_name: formData.get("event_name") || null,
        performers: formData.get("performers"),
        date: formData.get("date"),
        start_time: formData.get("start_time"),
        end_time: formData.get("end_time") || null,
        doors_time: formData.get("doors_time") || null,
        venue,
        attendance: formData.get("attendance"),
        attendance_other: formData.get("attendance_other") || null,
        cost: formData.get("cost") || null,
        links: formData.get("links") || null,
        description: formData.get("description") || null,
        createdAt: new Date(),
        imageUrl: url || null
    };

    try {
        await addEvent(eventObj);
        alert("Event submitted successfully! An admin will approve your event for display soon.");
        window.location.replace("./");
        form.reset();
    } catch (err) {
        console.error("Error submitting event:", err);
        alert("Something went wrong. Please try again.");
    }
});

/**
 * ============================================================
 * VENUE SELECT UI
 * ============================================================
 */

const venueSelect = document.getElementById("venue-select");
const venueOtherFields = document.getElementById("venue-other-fields");

// Toggle custom venue fields
venueSelect?.addEventListener("change", () => {
    if (venueSelect.value === "other") {
        venueOtherFields.style.display = "block";
    } else {
        venueOtherFields.style.display = "none";

        // Clear values to prevent stale submissions
        venueOtherFields
            .querySelectorAll("input, textarea")
            .forEach(el => (el.value = ""));
    }
});


/**
 * ============================================================
 * ATTENDANCE SELECT UI
 * ============================================================
 */
const attendanceSelect = document.getElementById("attendance-select");
const attendanceOther = document.getElementById("attendance-other-input");

attendanceSelect?.addEventListener("change", () => {
    const selected = attendanceSelect.querySelector(
        'input[name="attendance"]:checked'
    );

    if (selected?.value === "other") {
        attendanceOther.style.display = "block";
        attendanceOther.focus();
    } else {
        attendanceOther.style.display = "none";
        attendanceOther.value = "";
    }
});


/**
 * Populate venue dropdown from database.
 */
function populateVenueSelect() {
    for (let venue of venueOptions) {
        venueSelect.innerHTML += `
      <option value="${venue.name}">${venue.name}</option>
    `;
    }

    venueSelect.innerHTML += `
    <option value="other">Other</option>
  `;
}

if (venueSelect) {
    populateVenueSelect();
}

/**
 * ============================================================
 * DATE / TIME UTILITIES
 * ============================================================
 */

function formatDate(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function formatTime(time) {
    if (!time) return "";
    return time;
}

/**
 * ============================================================
 * EVENT CARD RENDERING
 * ============================================================
 */

function createEventCard(eventObj) {
    const event = eventObj.data;
    const card = document.createElement("article");
    card.className = "event-card";
    if (isAdmin) {
        card.classList.add(event.confirmed ? "confirmed" : "unconfirmed")
    }

    card.innerHTML = `
    <div class="event-card-header">
      <h2>${event.event_name || event.performers}</h2>
      ${ event.imageUrl ?
    `
 <a class="event-img-link" href="./event.html?id=${eventObj.id}" rel="noopener">
 <img src=${event.imageUrl} />
</a>
` : ""}

      <p class="event-date">${formatDate(event.date)}</p>
          ${isAdmin ?
             `<div class="event-card-footer">
            <a class="edit-event" href="./edit.html?id=${eventObj.id}" rel="noopener">
              EDIT EVENT →
            </a>
<button class="delete-event" data-event-id="${eventObj.id}">
  DELETE EVENT
</button>          </div> 
`
: ""}

    </div>

    <div class="event-card-body">
      <p class="event-performers">
        <strong>Artists:</strong> ${event.performers}
      </p>

      <p>
        <strong>Time:</strong>
        ${formatTime(event.start_time)}
        ${event.end_time ? "– " + formatTime(event.end_time) : ""}
      </p>

      <p>
        <strong>Venue:</strong> ${event.venue.name}
      </p>

      ${event.cost ? `<p><strong>Cost:</strong> ${event.cost}</p>` : ""}

      ${event.description
            ? `<p class="event-description">${event.description}</p>`
            : ""
        }
    </div>

    ${!isAdmin
            ? `<div class="event-card-footer">
            <a href="./event.html?id=${eventObj.id}" target="_blank" rel="noopener">
              More info →
            </a>
          </div>`
            : ""
        }


  `;

    return card;
}






/**
 * ============================================================
 * EVENT LOADING + GROUPING
 * ============================================================
 */

async function loadEvents() {
    weekGrid.innerHTML = "<p class='loading'>Loading…</p>";
    upcomingGrid.innerHTML = "<p class='loading'>Loading…</p>";
    pastGrid.innerHTML = "<p class='loading'>Loading…</p>";

    try {
        const eventsResp = await fetchEvents();
        const events = isAdmin
            ? eventsResp
            : eventsResp.filter(e => e.data.confirmed === true);

        if (!events.length) {
            weekGrid.innerHTML = "<p>No events this week.</p>";
            upcomingGrid.innerHTML = "<p>No upcoming events.</p>";
            pastGrid.innerHTML = "<p>No previous events.</p>";
            return;
        }

        weekGrid.innerHTML = "";
        upcomingGrid.innerHTML = "";
        pastGrid.innerHTML = "";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const thisWeek = [];
        const upcoming = [];
        const past = [];

        events.forEach(event => {
            const eventDate = new Date(event.data.date);
            eventDate.setHours(0, 0, 0, 0);

            if (eventDate < today) {
                past.push(event);
            } else if (eventDate <= weekEnd) {
                thisWeek.push(event);
            } else {
                upcoming.push(event);
            }
        });

        renderGroupedEvents(thisWeek, weekGrid);
        renderGroupedEvents(upcoming, upcomingGrid);
        renderGroupedEvents(past, pastGrid);
    } catch (err) {
        console.error(err);
        weekGrid.innerHTML = "<p>Error loading events.</p>";
        upcomingGrid.innerHTML = "<p>Error loading events.</p>";
        pastGrid.innerHTML = "<p>Error loading events.</p>";
    }
}

if (weekGrid) {
    loadEvents();
}

/**
 * ============================================================
 * GROUPING HELPERS
 * ============================================================
 */

function renderGroupedEvents(events, container) {
    if (!events.length) {
        container.innerHTML = "<p>No events.</p>";
        return;
    }

    container.innerHTML = "";

    const grouped = groupEventsByDate(events);

    const dates = Object.keys(grouped).sort(
        (a, b) => new Date(a) - new Date(b)
    );

    dates.forEach(date => {
        const header = document.createElement("h3");
        header.className = "event-date-header";
        header.textContent = formatDateHeader(date);
        container.appendChild(header);

        grouped[date].forEach(event => {
            container.appendChild(createEventCard(event));
        });
    });
}

function groupEventsByDate(events) {
    return events.reduce((acc, event) => {
        const date = event.data.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(event);
        return acc;
    }, {});
}

function formatDateHeader(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

/**
 * ============================================================
 * DATABASE SEEDING (ADMIN UTILITY)
 * ============================================================
 */

const seedBtn = document.getElementById("seedEventsBtn");

if (seedBtn) {
    seedBtn.addEventListener("click", async () => {
        seedBtn.disabled = true;
        seedBtn.textContent = "Seeding…";

        const sampleEvents = [
            {
                email: "curator@earlobe.ca",
                event_name: "Resonant Bodies",
                performers: "Duo Cichorium, Jaz Tsui",
                date: "2026-01-12",
                start_time: "19:30",
                end_time: "21:00",
                doors_time: "19:00",
                venue: {
                    name: "Arraymusic Studio",
                    address: "Toronto, ON",
                    accessibility:
                        "Ground floor, accessible entrance, gender-neutral washrooms"
                },
                attendance: "all_ages",
                attendance_other: null,
                cost: "$15 / $10 student",
                links: "https://arraymusic.com",
                description:
                    "An evening of experimental performance exploring feedback systems, embodied electronics, and slow-moving harmonic structures.",
                createdAt: new Date()
            },

            {
                email: "events@earlobe.ca",
                event_name: "Signals in the Dark",
                performers:
                    "Louis Pino, Toronto Laptop Orchestra (small ensemble)",
                date: "2026-02-04",
                start_time: "20:00",
                end_time: null,
                doors_time: "19:30",
                venue: {
                    name: "Tranzac Club",
                    address: "292 Brunswick Ave, Toronto, ON",
                    accessibility:
                        "Main hall, step-free entrance, accessible washrooms"
                },
                attendance: "19_plus",
                attendance_other: null,
                cost: "PWYC",
                links: "https://tranzac.org",
                description:
                    "Improvised electronic and electroacoustic works focusing on signal flow, spatialization, and live processing.",
                createdAt: new Date()
            },

            {
                email: "submit@earlobe.ca",
                event_name: "Objects That Listen",
                performers: "Various Artists",
                date: "2026-03-18",
                start_time: "18:00",
                end_time: "22:00",
                doors_time: "17:30",
                venue: {
                    name: "Private Studio (West End)",
                    address: "Private residence – RSVP required for address",
                    accessibility: "Entrance involves two steps"
                },
                attendance: "other",
                attendance_other: "Invitation / RSVP",
                cost: "Free",
                links: null,
                description:
                    "A listening-focused gathering featuring sound installations, quiet performances, and shared discussion.",
                createdAt: new Date()
            }
        ];

        try {
            for (const event of sampleEvents) {
                await addEvent(event);
            }

            alert("Sample events successfully added.");
        } catch (err) {
            console.error("Seeding failed:", err);
            alert("Error seeding database. Check console.");
        } finally {
            seedBtn.disabled = false;
            seedBtn.textContent = "Seed database with sample events";
        }
    });
}
