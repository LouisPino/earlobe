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

// Fetch archive records
const archiveArr = await fetchArchive();

// Target <ul>
const archiveUl = document.querySelector(".archive-list");

// ---------- HELPERS ----------

// Extract "September 2025" from "September 1st, 2025"
function getMonthKey(title) {
  // Split by comma → ["September 1st", " 2025"]
  const [monthDay, year] = title.split(",").map(s => s.trim());

  // Month is first word of "September 1st"
  const month = monthDay.split(" ")[0];

  return `${month} ${year}`;
}

// ---------- GROUP BY MONTH ----------

const grouped = {};

for (const archive of archiveArr) {
  const monthKey = getMonthKey(archive.title);

  if (!grouped[monthKey]) {
    grouped[monthKey] = [];
  }

  grouped[monthKey].push(archive);
}

// ---------- RENDER ----------

// Optional: ensure months render in chronological order
const monthOrder = Object.keys(grouped).sort((a, b) => {
  return new Date(b) - new Date(a);
});

for (const month of monthOrder) {
  const groupLi = document.createElement("li");
  groupLi.className = "archive-group";

  const details = document.createElement("details");
  details.open = false; // collapsed by default

  const summary = document.createElement("summary");
  summary.textContent = month;

  const innerUl = document.createElement("ul");

  for (const archive of grouped[month]) {
    const li = document.createElement("li");
    li.innerHTML = `
      <a class="archive-link" href="${archive.links}" target="_blank" rel="noopener">
        ${archive.title}
      </a>
    `;
    innerUl.appendChild(li);
  }

  details.appendChild(summary);
  details.appendChild(innerUl);
  groupLi.appendChild(details);
  archiveUl.appendChild(groupLi);
}
