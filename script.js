import { fetchEvents, addEvent } from "./dbScript.js";


const eventsResp = await fetchEvents()

console.log("eventsResp", eventsResp)

const form = document.getElementById("earlobeForm");

form.addEventListener("submit", async (e) => {
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
