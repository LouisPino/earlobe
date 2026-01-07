async function loadHeader() {
    const resp = await fetch("./header.html");
    const html = await resp.text();
    document.getElementById("site-header").innerHTML = html;
}

loadHeader();
