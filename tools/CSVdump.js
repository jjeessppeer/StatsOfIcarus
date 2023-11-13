const { MongoClient, ReturnDocument, Db } = require("mongodb");
const { MONGODB_URL_STRING } = require("./../config.json");
const mongoClient = new MongoClient(MONGODB_URL_STRING);
const { getShipLoadouts, getShipMatchupStats, generateSearchStrings, loadoutSearchObj, generateSearchTagArr } = require('./../Server/ShipStats/ShipStats.js');
const fs = require('fs');



async function csvDump() {
    const matchCollection = mongoClient.db("mhtest").collection("Matches");
    const shipCollection = mongoClient.db("mhtest").collection("Ships");
    const gunCollection = mongoClient.db("mhtest").collection("Items-Guns");
    const shipItemCollection = mongoClient.db("mhtest").collection("Items-Ships");


    const cursor =  matchCollection.find(
        {}
    );
    let n = 1;
    const matches = [];
    fs.writeFileSync('MatchDumpNumbers.csv', "");
    fs.writeFileSync('MatchDumpStrings.csv', "");
    var logger = fs.createWriteStream('MatchDumpNumbers.csv', {
        flags: 'a' // 'a' means appending (old data will be preserved)
    });
    var logger2 = fs.createWriteStream('MatchDumpStrings.csv', {
        flags: 'a' // 'a' means appending (old data will be preserved)
    });

    const header = "Timestamp,MapId,GameMode,T1_points,T2_points,T1S1_model,T1S2_model,T2S1_model,T2S2_model,T1S1_loadout,T1S2_loadout,T2S1_loadout,T2S2_loadout";
    logger.write(header + "\n");
    logger2.write(header + "\n");
    while (await cursor.hasNext()) {
        const match = await cursor.next();
        console.log(n);
        if (match.TeamSize != 2 || match.TeamCount != 2 || !match.ShipsFull) continue;

        const models = [];
        const loadouts = [];
        const modelNames = [];
        const loadoutNames = [];
        for (let i=0; i<2; i++) {
            for (let j=0; j<2; j++) {
                let ship = await shipCollection.findOne({_id: match.Ships[i][j]});

                models.push(ship.ShipModel);
                loadouts.push("\""+JSON.stringify(ship.Loadout)+"\"");

                const loadoutNameArr = [];
                for (const gunId of ship.Loadout) {
                    const gun = await gunCollection.findOne({_id: gunId});
                    loadoutNameArr.push(gun.Name);
                }
                loadoutNames.push("\""+JSON.stringify(loadoutNameArr).replaceAll('"', '')+"\"");
                let shipItem = await shipItemCollection.findOne({_id: ship.ShipModel});
                modelNames.push(shipItem.Name);
            }
        }
        // console.log(loadouts);
        // console.log(loadoutNames);
        let row = `${match.Timestamp},${match.MapId},${match.GameMode},${match.Scores[0]},${match.Scores[1]},${models[0]},${models[1]},${models[2]},${models[3]},${loadouts[0]},${loadouts[1]},${loadouts[2]},${loadouts[3]}`;
        let row2 = `${match.Timestamp},${match.MapId},${match.GameMode},${match.Scores[0]},${match.Scores[1]},${modelNames[0]},${modelNames[1]},${modelNames[2]},${modelNames[3]},${loadoutNames[0]},${loadoutNames[1]},${loadoutNames[2]},${loadoutNames[3]}`;
        logger.write(row + "\n");
        logger2.write(row2 + "\n");
        // if (n == 10) break;
        n+=1;
        // break;

    }
}

function convertToCSV(arr) {
    const array = [Object.keys(arr[0])].concat(arr)
  
    return array.map(it => {
      return Object.values(it).toString()
    }).join('\n')
  }

async function start() {
    try {
        console.log("Connecting to db...")
        await mongoClient.connect();
        console.log("Connected.");
        await csvDump(mongoClient);

    } finally {
        mongoClient.close();
    }
}
start().catch(console.dir);