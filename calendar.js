// calendar.js
// Requires FullCalendar global bundle loaded in the HTML <head>.

async function getEvents() {
    // Prefer importing from dbScript.js if it exports fetchEvents.
    // Fallback to window.fetchEvents if you've attached it globally.
    try {
        const mod = await import("./dbScript.js");
        if (typeof mod.fetchEvents === "function") return await mod.fetchEvents();
    } catch (e) {
        // ignore and try fallback
    }

    if (typeof window.fetchEvents === "function") {
        return await window.fetchEvents();
    }

    throw new Error(
        "Could not find fetchEvents(). Export it from dbScript.js or attach it to window."
    );
}

function toCalendarEvent(doc) {
    // Your events look like { id, data: { date, start_time, end_time, event_name, ... } }
    // but if your fetchEvents returns raw docs, support that too.
    const data = doc?.data ?? doc;

    const title = data.event_name ?? "Untitled event";
    const date = data.date; // "YYYY-MM-DD"
    const startTime = data.start_time; // "HH:MM"
    const endTime = data.end_time; // "HH:MM"

    // If no start_time, treat as all-day.
    const allDay = !startTime;

    const start = allDay ? date : `${date}T${startTime}`;
    const end = allDay
        ? undefined
        : endTime
            ? `${date}T${endTime}`
            : undefined;

    return {
        id: doc?.id ?? data.id ?? crypto.randomUUID(),
        title,
        start,
        end,
        allDay,
        extendedProps: {
            raw: data,
            docId: doc?.id ?? data.id ?? null,
        },
    };
}

function parseLinks(linksStr) {
    // "Event - https://..." OR "Foo - url, Bar - url"
    if (!linksStr || typeof linksStr !== "string") return [];

    return linksStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((pair) => {
            const [labelRaw, urlRaw] = pair.split(" - ").map((x) => x?.trim());
            if (!urlRaw) return null;
            const url = urlRaw.startsWith("http") ? urlRaw : `https://${urlRaw}`;
            return { label: labelRaw || url, url };
        })
        .filter(Boolean);
}

function openModalForEvent(calEvent) {
    const modal = document.getElementById("eventModal");
    const content = document.getElementById("eventModalContent");
    const raw = calEvent.extendedProps?.raw ?? {};

    const links = parseLinks(raw.links);

    const venueName = raw?.venue?.name || "";
    const cost = raw.cost || "";
    const performers = raw.performers || "";
    const desc = raw.description || "";
    const img = raw.imageUrl || "";
    const date = raw.date || "";
    const doors = raw.doors_time ? `Doors: ${raw.doors_time}` : "";
    const timeRange =
        raw.start_time && raw.end_time
            ? `${raw.start_time}–${raw.end_time}`
            : raw.start_time
                ? raw.start_time
                : "";

    content.innerHTML = `
    <div class="event-modal">
      ${img ? `<img class="event-modal-img" src="${img}" alt="" />` : ""}
<h3 class="event-modal-title">
  ${raw.event_name ?? calEvent.title}
</h3>

      <div class="event-modal-meta">
        ${date ? `<div><strong>Date:</strong> ${date}</div>` : ""}
        ${timeRange ? `<div><strong>Time:</strong> ${timeRange}</div>` : ""}
        ${doors ? `<div>${doors}</div>` : ""}
        ${venueName ? `<div><strong>Venue:</strong> ${venueName}</div>` : ""}
        ${cost ? `<div><strong>Cost:</strong> ${cost}</div>` : ""}
        ${raw.notaflof
            ? `<div><strong>Access:</strong> 🌀 no one turned away</div>`
            : ""
        }
        ${raw.attendance === "all_ages"
            ? `<div><strong>Ages:</strong> 🅰️ all ages</div>`
            : raw.attendance
                ? `<div><strong>Ages:</strong> ${raw.attendance}</div>`
                : ""
        }
      </div>

      ${performers ? `<div class="event-modal-performers">${performers}</div>` : ""}
      ${desc ? `<p class="event-modal-desc">${desc}</p>` : ""}

      ${links.length
            ? `<div class="event-modal-links">
              <h4>Links</h4>
              ${links
                .map(
                    (l) =>
                        `<div><a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a></div>`
                )
                .join("")}
            </div>`
            : ""
        }
    </div>
  `;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
}

function closeModal() {
    const modal = document.getElementById("eventModal");
    modal.hidden = true;
    document.body.style.overflow = "";
}

function wireModal() {
    const modal = document.getElementById("eventModal");
    modal.addEventListener("click", (e) => {
        if (e.target.matches("[data-close]")) closeModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.hidden) closeModal();
    });
}

// function wireToggle() {
//     const btn = document.getElementById("toggleCalendarBtn");
//     const calEl = document.getElementById("eventsCalendar");

//     btn.addEventListener("click", () => {
//         const isHidden = calEl.style.display === "none";
//         calEl.style.display = isHidden ? "" : "none";
//         btn.textContent = isHidden ? "Hide" : "Show";
//     });
// }

async function initCalendar() {
    const calendarEl = document.getElementById("eventsCalendar");
    if (!calendarEl) return;

    wireModal();
    // wireToggle();

    const rawEvents = await getEvents();
    console.log(rawEvents)
    // Build a Set of YYYY-MM-DD strings
    const eventDateSet = new Set(
        rawEvents.map(e => (e.data ?? e).date)
    );

    const todayStr = new Date().toISOString().split("T")[0];

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        height: "auto",
        fixedWeekCount: false,

        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: ""
        },

        dateClick: function (info) {
            if (!eventDateSet.has(info.dateStr)) return;

            const targetId = `date-${info.dateStr}`;
            const targetEl = document.getElementById(targetId);

            if (targetEl) {
                targetEl.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        },

        dayCellDidMount: function (info) {
            const dateStr = info.date.toISOString().split("T")[0];

            if (info.isOther) {
                info.el.classList.add("fc-day-outside-custom");
                return;
            }

            // Highlight today (independent of event status)
            if (dateStr === todayStr) {
                info.el.classList.add("fc-day-today-custom");
            }

            if (eventDateSet.has(dateStr)) {
                info.el.classList.add("fc-day-has-event");
                return;
            }

            if (dateStr < todayStr) {
                info.el.classList.add("fc-day-past-no-event");
            } else {
                info.el.classList.add("fc-day-future-no-event");
            }
        }

    });


    calendar.render();
}


document.addEventListener("DOMContentLoaded", () => {
    initCalendar().catch((err) => {
        console.error("Calendar init failed:", err);
    });
});
