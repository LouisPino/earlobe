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
    showSubmitModal();


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

    // let cost = null;
    // const costType = formData.get("costType"); // radio

    // if (costType === "PWYC") {
    //     const suggested = document.getElementById("pwycAmount").value;
    //     if (suggested) {
    //         cost = `PWYC-$${suggested}`
    //     } else {
    //         cost = "PWYC"
    //     }

    // } else if (costType === "other") {
    //     const otherVal = document.getElementById("otherAmount").value;
    //     if (otherVal >= 50) {
    //         cost = `💰$${otherVal}`
    //     } else if (25) {
    //         cost = `💲$${otherVal}`
    //     } else {
    //         cost = `$${otherVal}`
    //     }
    // } else {
    //     cost = `🌀Free`
    // }

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
        // attendanceOther.style.display = "none";
        // attendanceOther.value = "";
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

    const [h, m] = time.split(":");
    let hour = Number(h);
    const suffix = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${m} ${suffix}`;
}
/**
 * ============================================================
 * EVENT CARD RENDERING
 * ============================================================
 */

async function createEventCard(eventObj) {
    const event = eventObj.data;
    let venueData
    if (event.venueId) { //every event SHOULD have an id, but some venues may have been deleted so mucst check for data.
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



    const card = document.createElement("article");
    //     card.className = "event-card";


    //     if (isAdmin) {
    //         card.classList.add(event.confirmed ? "confirmed" : "unconfirmed")
    //     }



    //     card.innerHTML = `
    //     <div class="event-card-header">
    //       <h2>${event.event_name || event.performers}</h2>
    //       ${event.imageUrl ?
    //             `
    //  <a class="event-img-link" href="./event.html?id=${eventObj.id}" rel="noopener">
    //  <img src=${event.imageUrl} />
    // </a>
    // ` : ""}

    //       <p class="event-date">${formatDate(event.date)}</p>
    //           ${isAdmin ?
    //             `<div class="event-card-footer">
    //             <a class="edit-event" href="./edit.html?id=${eventObj.id}" rel="noopener">
    //               EDIT EVENT →
    //             </a>
    // <button class="delete-event" data-event-id="${eventObj.id}">
    //   DELETE EVENT
    // </button>          </div> 
    // `
    //             : ""}

    //     </div>

    //     <div class="event-card-body">
    //      ${event.event_name ?
    //             `  <p class="event-performers">
    //                 <strong>Artists:</strong> ${event.performers}
    //             </p>`
    //             :
    //             ""
    //         }

    //       <p>
    //         <strong>Time:</strong>
    //         ${formatTime(event.start_time)}
    //         ${event.end_time ? "– " + formatTime(event.end_time) : ""}
    //       </p>

    //       <p>
    //         <strong>Venue:</strong> ${venueData.name}
    //       </p>

    //       ${event.cost ? `<p><strong>Cost:</strong> ${event.cost}</p>` : ""}


    //     </div >

    //         ${!isAdmin
    //             ? `<div class="event-card-footer">
    //             <a href="./event.html?id=${eventObj.id}" target="_blank" rel="noopener">
    //               More info →
    //             </a>
    //           </div>`
    //             : ""
    //         }
    //   <p class="access">Accessibility - ${venueData.accessibilityEmoji || "❓"}</p>
    //   ${event.attendance ? `<p class="access">Attendance - ${attendanceEmoji}</p>` : ""}
    //     `;



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
  <p class="event-line">

    <span class="event-time">
      ${formatTime(event.start_time)}
      ${event.end_time ? "–" + formatTime(event.end_time) : ""}
    </span>

    <a class="event-title" href="./event.html?id=${eventObj.id}">
      ${event.event_name ? `${event.event_name}${event.performers ? ":" : ""}` : ""}
      ${event.performers ? `${event.performers}` : ""}
    </a>


    @ <strong> ${venueData.name}</strong >

        ${event.doors_time ? `// Doors ${formatTime(event.doors_time)}` : ""}

    ${event.cost ? `// ${event.cost}` : ""}

    ${venueData.accessLink ?
            `// <a href="${venueData.accessLink}" class="venue-access-link" target="_blank">ACCESS</a>: ${venueData.accessibilityEmoji || "❓"}`
            :
            `// ACCESS: ${venueData.accessibilityEmoji || "❓"}`

        }

    

    ${event.attendance ? `${attendanceEmoji ? attendanceEmoji : ""}` : ""}
    ${venueData.mapLink ? `// <a href="${venueData.mapLink}" target="_blank" class="event-row-map-link">MAP</a>` : ""}
    
    ${isAdmin
            ? `
        <span class="admin-actions">
        // 
        <a class="edit-event" href="./edit.html?id=${eventObj.id}">EDIT</a>
        |
        <button class="delete-event" data-event-id="${eventObj.id}">
        DELETE
        </button>
        </span>
        `
            : ""
        }
        
        </p >

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




