import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    getDocs,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";


// Your web app's Firebase configuration
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

export async function addEvent(obj) {
    console.log(obj)
    const resp = await addDoc(eventCollection, obj)
    console.log(resp)
}



export async function fetchEvents() {
    let eventsArr = []
    const q = query(eventCollection);
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        eventsArr.push(doc.data())
    });
    return eventsArr
}

