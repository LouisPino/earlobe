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
import { buildICS, downloadICS, buildGoogleCalendarUrl } from "./utils.js";

/**
 * ============================================================
 * INITIAL STATE / DOM REFERENCES
 * ============================================================
 */

// Fetch existing venues for select dropdown
let venueOptionsResp = [];
try {
    venueOptionsResp = await fetchVenuesWithId();
} catch (err) {
    console.error("Failed to load venues", err);
}

export const venueOptions = venueOptionsResp.filter((v) => v.data.approved)

// Event grids
const weekGrid = document.getElementById("weekEventsGrid");
const upcomingGrid = document.getElementById("upcomingEventsGrid");
const pastGrid = document.getElementById("pastEventsGrid");

// Simple admin detection based on URL
const isAdmin = window.location.pathname.includes("admin");

// Event submission form (may not exist on all pages)
const form = document.getElementById("earlobeForm");



/**
 * ============================================================
 * EVENT SUBMISSION (PUBLIC FORM)
 * ============================================================
 */
form?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.target.closest("textarea")) {
        e.preventDefault();
    }
});
form?.addEventListener("submit", async (e) => {
    e.preventDefault(); // prevent full page reload

    let url = null
    const formData = new FormData(form);

    const event_name = formData.get("event_name") || null
    const performers = formData.get("performers") || null

    if (!event_name && !performers) {
        alert("Please provide either name of event or performers (or both)")
        return
    }

    const venueChoice = formData.get("venue");

    if (!venueChoice) {
        alert("Please select a venue from the list.")
        return
    }

    if (venueChoice === "private" && !formData.get("private_venue_contact")?.trim()) {
        alert("For a private location, please add contact info so people know who to reach for the address.")
        return
    }
    showSubmitModal();


    const imageEl = document.getElementById("imageInput")
    if (imageEl.files && imageEl.files.length > 0) {
        const file = imageEl.files[0];
        url = await uploadImage(file);
    }

    let venue;
    let venueId;

    // A private location is never written to the venue collection — it lives
    // only on this event, so it can't leak into the public venues list.
    if (venueChoice === "private") {
        venue = {
            name: formData.get("private_venue_name")?.trim() || null,
            address: null,
            accessibility: formData.get("private_venue_accessibility")?.trim() || null,
            contact: formData.get("private_venue_contact").trim(),
            private: true
        };
        venueId = null;
    } else if (venueChoice === "other") {
        const name = formData.get("venue_name");
        const address = formData.get("venue_address");
        const accessibility = formData.get("venue_accessibility");

        venue = {
            name,
            address,
            accessibility: accessibility,
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
        event_name: event_name,
        performers: performers,
        date: formData.get("date"),
        start_time: formData.get("start_time"),
        end_time: formData.get("end_time") || null,
        doors_time: formData.get("doors_time") || null,
        venue: venue || null,
        venueId: venueId,
        attendance: formData.get("attendance"),
        attendance_other: formData.get("attendance_other") || null,
        cost: formData.get("cost") || null,
        // notaflof: !!formData.get("notaflof"),
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
            window.location.replace("./");
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
 * VENUE COMBOBOX UI
 * ------------------------------------------------------------
 * A single search field: typing filters a suggestion list of
 * venues (plus an always-present "Add New Venue" option).
 * Clicking/selecting a suggestion is the only way to set the
 * hidden #venue-select value that actually gets submitted —
 * editing the text after a selection clears it, so the form
 * can never submit stale/unselected text as if it were a choice.
 * ============================================================
 */

const venueComboInput = document.getElementById("venue-combobox-input");
const venueComboList = document.getElementById("venue-combobox-list");
const venueSelect = document.getElementById("venue-select"); // hidden input, name="venue"
const venueOtherFields = document.getElementById("venue-other-fields");
const venuePrivateFields = document.getElementById("venue-private-fields");

function toggleVenueFields(block, show) {
    if (!block) return;
    block.style.display = show ? "block" : "none";
    if (!show) {
        block
            .querySelectorAll("input, textarea")
            .forEach(el => (el.value = ""));
    }
}

/**
 * Only one of the two extra venue blocks is ever open: "other" collects a new
 * public venue, "private" collects a location that never becomes a venue
 * record. Any other choice (an existing venue, or no selection) closes both.
 */
function showVenueFieldsFor(choice) {
    toggleVenueFields(venueOtherFields, choice === "other");
    toggleVenueFields(venuePrivateFields, choice === "private");
}

function closeVenueCombobox() {
    venueComboList.hidden = true;
    venueComboInput.setAttribute("aria-expanded", "false");
}

function selectVenue(id, name) {
    venueSelect.value = id;
    venueComboInput.value = name;
    closeVenueCombobox();
    showVenueFieldsFor(id);
}

function renderVenueCombobox(venues) {
    venueComboList.innerHTML = `
        <li role="option" data-id="private" data-name="Private Location">Private Location</li>
        <li role="option" data-id="other" data-name="Add New Venue">Add New Venue</li>`;
    for (const venue of venues) {
        venueComboList.innerHTML += `<li role="option" data-id="${venue.id}" data-name="${venue.data.name}">${venue.data.name}</li>`;
    }
    venueComboList.hidden = false;
    venueComboInput.setAttribute("aria-expanded", "true");
}

venueComboInput?.addEventListener("input", () => {
    // Any manual edit invalidates the previous selection.
    venueSelect.value = "";
    showVenueFieldsFor(null);

    const term = venueComboInput.value.trim().toLowerCase();
    const filtered = term
        ? venueOptions.filter(v => v.data.name?.toLowerCase().includes(term))
        : venueOptions;
    renderVenueCombobox(filtered);
});

venueComboInput?.addEventListener("focus", () => {
    if (venueComboList.hidden) {
        renderVenueCombobox(venueOptions);
    }
});

venueComboList?.addEventListener("mousedown", (e) => {
    // mousedown (not click) so this fires before the input's blur.
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    e.preventDefault();
    selectVenue(li.dataset.id, li.dataset.name);
});

if (venueComboInput) {
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".venue-combobox")) {
            closeVenueCombobox();
        }
    });
}


// Close any open "+ CAL" dropdown when clicking outside of it
document.addEventListener("click", (e) => {
    if (!e.target.closest(".add-to-cal-inline")) {
        document.querySelectorAll(".add-to-cal-menu").forEach(menu => (menu.hidden = true));
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
        // attendanceOther.style.display = "none";
        // attendanceOther.value = "";
    }
});


/**
 * Handle cost of entry buttons / fields
 */


const radios = document.querySelectorAll('input[name="costType"]');
const pwycInput = document.getElementById("pwycAmount");
const otherInput = document.getElementById("otherAmount");

radios.forEach(radio => {
    radio.addEventListener("change", () => {
        if (radio.value === "PWYC") {
            pwycInput.disabled = false;
            otherInput.disabled = true;
            otherInput.value = "";
        } else {
            otherInput.disabled = false;
            pwycInput.disabled = true;
            pwycInput.value = "";
        }
    });
});





/**
 * ============================================================
 * DATE / TIME UTILITIES
 * ============================================================
 */

function formatSubmittedAt(createdAt) {
    if (!createdAt) return "";
    const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    if (isNaN(date)) return "";
    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

/**
 * Finds the first "Label - url" pair whose label matches inside the
 * freeform comma-separated links field (same format used on the
 * event detail page).
 */
function findLinkByLabel(linksStr, matches) {
    if (!linksStr) return null;

    const pairs = linksStr.split(",").map(l => l.trim()).filter(Boolean);

    for (const pair of pairs) {
        const [labelRaw, urlRaw] = pair.split(" - ").map(s => s?.trim());
        const label = labelRaw?.toLowerCase() || "";
        if (matches(label) && urlRaw) {
            return urlRaw.startsWith("http") ? urlRaw : `https://${urlRaw}`;
        }
    }
    return null;
}

function getTicketsLink(linksStr) {
    return findLinkByLabel(linksStr, label =>
        label.includes("ticket") || label.includes("reserv") || label.includes("rsvp"));
}

function getLivestreamLink(linksStr) {
    return findLinkByLabel(linksStr, label =>
        label.includes("stream") || label.includes("broadcast"));
}

/**
 * Renders one of the colored inline row links (ACCESS / MAP / TICKETS /
 * LIVESTREAM). Admins copy event rows into the newsletter, and newsletter
 * editors restyle pasted links by targeting the <a>, which wipes out its color.
 * Repeating the color on a nested <span> keeps it: the editors don't reach
 * inside the anchor. The span carries the link's class as well, so the dark
 * theme rules (which are !important) still override it on screen.
 */
function inlineRowLink(href, label, className, color) {
    return `<a href="${href}" target="_blank" class="${className}" style="color: ${color}"><span class="${className}" style="color: ${color}; text-decoration: underline">${label}</span></a>`;
}

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
 * EVENT CARD RENDERING
 * ============================================================
 */

async function createEventCard(eventObj) {
    const event = eventObj.data;
    let venueData
    if (event.venueId) { //every event SHOULD have an id, but some venues may have been deleted so must check for data.
        const venueDataResp = await fetchVenueById(event.venueId)
        if (venueDataResp) { //use db venue data if exists
            venueData = venueDataResp
        } else { //use fallback (user input) venue data if exists
            venueData = event.venue
        }
    } else {//shouldn't ever hit this but just in case.
        venueData = event.venue
    }
    let attendanceEmoji
    if (event.attendance === "19_plus") {
        attendanceEmoji = "<span class='nineteen-red'>19+</span>"
    } else if (event.attendance === "all_ages") {
        attendanceEmoji = "🅰️"
    } else {
        attendanceEmoji = event.attendance_other
    }

    const ticketsLink = getTicketsLink(event.links);
    const livestreamLink = getLivestreamLink(event.links);

    // The venue's full accessibility write-up lives on the venue page; the row
    // only carries the short note an admin writes for it.
    const accessEmoji = venueData.accessibilityEmoji || "❓";
    const accessNote = venueData.notes ? ` (${venueData.notes})` : "";

    // A private location may not have a name at all.
    const venueName = venueData.name || (venueData.private ? "Private Location" : "");



    const card = document.createElement("article");

    
    card.className = `event-row`;
    if (isAdmin) {
        card.classList.add(event.confirmed ? "confirmed" : "unconfirmed")
    }

    card.innerHTML = `

            ${event.imageUrl ?
            `
                 <a class="event-img-link" href="./event.html?id=${eventObj.id}" rel="noopener">
                 <img src=${event.imageUrl}/>
                     </a>`
            :
            ""
        }
  <div class="event-body">
  <p class="event-line">

    <span class="event-time">
      ${formatTime(event.start_time)}
      ${event.end_time ? "–" + formatTime(event.end_time) : ""}
    </span>

    <a class="event-title" href="./event.html?id=${eventObj.id}" style="color: #7c3aed"><span class="event-title" style="color: #7c3aed">
      ${event.event_name ? `${event.event_name}${event.performers ? ":" : ""}` : ""}
      ${event.performers ? `${event.performers}` : ""}
    </span></a>


    @ <strong> ${venueName}</strong >

    <span class="event-extra">
        ${event.doors_time ? `// Doors ${formatTime(event.doors_time)}` : ""}

    ${event.cost ? `// ${event.cost}` : ""}

    ${venueData.accessLink ?
            `// ${inlineRowLink(venueData.accessLink, "ACCESS", "venue-access-link", "green")}: ${accessEmoji}${accessNote}`
            :
            `// ACCESS: ${accessEmoji}${accessNote}`
        }



    ${event.attendance ? `${attendanceEmoji ? attendanceEmoji : ""}` : ""}
    ${venueData.mapLink ? `// ${inlineRowLink(venueData.mapLink, "MAP", "event-row-map-link", "blue")}` : ""}
    ${ticketsLink ? `// ${inlineRowLink(ticketsLink, "TICKETS", "event-row-tickets-link", "orange")}` : ""}
    ${livestreamLink ? `// ${inlineRowLink(livestreamLink, "LIVESTREAM", "event-row-livestream-link", "teal")}` : ""}
    // <span class="add-to-cal-inline">
        <button class="event-row-cal-btn" type="button">+ CAL</button>
        <span class="add-to-cal-menu" hidden>
          <a class="add-to-cal-google" target="_blank" rel="noopener noreferrer">Google Calendar</a>
          <button class="add-to-cal-ics" type="button">Apple / iCal (.ics)</button>
        </span>
      </span>
    </span>
        </p >

    ${isAdmin
            ? `
        <div class="event-footer">
        <span class="admin-actions">
        
        <a class="edit-event" href="./edit.html?id=${eventObj.id}">EDIT</a>
        |
        <button class="delete-event" data-event-id="${eventObj.id}">
        DELETE
        </button>
        </span>
        ${event.createdAt ? `<span class="event-submitted-at">Submitted ${formatSubmittedAt(event.createdAt)}</span>` : ""}
        </div>
        `
            : ""
        }
  </div>

    `;

    const calBtn = card.querySelector(".event-row-cal-btn");
    const calMenu = card.querySelector(".add-to-cal-menu");
    const calGoogle = card.querySelector(".add-to-cal-google");
    const calIcs = card.querySelector(".add-to-cal-ics");

    const CAL_MENU_WIDTH = 170; // keep in sync with .add-to-cal-menu min-width in events.css

    calBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (calMenu.hidden) {
            const btnRect = calBtn.getBoundingClientRect();
            const overflowsRight = btnRect.left + CAL_MENU_WIDTH > window.innerWidth;
            calMenu.classList.toggle("align-right", overflowsRight);
        }
        calMenu.hidden = !calMenu.hidden;
    });

    calGoogle.href = buildGoogleCalendarUrl({ ...event, id: eventObj.id }, venueData);

    calIcs.addEventListener("click", () => {
        const ics = buildICS({ ...event, id: eventObj.id }, venueData);
        const filename = (event.event_name || event.performers || "event").replace(/\s+/g, "-") + ".ics";
        downloadICS(ics, filename);
        calMenu.hidden = true;
    });

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
    if (pastGrid) {
        pastGrid.innerHTML = "<p class='loading'>Loading…</p>";
    }

    try {
        const eventsResp = await fetchEvents();
        const events = isAdmin
            ? eventsResp
            : eventsResp.filter(e => e.data.confirmed === true);

        weekGrid.innerHTML = "";
        upcomingGrid.innerHTML = "";
        if (pastGrid) {
            pastGrid.innerHTML = "";
        }
        const today = new Date();
        today.setHours(-24, 0, 0, 0);

        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const thisWeek = [];
        const upcoming = [];
        const past = [];

        events.forEach(event => {
            const eventDate = new Date(event.data.date);
            eventDate.setHours(0, 0, 0, 0);

            if (eventDate < today && !event.data.confirmed) {
                past.push(event);
            } else if (eventDate <= weekEnd && eventDate >= today) {
                thisWeek.push(event);
            } else if (eventDate > weekEnd) {
                upcoming.push(event);
            }
        });

        renderGroupedEvents(thisWeek, weekGrid);
        renderGroupedEvents(upcoming, upcomingGrid);
        if (isAdmin) {

            renderGroupedEvents(past, pastGrid);
        }
    } catch (err) {
        console.error(err);
        weekGrid.innerHTML = "<p>Error loading events.</p>";
        upcomingGrid.innerHTML = "<p>Error loading events.</p>";
        if (pastGrid) {
            pastGrid.innerHTML = "<p>Error loading events.</p>";
        }
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

        } else if (container.id === "upcomingEventsGrid") {
            container.innerHTML = "<p>No future events yet.</p>";
        } else {
            container.innerHTML = "<p>No past events awaiting confirmation.</p>";

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

        // ✅ add anchor id
        header.id = `date-${date}`;

        container.appendChild(header);

        const sortedEvents = grouped[date].sort((a, b) => {
            const timeA = a.data.start_time ?? "00:00";
            const timeB = b.data.start_time ?? "00:00";
            return timeA.localeCompare(timeB);
        });

        for (const event of sortedEvents) {
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




