import { fetchVenues } from "./dbScript.js";

const container = document.getElementById("venues-container");

async function renderVenues() {
    try {
        const venues = await fetchVenues();

        container.innerHTML = "";

        venues.forEach(v => {
            const card = document.createElement("div");
            card.className = "venue-card";

            card.innerHTML = `
        <div class="venue-name">${v.name}</div>
        <div class="venue-address">${v.address}</div>
        <div class="venue-accessibility">${v.accessibility || "No accessibility info"}</div>
      `;

            container.appendChild(card);
        });

    } catch (err) {
        console.error("Failed to load venues", err);
        container.innerHTML = "<p>Could not load venues.</p>";
    }
}

renderVenues();
