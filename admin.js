import { addArchive, deleteEventById, fetchVenues, fetchVenuesWithId, updateVenue } from "./dbScript.js";


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

async function renderVenues() {
  try {
    const rawVenues = await fetchVenuesWithId();
    const venues = rawVenues.filter(v => !v.data.approved);

    container.innerHTML = "";

    venues.forEach(v => {
      const card = document.createElement("div");
      card.className = "venue-card";
      card.dataset.id = v.id;

      card.innerHTML = `
        <label>NAME</label>
        <input class="venue-name" value="${v.data.name || ""}"/>

        <label>ADDRESS</label>
        <textarea class="venue-address">${v.data.address || ""}</textarea>

        <label>ACCESSIBILITY</label>
        <textarea class="venue-accessibility">${v.data.accessibility || ""}</textarea>
        
        <label>EXTRA NOTES</label>
        <textarea class="venue-notes">${v.data.notes || ""}</textarea>

        <label>LINK</label>
        <input class="venue-link" value="${v.data.link || ""}"/>

        <button class="venue-submit-btn">APPROVE VENUE</button>
      `;

      const button = card.querySelector(".venue-submit-btn");

      button.addEventListener("click", async () => {
        const id = card.dataset.id;

        const name = card.querySelector(".venue-name").value.trim();
        const address = card.querySelector(".venue-address").value.trim();
        const accessibility = card.querySelector(".venue-accessibility").value.trim();
        const link = card.querySelector(".venue-link").value.trim();
        const notes = card.querySelector(".venue-notes").value.trim();

        // VALIDATION
        if (!name || !address || !accessibility) {
          alert("Name, Address, and Accessibility are required.");
          return;
        }

        const payload = {
          name,
          address,
          accessibility,
          notes,
          link: link || null,
          approved: true,
          updatedAt: new Date()
        };

        try {
          button.disabled = true;
          button.textContent = "Saving...";

          await updateVenue(id, payload);

          // remove card after approval
          window.location.reload();
        } catch (err) {
          console.error(err);
          alert("Failed to update venue");
          button.disabled = false;
          button.textContent = "APPROVE VENUE";
        }
      });

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Failed to load venues", err);
    container.innerHTML = "<p>Could not load venues.</p>";
  }
}

renderVenues();