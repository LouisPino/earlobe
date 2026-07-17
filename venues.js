import { fetchVenues } from "./dbScript.js";

let approvedVenues = [];

function renderVenueCards(venues) {
    const container = document.getElementById("venues-container");
    container.innerHTML = "";

    if (!venues.length) {
        container.innerHTML = "<p>No venues found.</p>";
        return;
    }

    venues.forEach(v => {
        const card = document.createElement("div");
        card.className = "venue-card";
        card.innerHTML = `
                <div class="venue-name">${v.name}</div>
                <p class="venue-address">${v.address}</p>
                ${v.mapLink ? `<a href="${v.mapLink}" target="_blank">Open in Maps</a>` : ""}
                <div class="venue-accessibility-title">Accessibility ${v.accessibilityEmoji || ""}</div>
                <div class="venue-accessibility">${v.accessibility || "No accessibility info"}</div>
                ${v.accessLink ? `<div class="venue-access-link"><a href="${v.accessLink}" target="_blank">Accessibility Details</a></div>` : ""}
                ${v.notes ? `<div class="venue-notes">Notes: ${v.notes}</div>` : ""}
                ${v.link ? `<a href="${v.link}" target="_blank">Visit Website</a>` : ""}
            `;
        container.appendChild(card);
    });
}

async function renderVenues() {
    const container = document.getElementById("venues-container");
    container.innerHTML = "<p class='loading'>Loading…</p>";
    try {
        const rawVenues = await fetchVenues();
        approvedVenues = rawVenues.filter((v) => v.approved);
        renderVenueCards(approvedVenues);
    } catch (err) {
        console.error("Failed to load venues", err);
        container.innerHTML = "<p>Could not load venues.</p>";
    }
}

function filterVenues(query) {
    const term = query.trim().toLowerCase();
    const filtered = term
        ? approvedVenues.filter(v => v.name?.toLowerCase().includes(term))
        : approvedVenues;
    renderVenueCards(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
    renderVenues();

    const searchInput = document.getElementById("venue-search");
    searchInput.addEventListener("input", () => {
        filterVenues(searchInput.value);
    });
});
