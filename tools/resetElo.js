
const { ObjectID } = require("bson");

const { processMatchAllCategories, ELO_CATEGORIES, createLeaderboardSnapshot } = require('./../Elo/EloHelper.js');

const { MongoClient, ReturnDocument, Db } = require("mongodb");
const CONFIG = require("./../config.json");
const { MONGODB_URL_STRING } = require("./../config.json");
let mongoClient = new MongoClient(MONGODB_URL_STRING);


const LEADERBOARD_SNAPSHOT_INTERVAL = 1000 * 60 * 60 * 24 * 7;

async function resetLeaderboardDataset(client) {
    await client.db("mhtest").collection("EloLeaderboard").deleteMany({});
}

async function initializeELO(client) {
    console.log("Initializing elo...");
    const playerCollection = client.db("mhtest").collection("Players");
    const result = await playerCollection.updateMany(
        { },
        {
            $set: { 
                ELORating: {
                // 'Overall': {
                //     'ELOPoints': 1000,
                //     'Timeline': []
                // },
                // 'SCS': {
                //     'ELOPoints': 1000,
                //     'Timeline': []
                // }
                },
                ELOCategories: []
            } 
        });
    console.log(result);
    console.log("Done.");
}

// Update ratings with for given set of matches.
async function rateAllMatches(client) {
    const matchCollection = client.db("mhtest").collection("Matches");
    const cursor =  matchCollection.find(
        {}
    );
    let n = 1
    let lastSnapshotTimestamp = -1;
    while (await cursor.hasNext()) {
        const match = await cursor.next();
        n += 1;
        const categories = await processMatchAllCategories(client, match);
        // console.log(n, ' Processing ELO for ', match._id);
        process.stdout.write(n + "Processing ELO for " + match._id + "\r");

        // if (lastSnapshotTimestamp == -1) lastSnapshotTimestamp = match.Timestamp;
        // if (match.Timestamp - lastSnapshotTimestamp > LEADERBOARD_SNAPSHOT_INTERVAL) {
        //     lastSnapshotTimestamp = match.Timestamp;
        //     console.log("\nCreating leaderboard snapshot.\n");
        //     for (const cat of categories) {
        //         await createLeaderboardSnapshot(client, cat, lastSnapshotTimestamp)
        //     }
        // }

    }
}


async function start() {
    try {
        // Connect to mongodb
        console.log("Connecting to db...")
        await mongoClient.connect();
        console.log("Connected.");
        // await resetLeaderboardDataset(mongoClient);
        await initializeELO(mongoClient);
        await rateAllMatches(mongoClient);

    } finally {
        mongoClient.close();
    }
}
start().catch(console.dir);