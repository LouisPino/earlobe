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
;
import { fetchEvents, addEvent, addVenue, fetchVenuesWithId, fetchVenueById, uploadImage } from "./dbScript.js";

/**
 * ============================================================
 * INITIAL STATE / DOM REFERENCES
 * ============================================================
 */

// Fetch existing venues for select dropdown
const venueOptionsResp = await fetchVenuesWithId();

const venueOptions = venueOptionsResp.filter((v) => v.data.approved).sort((a, b) => a.data.name.localeCompare(b.data.name))


// Event grids
const weekGrid = document.getElementById("weekEventsGrid");
const upcomingGrid = document.getElementById("upcomingEventsGrid");
// const pastGrid = document.getElementById("pastEventsGrid");

// Simple admin detection based on URL
const isAdmin = window.location.pathname.includes("admin");

// Event submission form (may not exist on all pages)
const form = document.getElementById("earlobeForm");



/**
 * ============================================================
 * EVENT SUBMISSION (PUBLIC FORM)
 * ============================================================
 */

form?.addEventListener("submit", async (e) => {
    e.preventDefault(); // prevent full page reload
    showSubmitModal();

    let url = null
    const formData = new FormData(form);
    const imageEl = document.getElementById("imageInput")
    if (imageEl.files && imageEl.files.length > 0) {
        const file = imageEl.files[0];
        url = await uploadImage(file);
    }

    const venueChoice = formData.get("venue");
    let venue;
    let venueId;

    // Handle custom venue entry
    if (venueChoice === "other") {
        const name = formData.get("venue_name");
        const address = formData.get("venue_address");
        // const accessibility = formData.get("venue_accessibility");

        venue = {
            name,
            address,
            accessibility: "",
            approved: false,
            notes: ""
        };


        // Store venue separately for reuse
        const venueAddResp = await addVenue(venue);
        venueId = venueAddResp.id
    } else {
        for (let option of venueOptions) {
            if (option.id === venueChoice) {
                venueId = option.id
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
        venue: venue || null,
        venueId: venueId,
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

        setSubmitModalText("Success! An admin will approve your post shortly.");
        document.querySelector(".spinner").style.visibility = "hidden"
        setTimeout(() => {
            // window.location.replace("./");
        }, 900);

        form.reset();

    } catch (err) {
        console.error("Error submitting event:", err);

        setSubmitModalText("Something went wrong. Please try again. If the issue persists, let us know at earlobeTO@gmail.com");

        setTimeout(() => {
            hideSubmitModal();
        }, 2500);
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
      <option value="${venue.id}">${venue.data.name}</option>
    `;
    }

    venueSelect.innerHTML += `
    <option value="other" class="other-venue">Add New Venue</option>
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
    if (Number(time.slice(0, 2)) === 12) {
        time = time + " PM"
    } else if (Number(time.slice(0, 2)) > 12) {
        time = String((Number(time.slice(0, 2)) - 12) + time.slice(2) + " PM")
    } else {
        time = time + " AM"
    }
    return time;
}

/**
 * ============================================================
 * EVENT CARD RENDERING
 * ============================================================
 */

async function createEventCard(eventObj) {
    const event = eventObj.data;
    console.log(event)
    const card = document.createElement("article");
    let venueData
    if (event.venueId) {
        venueData = await fetchVenueById(event.venueId)
        console.log(venueData)
    } else {
        venueData = event.venue
    }
    // console.log(venueData)
    card.className = "event-card";
    if (isAdmin) {
        card.classList.add(event.confirmed ? "confirmed" : "unconfirmed")
    }

    card.innerHTML = `
    <div class="event-card-header">
      <h2>${event.event_name || event.performers}</h2>
      ${event.imageUrl ?
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
        <strong>Venue:</strong> ${venueData.name}
      </p>

      ${event.cost ? `<p><strong>Cost:</strong> ${event.cost}</p>` : ""}


    </div >

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
    // pastGrid.innerHTML = "<p class='loading'>Loading…</p>";

    try {
        const eventsResp = await fetchEvents();
        const events = isAdmin
            ? eventsResp
            : eventsResp.filter(e => e.data.confirmed === true);

        weekGrid.innerHTML = "";
        upcomingGrid.innerHTML = "";
        // pastGrid.innerHTML = "";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const thisWeek = [];
        const upcoming = [];
        // const past = [];

        events.forEach(event => {
            const eventDate = new Date(event.data.date);
            eventDate.setHours(0, 0, 0, 0);

            if (eventDate < today) {
                // past.push(event);
            } else if (eventDate <= weekEnd) {
                thisWeek.push(event);
            } else {
                upcoming.push(event);
            }
        });

        renderGroupedEvents(thisWeek, weekGrid);
        renderGroupedEvents(upcoming, upcomingGrid);
        // renderGroupedEvents(past, pastGrid);
    } catch (err) {
        console.error(err);
        weekGrid.innerHTML = "<p>Error loading events.</p>";
        upcomingGrid.innerHTML = "<p>Error loading events.</p>";
        // pastGrid.innerHTML = "<p>Error loading events.</p>";
    }
}

if (weekGrid && upcomingGrid) {
    loadEvents();
}

/**
 * ============================================================
 * GROUPING HELPERS
 * ============================================================
 */

async function renderGroupedEvents(events, container) {
    if (!events.length) {
        if (container.id === "weekEventsGrid") {
            container.innerHTML = "<p>No events this week.</p>";

        } else {
            container.innerHTML = "<p>No events.</p>";
        }
        return;
    }

    container.innerHTML = "";

    const grouped = groupEventsByDate(events);
    const dates = Object.keys(grouped).sort(
        (a, b) => new Date(a) - new Date(b)
    );

    for (const date of dates) {
        const header = document.createElement("h3");
        header.className = "event-date-header";
        header.textContent = formatDateHeader(date);
        container.appendChild(header);

        for (const event of grouped[date]) {
            const card = await createEventCard(event);
            container.appendChild(card);
        }
    }


}


function showSubmitModal(text = "Submitting event…") {
    const modal = document.getElementById("submit-modal");
    const label = document.getElementById("submit-modal-text");
    label.textContent = text;
    modal.classList.remove("hidden");
}

function hideSubmitModal() {
    document.getElementById("submit-modal").classList.add("hidden");
}

function setSubmitModalText(text) {
    document.getElementById("submit-modal-text").textContent = text;
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