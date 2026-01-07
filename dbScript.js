import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    getDocs,
    addDoc,
    getDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyDFlDvq6cy2VdcLq8gTSDJ2-Mpr8cADu5U",
    authDomain: "earlobe-90d1e.firebaseapp.com",
    projectId: "earlobe-90d1e",
    storageBucket: "earlobe-90d1e.firebasestorage.app",
    messagingSenderId: "957677817930",
    appId: "1:957677817930:web:3339e2337f6cb5f15a96b3"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const eventCollection = collection(db, "event");
const archiveCollection = collection(db, "archive");

export async function addEvent(obj) {
    const resp = await addDoc(eventCollection, {...obj, confirmed: false})
    console.log(resp)
}


export async function fetchEvents() {
    let eventsArr = []
    const q = query(eventCollection);
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        eventsArr.push({data:doc.data(), id: doc.id})
    });
    return eventsArr
}


export async function getEventById(id) {
  const eventRef = doc(eventCollection, id);
  const docSnap = await getDoc(eventRef);

  return docSnap.exists()
    ? { id: docSnap.id, ...docSnap.data() }
    : null;
}



export async function updateEvent(id, eventData){
const updateResp = await updateDoc(doc(eventCollection, id), eventData);
  console.log(updateResp)
}



export async function fetchArchive() {
    let archiveArr = []
    const q = query(archiveCollection);
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        archiveArr.push(doc.data())
    });
    const sorted = archiveArr.sort((a, b)=>{return b.createdAt - a.createdAt})
    return sorted
}


export async function addArchive(obj) {
    const resp = await addDoc(archiveCollection, {...obj, createdAt: new Date()})
    console.log(resp)
}