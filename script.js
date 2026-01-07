import { fetchEvents, addEvent } from "./dbScript.js";

const weekGrid = document.getElementById("weekEventsGrid");
const upcomingGrid = document.getElementById("upcomingEventsGrid");
const pastGrid = document.getElementById("pastEventsGrid");
    const isAdmin = window.location.pathname.includes("admin")


const form = document.getElementById("earlobeForm");

form?.addEventListener("submit", async (e) => {
    e.preventDefault(); // stop page reload

    const formData = new FormData(form);

    const eventObj = {
        email: formData.get("email"),
        event_name: formData.get("event_name") || null,
        performers: formData.get("performers"),
        date: formData.get("date"),
        start_time: formData.get("start_time"),
        end_time: formData.get("end_time") || null,
        doors_time: formData.get("doors_time") || null,
        venue: formData.get("venue"),
        venue_details: formData.get("venue_details") || null,
        attendance: formData.get("attendance"),
        attendance_other: formData.get("attendance_other") || null,
        cost: formData.get("cost") || null,
        links: formData.get("links") || null,
        description: formData.get("description") || null,
        createdAt: new Date()
    };

    try {
        await addEvent(eventObj);

        alert("Event submitted successfully!");
        form.reset();
    } catch (err) {
        console.error("Error submitting event:", err);
        alert("Something went wrong. Please try again.");
    }
});


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


function createEventCard(eventObj) {
    const event = eventObj.data
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
    ${!isAdmin && event.links &&
             `<div class="event-card-footer">
            <a href="${event.links}" target="_blank" rel="noopener">
              More info →
            </a>
          </div>`
           
        }

        ${isAdmin &&

`<div class="event-card-footer">
            <a href="/edit.html?id=${eventObj.id}" rel="noopener">
              EDIT EVENT →
            </a>
          </div>`

        }
  `;

    return card;
}




async function loadEvents() {
    weekGrid.innerHTML = "<p class='loading'>Loading…</p>";
    upcomingGrid.innerHTML = "<p class='loading'>Loading…</p>";
    pastGrid.innerHTML = "<p class='loading'>Loading…</p>";
    try {
        const eventsResp = await fetchEvents();
        const events = isAdmin ? eventsResp : eventsResp.filter((e)=>{e.confirmed===true})
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
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);

            if (eventDate < today) {
                past.push(event);
            } else if (eventDate <= weekEnd) {
                thisWeek.push(event);
            } else {
                upcoming.push(event);
            }
        });


            renderEvents(thisWeek, upcoming, past)
        

       

    } catch (err) {
        console.error(err);
        weekGrid.innerHTML = "<p>Error loading events.</p>";
        upcomingGrid.innerHTML = "<p>Error loading events.</p>";
        pastGrid.innerHTML = "<p>Error loading events.</p>";
    }
}

if(weekGrid && pastGrid && upcomingGrid){

    loadEvents();
}



function renderEvents(thisWeek, upcoming, past){
 // This Week (soonest first)
        thisWeek
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach(event => {
                weekGrid.appendChild(createEventCard(event));
            });

        // Upcoming (after this week)
        upcoming
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach(event => {
                upcomingGrid.appendChild(createEventCard(event));
            });

        // Previous (most recent first)
        past
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(event => {
                pastGrid.appendChild(createEventCard(event));
            });

        if (!thisWeek.length) {
            weekGrid.innerHTML = "<p>No events this week.</p>";
        }

        if (!upcoming.length) {
            upcomingGrid.innerHTML = "<p>No upcoming events.</p>";
        }

        if (!past.length) {
            pastGrid.innerHTML = "<p>No previous events.</p>";
        }
}




//seed sample data


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
                date: "2025-12-19",
                start_time: "19:30",
                end_time: "21:00",
                doors_time: "19:00",
                venue: "Arraymusic Studio",
                venue_details: "Ground floor, accessible entrance, gender-neutral washrooms",
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
                performers: "Louis Pino, Toronto Laptop Orchestra (small ensemble)",
                date: "2026-03-04",
                start_time: "20:00",
                end_time: null,
                doors_time: "19:30",
                venue: "Tranzac Club",
                venue_details: "Main hall, step-free entrance, accessible washrooms",
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
                venue: "Private Studio (West End)",
                venue_details:
                    "Private residence. Please RSVP for address. Entrance involves two steps.",
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
