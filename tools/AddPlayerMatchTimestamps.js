const { MongoClient } = require("mongodb");
const { MONGODB_URL_STRING } = require("./../config.json");
const mongoClient = new MongoClient(MONGODB_URL_STRING);


async function addTimestamps(client) {
    const matchCollection = client.db("mhtest").collection("Matches");
    const playerCollection = client.db("mhtest").collection("Players")
    const cursor =  matchCollection.find(
        {}
    );
    
    let n = 1
    while (await cursor.hasNext()) {
        const match = await cursor.next();
        const timestamp = match.Timestamp;
        process.stdout.write(n + "Processing " + match._id + "\r");
            n += 1;
        for (const playerId of match.FlatPlayers) {
            await playerCollection.updateOne(
                {_id: playerId},
                {$set: {
                    LastMatchTimestamp: timestamp,
                }});
        }
    }
}


async function start() {
    try {
        // Connect to mongodb
        console.log("Connecting to db...")
        await mongoClient.connect();
        console.log("Connected.");
        await addTimestamps(mongoClient);
        // await getShipWinrates(mongoClient);
        // await getShipLoadouts(mongoClient);
        // await getShipMatchupStats(mongoClient);

    } finally {
        mongoClient.close();
    }
}
start().catch(console.dir);