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
/**
 * ============================================================
 * THEME TOGGLE (light/dark)
 * ------------------------------------------------------------
 * Defaults to the visitor's OS/browser preference
 * (prefers-color-scheme, handled purely in CSS). A manual choice
 * here is saved to localStorage and stamped as data-theme on
 * <html>, which overrides that default either direction.
 * ============================================================
 */
const THEME_KEY = "earlobe-theme";

function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getCurrentTheme() {
    return localStorage.getItem(THEME_KEY) || getSystemTheme();
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

// Applied immediately (before the header even finishes fetching) so a
// returning visitor's saved choice never flashes the wrong theme.
applyTheme(getCurrentTheme());

function updateThemeToggleIcon(btn) {
    btn.textContent = getCurrentTheme() === "dark" ? "☀️" : "🌙";
}

async function loadHeader() {
    const resp = await fetch("./header.html");
    const html = await resp.text();
    document.getElementById("site-header").innerHTML = html;

    const burger = document.getElementById("burgerBtn");
    const nav = document.getElementById("mainNav");

    burger.addEventListener("click", () => {
        nav.classList.toggle("open");
    });

    const themeToggleBtn = document.getElementById("themeToggleBtn");
    updateThemeToggleIcon(themeToggleBtn);

    themeToggleBtn.addEventListener("click", () => {
        const next = getCurrentTheme() === "dark" ? "light" : "dark";
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
        updateThemeToggleIcon(themeToggleBtn);
    });
}

loadHeader();
