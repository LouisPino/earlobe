/**
 * ============================================================
 * LISTENTO (listentoronto.com) — RECORDINGS LOOKUP
 * ------------------------------------------------------------
 * Reads albums for an event's performers from the ListenTO API
 * (GET /artists/albums?artist=…&artist=…).
 *
 * This is a nice-to-have on the event page: every failure here
 * is swallowed and the section simply stays hidden.
 * ============================================================
 */

// The ListenTO API, not listentoronto.com — that host is the Netlify SPA, whose
// /* -> /index.html rewrite answers every path with HTML and a 200.
// Local dev backend is http://localhost:5000.
const LISTENTO_API = "https://listento-e3aab369f5b8.herokuapp.com";

// Trailing slashes here would double up in the request path, which Express
// won't match — so the base is normalized rather than trusted as written.
const API_BASE = LISTENTO_API.replace(/\/+$/, "");

// The API caps a request at 25 names; no event needs anywhere near that.
const MAX_ARTISTS = 10;

// Console tracing for the lookup. Flip to false to silence it — warnings and
// errors below are logged either way, since those mean the section stayed empty.
const DEBUG = true;

function log(...args) {
    if (DEBUG) console.log("[ListenTO]", ...args);
}

/**
 * Splits the freeform performers field into individual artist names.
 * Admins type things like "Artist One, Artist Two & Artist Three", and may
 * have wrapped names in HTML, so tags come out before splitting.
 */
export function performerNames(performers) {
    if (!performers) {
        log("no performers on this event — nothing to look up");
        return [];
    }

    const text = performers.replace(/<[^>]*>/g, " ");

    const names = text
        .split(/[,&/]|\bwith\b/i)
        .map(name => name.trim().replace(/\s+/g, " "))
        .filter(Boolean);

    const unique = [...new Set(names)].slice(0, MAX_ARTISTS);

    log("performers", JSON.stringify(performers), "->", unique);

    return unique;
}

/**
 * Looks up albums for a list of artist names.
 * Resolves to the API's `results` array, or [] for any failure.
 */
export async function fetchAlbumsByArtists(names) {
    if (!names.length) return [];

    const query = names.map(name => `artist=${encodeURIComponent(name)}`).join("&");
    const url = `${API_BASE}/artists/albums?${query}`;

    log("GET", url);

    const startedAt = performance.now();

    try {
        const resp = await fetch(url);

        const ms = Math.round(performance.now() - startedAt);
        const contentType = resp.headers.get("content-type") || "(none)";

        log(`${resp.status} ${resp.statusText} · ${contentType} · ${ms}ms`);

        if (!resp.ok) {
            console.warn("[ListenTO] request failed:", resp.status, url);
            return [];
        }

        // Read as text first so a non-JSON body can be shown rather than
        // dying inside resp.json() as an unhelpful parse error.
        const body = await resp.text();

        if (!contentType.includes("application/json")) {
            console.warn(
                `[ListenTO] expected JSON, got ${contentType}. Is LISTENTO_API pointing at` +
                ` the API rather than the website? First 200 chars:`,
                body.slice(0, 200)
            );
            return [];
        }

        const data = JSON.parse(body);
        log("response", data);

        const results = data.results || [];

        results.forEach(result => {
            log(`  "${result.query}" matched "${result.artist}" — ${(result.albums || []).length} album(s)`);
        });

        if (data.notFound?.length) {
            log("  no match on ListenTO:", data.notFound);
        }

        if (!results.length && Array.isArray(data)) {
            console.warn(
                "[ListenTO] got a plain array, not { results, notFound } — the deployed API" +
                " is still answering this as /artists/:artist. Is the new route deployed?"
            );
        }

        return results;
    } catch (err) {
        console.error("[ListenTO] lookup failed:", err);
        return [];
    }
}
