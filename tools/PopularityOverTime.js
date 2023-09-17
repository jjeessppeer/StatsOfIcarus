const { ObjectID } = require("bson");

const { MongoClient, ReturnDocument, Db } = require("mongodb");
const { MONGODB_URL_STRING } = require("./../config.json");
const mongoClient = new MongoClient(MONGODB_URL_STRING);
const { getShipLoadouts, getShipMatchupStats, generateSearchStrings, loadoutSearchObj, generateSearchTagArr } = require('./../Server/ShipStats/ShipStats.js');
const fs = require('fs');

async function ratesPerDay(client) {
    const matchCollection = client.db("mhtest").collection("Matches");
    const loadoutCollection = client.db("mhtest").collection("Ships");
    const cursor =  matchCollection.find(
        {}
    );
    
    picks = {}

    let n = 1;
    const matches = [];
    while (await cursor.hasNext()) {
        const match = await cursor.next();
        matches.push(match);
        n += 1;
        process.stdout.write(n + " Processing " + match._id + "\n"); // + "\r"
        // if (n == 500) break;

        const timestamp = match.Timestamp
        for (const shipIdx in match.ShipLoadoutsModels) {
            const loadout = JSON.parse(match.ShipLoadoutsModels[shipIdx].Loadout);
            parseShip(picks, loadout, timestamp);
        }
        // break;

    }

    // console.log(picks);
    // getRollingAvreageArray(picks["s_11"])
    const objArrs = generateRollingAvreages(picks, matches);
    await csvDump(objArrs);
}

function matchesPlayedBetween(startTimestamp, endTimestamp, matches) {
    let count = 0;
    for (const match of matches) {
        // const timestamp = matches[matchId]
        // console.log(startTimestamp, match, endTimestamp);
        if (startTimestamp <= match.Timestamp && match.Timestamp <= endTimestamp) {
            count += 1;
        }
    }
    return count;
}

function parseShip(picks, loadout, timestamp) {
    for (const el of loadout) {
        let id;
        if (el.model) {
            id = "s_" + el.model;
        }
        if (el.gun) {
            id = "g_" + el.gun;
        }
        if (!picks[id]) picks[id] = [];
        picks[id].push(timestamp);

    }

    // const model = loadout[0].model;
    // picks[model].push(timestamp);
}

async function csvDump(objArr) {
    const itemCollection = mongoClient.db("mhtest").collection("Items-Guns");
    let out = "";

    // Add titles
    for (const key in objArr) {
        if (key[0] != 'g') continue;
        // console.log(key.substring(2));
        const item = await itemCollection.findOne({_id: Number(key.substring(2))})
        // console.log(item)
        console.log(key, ": ", objArr[key].length)
        out += item.Name + ",,,,,";
    }
    // Add subtitles
    out += "\n\n\n";
    for (const key in objArr) {
        if (key[0] != 'g') continue;
        out += "Week,Picks,PicksPerMatch,Avreage,,";
    }
    out += "\n"
    for (let line = 0; line < objArr["s_11"].length; line++) {
        for (const key in objArr) {
            if (key[0] != 'g') continue;
            // console.log("AAAA");
            // console.log(objArr[key]);
            // console.log("AAAA");
            out += `${objArr[key][line].Week},${objArr[key][line].Picks},${objArr[key][line].PicksPerMatch},${5*4/21},,`;
        }
        out += "\n"
        // break;
    }
    console.log("CSV dump start...")
    // console.log(out);
    try {
        fs.writeFileSync('statdump.csv', out);
        // file written successfully
    } catch (err) {
        console.error(err);
    }
    console.log("CSV dump end.")

    // for (const key in objArr) {
    //     if (key[0] != 's') continue;
    //     console.log(key);
    // }
}

function convertToCSV(arr) {
    const array = [Object.keys(arr[0])].concat(arr)
  
    return array.map(it => {
      return Object.values(it).toString()
    }).join('\n')
  }

function generateRollingAvreages(picks, matches) {
    const arrs = {};
    for (const key in picks) {
        console.log(key)
        arrs[key] = getRollingAvreageArray(picks[key], matches);
    }
    return arrs;
}

function getRollingAvreageArray(pickArr, matches) {
    console.log("GENERATING ARRAY")
    // const LOOKBACK_TIME_DAYS = 21;
    // const LOOKBACK_TIME_MS = LOOKBACK_TIME_DAYS * 24 * 60 * 60 * 1000;

    const SAMPLE_RES_MS = 24 * 60 * 60 * 1000 * 7;
    const LOOKBACK_TIME_MS = SAMPLE_RES_MS * 4;

    const startTimestamp = matches[0].Timestamp;
    const endTimestamp = matches[matches.length - 1].Timestamp;

    const avgArr = [];
    const cumArr = [];
    const objArr = [];

    let timestamp = startTimestamp;
    let n = 392;
    while(true) {
        timestamp += SAMPLE_RES_MS;
        let sampleStartTimestamp = timestamp - LOOKBACK_TIME_MS;
        // sampleStartTimestamp = Math.max(sampleStartTimestamp, startTimestamp);

        n += 1;
        if (timestamp - startTimestamp < LOOKBACK_TIME_MS) continue;

        let sum = 0;
        for (let i = 0; i < pickArr.length; i++) {
            if (timestamp - pickArr[i] > LOOKBACK_TIME_MS) continue;
            if (timestamp < pickArr[i]) continue;
            sum += 1;
        }

        let sum2 = 0;
        for (let i = 0; i < pickArr.length; i++) {
            if (timestamp - pickArr[i] > SAMPLE_RES_MS) continue;
            if (timestamp < pickArr[i]) continue;
            sum2 += 1;
        }
        // console.log(matches)
        const matchesPlayed = matchesPlayedBetween(sampleStartTimestamp, timestamp, matches);
        // const timespan = Math.min(LOOKBACK_TIME_DAYS, (timestamp - startTimestamp) / 86400000) + 1;

        // avgArr.push(sum / (LOOKBACK_TIME_MS / 86400000) * 7);

        const avg = sum / matchesPlayed;

        avgArr.push(avg);
        cumArr.push(sum2);

        obj = {
            Week: n,
            Picks: sum2,
            // usedRolling: sum,
            PicksPerMatch: avg,
            Avreage: 4/13
            // matches: matchesPlayed,
        }
        objArr.push(obj)

        if (timestamp > endTimestamp) break;
    }
    console.log(JSON.stringify(avgArr))
    console.log("__")
    console.log(JSON.stringify(cumArr))
    // return [avgArr, cumArr, objArr];
    return objArr;

}

async function start() {
    try {
        console.log("Connecting to db...")
        await mongoClient.connect();
        console.log("Connected.");
        await ratesPerDay(mongoClient);

    } finally {
        mongoClient.close();
    }
}
start().catch(console.dir);