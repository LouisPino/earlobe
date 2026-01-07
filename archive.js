import { fetchArchive } from "./dbScript.js";

const archiveArr = await fetchArchive()
const archiveUl = document.querySelector(".archive-list")


for(const archive of archiveArr){
    const archiveEl = document.createElement("li")
    archiveEl.innerHTML = `
    <a href=${archive.link} target="_blank">${archive.title}</a>
    `
    archiveUl.appendChild(archiveEl)
}