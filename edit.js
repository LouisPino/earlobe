import { getEventById, updateEvent } from "./dbScript.js";

const queryString = window.location.search;
const params = new URLSearchParams(queryString);
const id = params.get("id");

const event = await getEventById(id);
console.log(event);

function setValue(id, value, fallback = "") {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value ?? fallback;
}

function populateEditEvent(event) {
  setValue("edit-email", event.email);
  setValue("edit-name", event.event_name);
  setValue("edit-artists", event.performers);
  setValue("edit-date", event.date);
  setValue("edit-start-time", event.start_time);
  setValue("edit-end-time", event.end_time);
  setValue("edit-doors-time", event.doors_time);
  setValue("edit-venue", event.venue);
  setValue("edit-accessibility", event.venue_details);
  setValue(
    "edit-age",
    event.attendance_other || event.attendance
  );
  setValue("edit-cost", event.cost);
  setValue("edit-links", event.links);
  setValue("edit-description", event.description);
}

if (event) {
  populateEditEvent(event);
}



function collectEditEvent() {
  return {
    email: document.getElementById("edit-email").value,
    event_name: document.getElementById("edit-name").value,
    performers: document.getElementById("edit-artists").value,
    date: document.getElementById("edit-date").value,
    start_time: document.getElementById("edit-start-time").value,
    end_time: document.getElementById("edit-end-time").value,
    doors_time: document.getElementById("edit-doors-time").value,
    venue: document.getElementById("edit-venue").value,
    venue_details: document.getElementById("edit-accessibility").value,
    attendance_other: document.getElementById("edit-age").value,
    cost: document.getElementById("edit-cost").value,
    links: document.getElementById("edit-links").value || null,
    description: document.getElementById("edit-description").value
  };
}


const btnEl = document.getElementById("approve-btn")


btnEl.addEventListener("click", (e) => {
  e.preventDefault();

  const eventData = collectEditEvent();

  console.log(eventData)
  updateEvent(id, {...eventData, confirmed: true})
// window.location.replace("/admin.html")
});