import { addArchive } from "./dbScript.js";
const archiveBtnEl = document.getElementById("archive-submit-btn")


function collectArchiveData() {
  return {
    title: document.getElementById("archive-title").value || null,
    links: document.getElementById("archive-link").value || null,
  };
}


archiveBtnEl.addEventListener("click", async (e) => {
  e.preventDefault();
  const archiveData = collectArchiveData();


  await addArchive(archiveData)
  window.location.reload()
});



const PASSWORD = "Earl0be2025";
function getPassword() {

  const input = prompt("Enter admin password:");
  if (input !== PASSWORD) {
    document.body.innerHTML = "";
    alert("Access denied");
    getPassword()
  }
}

getPassword()
