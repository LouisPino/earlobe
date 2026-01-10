/**
 * ============================================================
 * SHARED SITE HEADER LOADER
 * ------------------------------------------------------------
 * Dynamically loads the common site header markup from
 * `header.html` and injects it into the page.
 *
 * This allows a single header file to be reused across
 * multiple pages without duplication.
 *
 * Assumes:
 * - `header.html` exists at the site root
 * - An element with id="site-header" exists in the DOM
 * ============================================================
 */
async function loadHeader() {
    // Fetch header markup
    const resp = await fetch("./header.html");

    // Convert response to HTML string
    const html = await resp.text();

    // Inject header into placeholder container
    document.getElementById("site-header").innerHTML = html;
}

// Load header immediately on script execution
loadHeader();
