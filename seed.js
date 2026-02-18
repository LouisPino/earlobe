import { addEvent } from "./dbScript.js";
import { venueOptions } from "./script.js";
//SEEDING

function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDate(daysAhead = 30) {
    const d = new Date();
    d.setDate(d.getDate() + randInt(0, daysAhead));
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
}


function randomCost() {
    const type = rand(["free", "pwyc", "fixed"]);

    if (type === "free") return "Free";

    if (type === "pwyc") {
        return Math.random() > 0.5
            ? `PWYC-$${randInt(5, 30)}`
            : "PWYC";
    }

    return `$${randInt(5, 40)}`;
}

function randomTime() {
    const hour = randInt(16, 23);
    return `${hour.toString().padStart(2, "0")}:00`;
}

function randomAttendanceOther() {
    const options = [
        "18+",
        "19+",
        "21+",
        "All ages w/ guardian",
        "Members only",
        "Invite only"
    ];

    // 50% chance empty
    if (Math.random() < 0.5) return "";

    return options[Math.floor(Math.random() * options.length)];
}



export async function seedEvents(count = 5) {
    const names = [
        "Noise Night",
        "Modular Jam",
        "Ambient Evening",
        "Experimental Set",
        "Drone Session",
        "Improvised Duo",
        "",
        "",
        "Tape Loop Showcase",
        "",
        "",
    ];

    const performers = [
        "Duo Cichorium and Wilderness Adventure Ride",
        "Aiyun Huang, David Schotzko, Germaine Liu, Joe Sorbara, Mark Zurawinski, Mira Martin-Gray ",
        "The Cluttertones (Lina Allemano / Rob Clutton / Ryan Driver / Tim Posgate)",
        "Solo Performer",
        "Guest Ensemble"
    ];

    const attendanceTypes = ["19_plus", "all_ages", "other"];

    for (let i = 0; i < count; i++) {
        const venueOpt = rand(venueOptions);

        const eventObj = {
            email: "seed@earlobe.dev",
            event_name: rand(names),
            performers: rand(performers),
            date: randDate(45),
            start_time: randomTime(),
            end_time: null,
            doors_time: null,
            venue: null,
            venueId: venueOpt.id,
            attendance: rand(attendanceTypes),
            attendance_other: randomAttendanceOther(),
            cost: randomCost(),
            links: null,
            description: "Auto-generated seed event.",
            createdAt: new Date(),
            imageUrl: null
        };

        try {
            await addEvent(eventObj);
            console.log(`Seeded ${i + 1}/${count}`);
        } catch (err) {
            console.error("Seed error:", err);
        }
    }

    console.log("Seeding complete");
}


window.seedEvents = seedEvents