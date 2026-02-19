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


async function initCalendar() {
    const calendarEl = document.getElementById("eventsCalendar");
    if (!calendarEl) return;


    const rawEvents = await getEvents();
    // Build a Set of YYYY-MM-DD strings
    const approvedEvents = rawEvents.filter((e) => e.data.confirmed)
    const eventDateSet = new Set(
        approvedEvents.map(e => (e.data ?? e).date)
    );

    const todayStr = new Date().toISOString().split("T")[0];

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        height: "auto",
        fixedWeekCount: false,

        headerToolbar: {
            left: "prev,next",
            center: "title",
            right: "today"
        },

        dateClick: function (info) {
            const dateStr = info.dateStr;

            // 🔹 Past date → go to archive
            if (dateStr < todayStr) {
                window.location.href = `/archive.html`;
                return;
            }

            // 🔹 Has event → scroll
            if (eventDateSet.has(dateStr)) {
                const targetId = `date-${dateStr}`;
                const targetEl = document.getElementById(targetId);

                if (targetEl) {
                    targetEl.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
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
