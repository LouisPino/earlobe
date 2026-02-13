import { fetchVenues } from "./dbScript.js";

const container = document.getElementById("venues-container");

async function renderVenues() {
    try {
        const rawVenues = await fetchVenues();
        const venues = rawVenues.filter((v) => v.approved)
        venues.sort((a, b) => a.name.localeCompare(b.name));

        container.innerHTML = "";

        venues.forEach(v => {
            const card = document.createElement("div");
            card.className = "venue-card";
            card.innerHTML = `
                    <div class="venue-name">${v.name}</div>
                    <div class="venue-address">${v.address}</div>
                    <div class="venue-accessibility-title">Accessibility</div>
                    <div class="venue-accessibility">${v.accessibility || "No accessibility info"}</div>
                    ${v.notes ? `<div class="venue-notes">Notes: ${v.notes}</div>` : ""}
                    ${v.link ? `<a href="${v.link}" target="_blank">Visit Website</a>` : ""}


                `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Failed to load venues", err);
        container.innerHTML = "<p>Could not load venues.</p>";
    }
}

renderVenues();