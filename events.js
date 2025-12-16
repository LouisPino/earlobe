import { fetchEvents } from "./dbScript.js";

const grid = document.getElementById("eventsGrid");

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
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

function createEventCard(event) {
    const card = document.createElement("article");
    card.className = "event-card";

    card.innerHTML = `
    <div class="event-card-header">
      <h2>${event.event_name || "Untitled Event"}</h2>
      <p class="event-date">${formatDate(event.date)}</p>
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
        <strong>Venue:</strong> ${event.venue}
      </p>

      ${event.cost ? `<p><strong>Cost:</strong> ${event.cost}</p>` : ""}

      ${event.description
            ? `<p class="event-description">${event.description}</p>`
            : ""}
    </div>

    ${event.links
            ? `<div class="event-card-footer">
            <a href="${event.links}" target="_blank" rel="noopener">
              More info →
            </a>
          </div>`
            : ""
        }
  `;

    return card;
}

async function loadEvents() {
    grid.innerHTML = "<p class='loading'>Loading events…</p>";

    try {
        const events = await fetchEvents();

        if (!events.length) {
            grid.innerHTML = "<p>No events found.</p>";
            return;
        } else {
            grid.innerHTML = "";

        }

        events
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach(event => {
                grid.appendChild(createEventCard(event));
            });

    } catch (err) {
        console.error(err);
        grid.innerHTML = "<p>Error loading events.</p>";
    }
}

loadEvents();






//seed sample data

// import { addEvent } from "./dbScript.js";

// const seedBtn = document.getElementById("seedEventsBtn");

// if (seedBtn) {
//     seedBtn.addEventListener("click", async () => {
//         seedBtn.disabled = true;
//         seedBtn.textContent = "Seeding…";

//         const sampleEvents = [
//             {
//                 email: "curator@earlobe.ca",
//                 event_name: "Resonant Bodies",
//                 performers: "Duo Cichorium, Jaz Tsui",
//                 date: "2025-02-12",
//                 start_time: "19:30",
//                 end_time: "21:00",
//                 doors_time: "19:00",
//                 venue: "Arraymusic Studio",
//                 venue_details: "Ground floor, accessible entrance, gender-neutral washrooms",
//                 attendance: "all_ages",
//                 attendance_other: null,
//                 cost: "$15 / $10 student",
//                 links: "https://arraymusic.com",
//                 description:
//                     "An evening of experimental performance exploring feedback systems, embodied electronics, and slow-moving harmonic structures.",
//                 createdAt: new Date()
//             },
//             {
//                 email: "events@earlobe.ca",
//                 event_name: "Signals in the Dark",
//                 performers: "Louis Pino, Toronto Laptop Orchestra (small ensemble)",
//                 date: "2025-03-04",
//                 start_time: "20:00",
//                 end_time: null,
//                 doors_time: "19:30",
//                 venue: "Tranzac Club",
//                 venue_details: "Main hall, step-free entrance, accessible washrooms",
//                 attendance: "19_plus",
//                 attendance_other: null,
//                 cost: "PWYC",
//                 links: "https://tranzac.org",
//                 description:
//                     "Improvised electronic and electroacoustic works focusing on signal flow, spatialization, and live processing.",
//                 createdAt: new Date()
//             },
//             {
//                 email: "submit@earlobe.ca",
//                 event_name: "Objects That Listen",
//                 performers: "Various Artists",
//                 date: "2025-03-18",
//                 start_time: "18:00",
//                 end_time: "22:00",
//                 doors_time: "17:30",
//                 venue: "Private Studio (West End)",
//                 venue_details:
//                     "Private residence. Please RSVP for address. Entrance involves two steps.",
//                 attendance: "other",
//                 attendance_other: "Invitation / RSVP",
//                 cost: "Free",
//                 links: null,
//                 description:
//                     "A listening-focused gathering featuring sound installations, quiet performances, and shared discussion.",
//                 createdAt: new Date()
//             }
//         ];

//         try {
//             for (const event of sampleEvents) {
//                 await addEvent(event);
//             }

//             alert("Sample events successfully added.");
//         } catch (err) {
//             console.error("Seeding failed:", err);
//             alert("Error seeding database. Check console.");
//         } finally {
//             seedBtn.disabled = false;
//             seedBtn.textContent = "Seed database with sample events";
//         }
//     });
// }
