import { fetchArchive } from "./dbScript.js";

const archiveArr = await fetchArchive()
const archiveUl = document.querySelector(".archive-list")
console.log(archiveArr)

for (const archive of archiveArr) {
    const archiveEl = document.createElement("li")
    archiveEl.innerHTML = `
    <a href=${archive.links} target="_blank">${archive.title}</a>
    `
    archiveUl.appendChild(archiveEl)
}