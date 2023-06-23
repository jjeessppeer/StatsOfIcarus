
const { ObjectID } = require("bson");

const { MongoClient, ReturnDocument, Db } = require("mongodb");
const { MONGODB_URL_STRING } = require("./../config.json");
const mongoClient = new MongoClient(MONGODB_URL_STRING);
const { getShipLoadouts, getShipMatchupStats } = require('./../Server/ShipStats/ShipStats.js');

async function addHelperData(client) {
    const matchCollection = client.db("mhtest").collection("Matches");
    const loadoutCollection = client.db("mhtest").collection("Ships")
    const cursor =  matchCollection.find(
        {}
    );
    let n = 1
    while (await cursor.hasNext()) {
        const match = await cursor.next();
        n += 1;
        process.stdout.write(n + "Processing " + match._id + "\r");
        const ships = match.Ships;

        const shipLoadoutsFull = [];
        const shipLoadoutsIndividual = [];
        const shipLoadoutIdStrings = [];
        const shipLoadoutModels = [];
        const shipModelLoadout = [];

        for (let teamIdx = 0; teamIdx < ships.length; teamIdx += 1) {
            // shipLoadoutsIndividual.push([]);

            for (let shipIdx = 0; shipIdx < ships[teamIdx].length; shipIdx += 1) {
                const shipLoadout = [];
                shipLoadoutsIndividual.push(shipLoadout);

                const shipId = ships[teamIdx][shipIdx];
                const shipInfo = await loadoutCollection.findOne({_id: shipId});
                const guns = shipInfo.Loadout;
                const shipModel = shipInfo.ShipModel;

                shipLoadoutIdStrings.push(loadoutIdString(shipModel, guns));
                shipLoadoutModels.push(shipModel);

                shipLoadoutsFull.push(loadoutSearchTag(teamIdx, shipIdx, shipModel));
                shipLoadout.push(loadoutSearchTag(undefined, undefined, shipModel));
                for (let gunIdx = 0; gunIdx < guns.length; gunIdx += 1) {
                    const posStr = gunPosIdString(gunIdx, shipModel, guns[gunIdx], teamIdx, shipIdx);
                    // shipLoadoutsFull.push(posStr);
                    shipLoadoutsFull.push(loadoutSearchTag(teamIdx, shipIdx, undefined, gunIdx, guns[gunIdx]));
                    // shipLoadout.push(gunPosIdString(gunIdx, shipModel, guns[gunIdx]));
                    shipLoadout.push(loadoutSearchTag(undefined, undefined, undefined, gunIdx, guns[gunIdx]));
                }
                shipModelLoadout.push({
                    TeamIdx: teamIdx,
                    ShipIdx: shipIdx,
                    Model: shipModel, 
                    Loadout: loadoutIdString(shipModel, guns), 
                    Tags: shipLoadout});

            }
        }

        await matchCollection.updateOne(
            {_id: match._id},
            { $set: {
                ShipLoadoutsSearchFull: shipLoadoutsFull,
                ShipLoadoutsSearchIndividual: shipLoadoutsIndividual,
                ShipLoadoutsIdStrings: shipLoadoutIdStrings,
                ShipLoadoutsModels: shipModelLoadout,
                // Ship
            }});

        // console.log(shipLoadoutsFull);
        // console.log(shipLoadoutsIndividual);
        // console.log(shipLoadoutIdStrings);
        // break;   
    }
}



async function start() {
    try {
        // Connect to mongodb
        console.log("Connecting to db...")
        await mongoClient.connect();
        console.log("Connected.");
        // await resetLeaderboardDataset(mongoClient);
        // await addHelperData(mongoClient);
        // await getShipWinrates(mongoClient);
        await getShipLoadouts(mongoClient);
        // await getShipMatchupStats(mongoClient);

    } finally {
        mongoClient.close();
    }
}
start().catch(console.dir);