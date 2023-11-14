
const { ObjectID } = require("bson");

const { MongoClient, ReturnDocument, Db } = require("mongodb");
const CONFIG = require("./../config.json");
const { MONGODB_URL_STRING } = require("./../config.json");
let mongoClient = new MongoClient(MONGODB_URL_STRING);

const MatchTagger = require('../Server/MatchHistory/MatchTagger.js');

async function reclassifyTags(client) {
    const matchCollection = client.db("mhtest").collection("Matches");
    const cursor =  matchCollection.find(
        {}
    );
    let n = 0
    let lastSnapshotTimestamp = -1;
    while (await cursor.hasNext()) {
        const match = await cursor.next();
        n += 1;
        // process.stdout.write(n + " Processing " + match._id + "\r");
        const scs = MatchTagger.isSCS(match);

        const oldSCS = (match.MatchTags.includes('SCS'));
        const date = new Date(match.Timestamp);
        if (scs != oldSCS){
            console.log(scs, ": ", date.toLocaleTimeString(), " | ", date.getTimezoneOffset());
            if (scs) {

                let res = await matchCollection.updateOne(
                    {_id: match._id},
                    { $push: {MatchTags: 'SCS'}}
                );
            }
            else {
                await matchCollection.updateOne(
                    {_id: match._id},
                    { $pull: {MatchTags: 'SCS'}}
                );
            }
        }
        // console.log(new Date(match.Timestamp));

        // break;
    }
    console.log("\nDone.");
}




async function start() {
    try {
        // Connect to mongodb
        console.log("Connecting to db...")
        await mongoClient.connect();
        console.log("Connected.");
        await reclassifyTags(mongoClient);

    } finally {
        mongoClient.close();
    }
}
start().catch(console.dir);