import { addArchive, addVenue, deleteEventById, deleteVenueById, fetchVenues, fetchVenuesWithId, updateVenue } from "./dbScript.js";


/**
 * ============================================================
 * ARCHIVE SUBMISSION (ADMIN ONLY UI)
 * ------------------------------------------------------------
 * This script powers the "Add an Archive" form on the admin page.
 *
 * IMPORTANT SECURITY NOTE:
 * ------------------------
 * The password check below is CLIENT-SIDE ONLY.
 * It provides basic friction for casual users but DOES NOT
 * provide real security. Anyone with DevTools access can bypass it.
 *
 * ALL REAL SECURITY MUST BE ENFORCED SERVER-SIDE (dbScript / backend).
 * ============================================================
 */

const archiveBtnEl = document.getElementById("archive-submit-btn");

/**
 * Collects archive form values into a normalized object.
 * Nulls are used instead of empty strings to keep DB data clean.
 */
function collectArchiveData() {
  return {
    title: document.getElementById("archive-title").value || null,
    links: document.getElementById("archive-link").value || null,
  };
}

/**
 * Handles archive submission.
 * Prevents default form submission, writes archive to DB,
 * then reloads the page to reflect the updated state.
 */
archiveBtnEl.addEventListener("click", async (e) => {
  e.preventDefault();

  const archiveData = collectArchiveData();

  await addArchive(archiveData);

  // Simple refresh after successful write
  window.location.reload();
});

/**
 * ============================================================
 * CLIENT-SIDE ADMIN PASSWORD GATE (WEAK PROTECTION)
 * ------------------------------------------------------------
 * This is NOT real authentication.
 *
 * - Password is visible in source
 * - Can be bypassed via DevTools
 * - Only intended as a convenience / speed bump
 *
 * DO NOT rely on this for actual security.
 * ============================================================
 */

const PASSWORD = "Earl0be2025";
const AUTH_KEY = "admin_unlocked";

const modal = document.getElementById("admin-auth-modal");
const input = document.getElementById("admin-password-input");
const submitBtn = document.getElementById("admin-auth-submit");
const errorMsg = document.getElementById("admin-auth-error");

let pendingDeleteVenueId = null;

function openAuthModal() {
  modal.hidden = false;
  input.value = "";
  errorMsg.hidden = true;
  input.focus();
}

function closeAuthModal() {
  modal.hidden = true;
}

function checkPassword() {
  if (input.value === PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, "true");
    closeAuthModal();
  } else {
    errorMsg.hidden = false;
    input.value = "";
    input.focus();
  }
}

function requireAdmin() {
  if (sessionStorage.getItem(AUTH_KEY) !== "true") {
    openAuthModal();
  }
}

// Submit handlers
submitBtn.addEventListener("click", checkPassword);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    checkPassword();
  }
});

requireAdmin();


let pendingDeleteEventId = null;

// Event delegation (works for dynamically created cards)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-event");
  if (!btn) return;

  // Store the event ID (attach data-event-id to button)
  pendingDeleteEventId = btn.dataset.eventId;

  openDeleteModal();
});

function openDeleteModal() {
  const modal = document.getElementById("delete-modal");
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeDeleteModal() {
  const modal = document.getElementById("delete-modal");
  modal.hidden = true;
  document.body.style.overflow = "";
  pendingDeleteEventId = null;
}

// Cancel
document.getElementById("cancel-delete").addEventListener("click", closeDeleteModal);

// Click outside dialog
document.querySelector(".modal-backdrop").addEventListener("click", closeDeleteModal);

// Confirm
document.getElementById("confirm-delete").addEventListener("click", async () => {
  if (!pendingDeleteEventId) return;

  try {
    await deleteEventById(pendingDeleteEventId); // your existing delete function
    closeDeleteModal();
    location.reload(); // or remove the card from DOM
  } catch (err) {
    alert("Failed to delete event.");
    console.error(err);
  }
});


//venue management
const container = document.querySelector(".venues-container");
const venueDeleteModal = document.getElementById("venue-delete-modal");
const confirmDeleteButton = document.getElementById("venue-delete-confirm");
const cancelDeleteButton = document.getElementById("cancel-venue-delete");
cancelDeleteButton.addEventListener("click", () => {
  venueDeleteModal.hidden = true
  pendingDeleteVenueId = null
})



async function renderVenues() {
  try {
    const venues = await fetchVenuesWithId();
    // const venues = rawVenues.filter(v => !v.data.approved);

    container.innerHTML = "";

    venues.forEach(v => {
      const card = document.createElement("div");
      card.className = "venue-card";
      if (v.data.approved) {
        card.classList.add("approved")
      } else {
        card.classList.add("unapproved")

      }
      card.dataset.id = v.id;
      const radioGroupName = `accessibility-emoji-${v.id}`;

      card.innerHTML = `
        <label>NAME</label>
        <input class="venue-name" value="${v.data.name || ""}"/>

        <label>ADDRESS</label>
        <textarea class="venue-address">${v.data.address || ""}</textarea>

        <label>ACCESSIBILITY</label>
        <textarea class="venue-accessibility">${v.data.accessibility || ""}</textarea>
 <fieldset class="accessibility-group">
  <label>
    <input type="radio" name="${radioGroupName}" value="accessible"  ${v.data.accessibilityEmoji === "♿️" ? "checked" : ""}/>
    ♿️ Accessible
  </label>

  <label>
    <input type="radio" name="${radioGroupName}" value="caveats"  ${v.data.accessibilityEmoji === "☑️" ? "checked" : ""} />
    ☑️ Access w/ caveats
  </label>

  <label>
    <input type="radio" name="${radioGroupName}" value="stairs"  ${v.data.accessibilityEmoji === "📶" ? "checked" : ""}/>
    📶 Stairs / not accessible
  </label>

  <label>
    <input type="radio" name="${radioGroupName}" value="unknown"  ${v.data.accessibilityEmoji === "❓" ? "checked" : ""}/>
    ❓ Accessibility unknown
  </label>
</fieldset>



        
        <label>ACCESSIBILITY LINK</label>
        <input class="venue-access-link" value="${v.data.accessLink || ""}"/>
        <label>LINK TO WEBSITE</label>
        <input class="venue-link" value="${v.data.link || ""}"/>
        
        <label>MAP LINK</label>
        <input class="venue-map-link" value="${v.data.mapLink || ""}"/>
        <label>EXTRA NOTES</label>
        <textarea class="venue-notes">${v.data.notes || ""}</textarea>

        <button class="venue-submit-btn">APPROVE VENUE</button>
        <button class="venue-delete-btn">DELETE VENUE</button>
      `;

      const button = card.querySelector(".venue-submit-btn");
      const deleteButton = card.querySelector(".venue-delete-btn");

      button.addEventListener("click", async () => {
        const id = card.dataset.id;

        const name = card.querySelector(".venue-name").value.trim();
        const address = card.querySelector(".venue-address").value.trim();
        const accessibility = card.querySelector(".venue-accessibility").value.trim();
        const link = card.querySelector(".venue-link").value.trim();
        const mapLink = card.querySelector(".venue-map-link").value.trim();
        const notes = card.querySelector(".venue-notes").value.trim();
        const accessLink = card.querySelector(".venue-access-link").value.trim();
        const accessibilityValue =
          card.querySelector(`input[name="${radioGroupName}"]:checked`)?.value || null;

        let accessibilityEmoji = null;

        accessibilityEmoji = getAccessibilityEmoji(accessibilityValue)





        // VALIDATION
        if (!name || !address || !accessibility) {
          alert("Name, Address, and Accessibility are required.");
          return;
        }

        const payload = {
          name,
          address,
          accessibility,
          accessibilityEmoji,
          notes,
          mapLink,
          accessLink,
          link: link || null,
          approved: true,
          updatedAt: new Date()
        };

        try {
          button.disabled = true;
          button.textContent = "Saving...";

          await updateVenue(id, payload);

          window.location.reload();
        } catch (err) {
          console.error(err);
          alert("Failed to update venue");
          button.disabled = false;
          button.textContent = "APPROVE VENUE";
        }
      });

      deleteButton.addEventListener("click", async () => {
        pendingDeleteVenueId = card.dataset.id;
        venueDeleteModal.hidden = false
        confirmDeleteButton.addEventListener("click", async () => {
          await deleteVenueById(pendingDeleteVenueId)
          window.location.reload()
        })
      });

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Failed to load venues", err);
    container.innerHTML = "<p>Could not load venues.</p>";
  }
}

renderVenues();


function getAccessibilityEmoji(value) {
  switch (value) {
    case "accessible": return "♿️";
    case "caveats": return "☑️";
    case "stairs": return "📶";
    case "unknown": return "❓";
    default: return null;
  }
}


const openAddVenueBtn = document.getElementById("open-add-venue-btn");
const createVenueBtn = document.getElementById("create-venue-btn");


openAddVenueBtn.addEventListener("click", () => {
  document.getElementById("add-venue-modal").hidden = false
})

createVenueBtn.addEventListener("click", async () => {
  const name = document.getElementById("new-venue-name").value.trim();
  const address = document.getElementById("new-venue-address").value.trim();
  const accessibility = document.getElementById("new-venue-accessibility").value.trim();
  const notes = document.getElementById("new-venue-notes").value.trim();
  const link = document.getElementById("new-venue-link").value.trim();
  const mapLink = document.getElementById("new-venue-map-link").value.trim();
  const accessLink = document.getElementById("new-venue-access-link").value.trim();

  const accessibilityValue =
    document.querySelector('#new-accessibility-group input[name="new-accessibility"]:checked')?.value || null;

  const accessibilityEmoji = getAccessibilityEmoji(accessibilityValue);

  if (!name || !address || !accessibility) {
    alert("Name, Address, and Accessibility are required.");
    return;
  }

  const payload = {
    name,
    address,
    accessibility,
    accessibilityEmoji,
    notes,
    mapLink,
    accessLink,
    link: link || null,
    approved: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    createVenueBtn.disabled = true;
    createVenueBtn.textContent = "Saving...";

    await addVenue(payload);

    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Failed to create venue");
    createVenueBtn.disabled = false;
    createVenueBtn.textContent = "Create Venue";
  }
});
