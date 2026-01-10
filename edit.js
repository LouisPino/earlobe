import { getEventById, updateEvent } from "./dbScript.js";

const queryString = window.location.search;
const params = new URLSearchParams(queryString);
const id = params.get("id");
const btnEl = document.getElementById("approve-btn")

const event = await getEventById(id);

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
  populateAttendance(event);
}

function collectEditEvent() {
  const selectedAttendance = document.querySelector(
    'input[name="attendance"]:checked'
  );

  return {
    email: document.getElementById("edit-email").value || null,
    event_name: document.getElementById("edit-name").value || null,
    performers: document.getElementById("edit-artists").value || null,
    date: document.getElementById("edit-date").value || null,
    start_time: document.getElementById("edit-start-time").value || null,
    end_time: document.getElementById("edit-end-time").value || null,
    doors_time: document.getElementById("edit-doors-time").value || null,
    venue: document.getElementById("edit-venue").value || null,
    venue_details: document.getElementById("edit-accessibility").value || null,

    attendance: selectedAttendance?.value || null,
    attendance_other:
      selectedAttendance?.value === "other"
        ? document.getElementById("attendance-other-text").value || null
        : null,

    cost: document.getElementById("edit-cost").value || null,
    links: document.getElementById("edit-links").value || null,
    description: document.getElementById("edit-description").value || null
  };
}




btnEl.addEventListener("click", async (e) => {
  e.preventDefault();

  const eventData = collectEditEvent();

  await updateEvent(id, { ...eventData, confirmed: true })
  window.location.replace("./admin.html")
});


function populateAttendance(event) {
  const radios = document.querySelectorAll('input[name="attendance"]');
  const otherInput = document.getElementById("attendance-other-text");

  radios.forEach(r => r.checked = false);
  otherInput.value = "";
  otherInput.disabled = true;

  if (event.attendance) {
    const selected = document.querySelector(
      `input[name="attendance"][value="${event.attendance}"]`
    );

    if (selected) {
      selected.checked = true;

      if (event.attendance === "other") {
        otherInput.disabled = false;
        otherInput.value = event.attendance_other || "";
      }
    }
  }
}


const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
const attendanceOtherInput = document.getElementById("attendance-other-text");

attendanceRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    if (radio.value === "other") {
      attendanceOtherInput.disabled = false;
      attendanceOtherInput.focus();
    } else {
      attendanceOtherInput.disabled = true;
      attendanceOtherInput.value = "";
    }
  });
});
