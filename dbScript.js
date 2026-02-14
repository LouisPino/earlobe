/**
 * ============================================================
 * FIREBASE INITIALIZATION
 * ------------------------------------------------------------
 * Sets up Firebase App and Firestore connection.
 * Uses Firebase v12 modular SDK via CDN imports.
 * ============================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    getDocs,
    addDoc,
    getDoc,
    doc,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";


/**
 * Firebase project configuration.
 * NOTE: API keys are public identifiers, not secrets.
 * Real security must be enforced via Firestore rules.
 */
const firebaseConfig = {
    apiKey: "AIzaSyDFlDvq6cy2VdcLq8gTSDJ2-Mpr8cADu5U",
    authDomain: "earlobe-90d1e.firebaseapp.com",
    projectId: "earlobe-90d1e",
    storageBucket: "gs://earlobe-90d1e.firebasestorage.app",
    messagingSenderId: "957677817930",
    appId: "1:957677817930:web:3339e2337f6cb5f15a96b3"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

const storage = getStorage(app);

const auth = getAuth(app);
let authReady;

async function ensureAuth() {
    if (!authReady) {
        authReady = signInAnonymously(auth);
    }
    return authReady;
}

/**
 * ============================================================
 * COLLECTION REFERENCES
 * ------------------------------------------------------------
 * Centralized collection handles for reuse across functions.
 * ============================================================
 */

const eventCollection = collection(db, "event");
const archiveCollection = collection(db, "archive");
const venueCollection = collection(db, "venue");

/**
 * ============================================================
 * CREATE / WRITE OPERATIONS
 * ============================================================
 */

/**
 * Adds a new event document.
 * Also creates a venue entry before writing the event.
 *
 * NOTE:
 * - No deduplication is currently performed on venues.
 * - `confirmed` is always initialized to false.
 */
export async function addEvent(obj) {

    const resp = await addDoc(eventCollection, {
        ...obj,
        confirmed: false
    });

    console.log(resp);
}

/**
 * Adds a venue document to the venue collection.
 * Assumes venue object is already normalized.
 */
export async function addVenue(obj) {
    const resp = await addDoc(venueCollection, obj);
    console.log(resp);
}

/**
 * Adds an archive entry.
 * Automatically appends a createdAt timestamp.
 */
export async function addArchive(obj) {
    const resp = await addDoc(archiveCollection, {
        ...obj,
        createdAt: new Date()
    });

    console.log(resp);
}



export async function uploadImage(file) {
    const imageRef = ref(storage, `images/${Date.now()}-${file.name}`);

    await uploadBytes(imageRef, file, {
        contentType: file.type
    });

    return await getDownloadURL(imageRef);
}



/**
 * ============================================================
 * READ / FETCH OPERATIONS
 * ============================================================
 */

/**
 * Fetches all venues and returns them sorted by name.
 *
 * NOTE:
 * - Sorting assumes `name` exists on all venue documents.
 * - Comparator currently uses subtraction; relies on string coercion.
 */
export async function fetchVenues() {
    await ensureAuth();

    let venueArr = [];

    const q = query(venueCollection);
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        venueArr.push(doc.data());
    });
    return venueArr;
}

export async function fetchVenuesWithId() {
    await ensureAuth();

    let venueArr = [];

    const q = query(venueCollection);
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        venueArr.push({ data: doc.data(), id: doc.id });
    });

    const sorted = venueArr.sort((a, b) => {
        return a.name - b.name;
    });

    return sorted;
}


export async function deleteVenueById(id) {
    const venueRef = doc(venueCollection, id);
    const resp = await deleteDoc(venueRef);
    console.log(resp)
    return resp
}


/**
 * Fetches all events.
 * Returns array of objects with:
 * { data: eventData, id: documentId }
 */
export async function fetchEvents() {
    await ensureAuth();

    let eventsArr = [];

    const q = query(eventCollection);
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        eventsArr.push({ data: doc.data(), id: doc.id });
    });

    return eventsArr;
}

/**
 * Fetches a single event by document ID.
 * Returns null if the document does not exist.
 */
export async function getEventById(id) {
    await ensureAuth();

    const eventRef = doc(eventCollection, id);
    const docSnap = await getDoc(eventRef);

    return docSnap.exists()
        ? { id: docSnap.id, ...docSnap.data() }
        : null;
}

export async function deleteEventById(id) {
    const eventRef = doc(eventCollection, id);
    const resp = await deleteDoc(eventRef);
    console.log(resp)
    return resp
}





/**
 * Fetches archive entries sorted by most recent first.
 * Assumes `createdAt` is a Date object.
 */
export async function fetchArchive() {
    let archiveArr = [];

    const q = query(archiveCollection);
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        archiveArr.push(doc.data());
    });

    const sorted = archiveArr.sort((a, b) => {
        return b.createdAt - a.createdAt;
    });

    return sorted;
}

/**
 * ============================================================
 * UPDATE OPERATIONS
 * ============================================================
 */

/**
 * Updates an existing event document by ID.
 * Accepts a partial eventData object.
 */
export async function updateEvent(id, eventData) {
    const updateResp = await updateDoc(
        doc(eventCollection, id),
        eventData
    );

    console.log(updateResp);
}

export async function updateVenue(id, venueData) {
    console.log(
        "ID", id, "DATA", venueData
    )
    const updateResp = await updateDoc(
        doc(venueCollection, id),
        venueData
    );

    console.log(updateResp);
}
