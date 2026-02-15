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
    const resp = await fetch("./header.html");
    const html = await resp.text();
    document.getElementById("site-header").innerHTML = html;

    const burger = document.getElementById("burgerBtn");
    const nav = document.getElementById("mainNav");

    burger.addEventListener("click", () => {
        nav.classList.toggle("open");
    });
}

loadHeader();
