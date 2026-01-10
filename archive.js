import { fetchArchive } from "./dbScript.js";

/**
 * ============================================================
 * ARCHIVE LIST RENDERING
 * ------------------------------------------------------------
 * Fetches archive entries from the database and renders them
 * as a simple list of external links.
 *
 * Assumptions:
 * - fetchArchive() returns an array of objects with:
 *   { title: string, links: string }
 * - `links` is a valid URL
 * - `.archive-list` exists in the DOM
 * ============================================================
 */

// Fetch archive records from the database
const archiveArr = await fetchArchive();

// Target <ul> that will contain archive entries
const archiveUl = document.querySelector(".archive-list");

// Log fetched data for debugging / verification
console.log(archiveArr);

// Create a list item for each archive entry
for (const archive of archiveArr) {
    const archiveEl = document.createElement("li");

    // Each archive renders as a clickable external link
    archiveEl.innerHTML = `
    <a href="${archive.links}" target="_blank" rel="noopener">
      ${archive.title}
    </a>
  `;

    archiveUl.appendChild(archiveEl);
}
