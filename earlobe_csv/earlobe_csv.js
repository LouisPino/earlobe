const admin = require('firebase-admin');
const fs = require('fs');
const { Parser } = require('json2csv');

admin.initializeApp({
    credential: admin.credential.cert(require('./serviceKey.json'))
});

const db = admin.firestore();

function formatDate(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

async function exportCollection(name) {
    const now = new Date();
    const twoWeeks = new Date();
    twoWeeks.setDate(now.getDate() + 14);
    now.setDate(now.getDate() - 1);

    const todayStr = formatDate(now);
    const twoWeeksStr = formatDate(twoWeeks);

    const snapshot = await db
        .collection(name)
        .where('date', '>=', todayStr)
        .where('date', '<=', twoWeeksStr)
        .get();

    const rows = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    if (!rows.length) {
        console.log('No events!');
        return
    }
    const parser = new Parser();
    const csv = parser.parse(rows);

    fs.writeFileSync(`${name}.csv`, csv);
    console.log(`Exported ${rows.length} rows`);
}

exportCollection('event');
