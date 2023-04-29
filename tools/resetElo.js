
const { ObjectID } = require("bson");

const { processMatchAllCategories, ELO_CATEGORIES } = require('./../Elo/EloHelper.js');

const { MongoClient, ReturnDocument, Db } = require("mongodb");
const CONFIG = require("./../config.json");
const { MONGODB_URL_STRING } = require("./../config.json");
let mongoClient = new MongoClient(MONGODB_URL_STRING);


async function initializeELO(client) {
    console.log("Initializing elo...");
    const playerCollection = client.db("mhtest").collection("Players");
    const result = await playerCollection.updateMany(
        { },
        {
            $set: { ELORating: {
                // 'Overall': {
                //     'ELOPoints': 1000,
                //     'Timeline': []
                // },
                // 'SCS': {
                //     'ELOPoints': 1000,
                //     'Timeline': []
                // }
            }} 
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
    while (await cursor.hasNext()) {
        const match = await cursor.next();
        console.log(n, ' Processing ELO for ', match._id);
        n += 1;
        await processMatchAllCategories(client, match);
    }
}


async function start() {
    try {
        // Connect to mongodb
        console.log("Connecting to db...")
        await mongoClient.connect();
        console.log("Connected.");
        await initializeELO(mongoClient);
        await rateAllMatches(mongoClient);

    } finally {
        mongoClient.close();
    }
}
start().catch(console.dir);