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

// Target <ul>
const archiveUl = document.querySelector(".archive-list");
archiveUl.innerHTML = "<li class='loading'>Loading…</li>";

// Fetch archive records
const archiveArr = await fetchArchive();
archiveUl.innerHTML = "";

// ---------- HELPERS ----------

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Parse "September 1st, 2025" → Date. Returns null if the title
// doesn't follow the expected format (entries added before the
// admin form enforced it).
function parseArchiveDate(title) {
  if (typeof title !== "string") return null;

  const match = title
    .trim()
    .match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,\s*(\d{4})$/);

  if (!match) return null;

  const [, monthName, day, year] = match;

  const monthIndex = MONTHS.findIndex(
    (m) => m.toLowerCase() === monthName.toLowerCase(),
  );

  if (monthIndex === -1) return null;

  return new Date(Number(year), monthIndex, Number(day));
}

// Extract "September 2025" from "September 1st, 2025"
function getMonthKey(title) {
  const date = parseArchiveDate(title);

  if (date) {
    return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }

  // Fallback for unparseable titles: split by comma → ["September 1st", " 2025"]
  const [monthDay, year] = String(title ?? "").split(",").map((s) => s.trim());

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

// ---------- SORT ----------

// Entries are sorted by the date in their title, not by the order
// they were submitted, so backwards submissions still read in order.
// Titles we can't parse sink to the bottom of their group.
for (const month of Object.keys(grouped)) {
  grouped[month].sort((a, b) => {
    const dateA = parseArchiveDate(a.title);
    const dateB = parseArchiveDate(b.title);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return dateB - dateA; // newest first
  });
}

// Most recent month first; months with no parseable dates go last
const monthOrder = Object.keys(grouped).sort((a, b) => {
  const dateA = parseArchiveDate(grouped[a][0]?.title);
  const dateB = parseArchiveDate(grouped[b][0]?.title);

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return dateB - dateA;
});

// ---------- RENDER ----------

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
