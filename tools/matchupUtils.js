
const { ObjectID } = require("bson");

const { MongoClient, ReturnDocument, Db } = require("mongodb");
const { MONGODB_URL_STRING } = require("./../config.json");
const mongoClient = new MongoClient(MONGODB_URL_STRING);


function generateSearchStrings(target, teamIdx, shipIdx) {
    const tags = [];
    tags.push(loadoutSearchTag(teamIdx, shipIdx, target.Model));
    for (const gunIdx in target.Guns) {
        tags.push(loadoutSearchTag(teamIdx, shipIdx, undefined, Number(gunIdx), target.Guns[gunIdx]));
    }
    return tags;
}

function generateSearchPermutations(targetShip) {
    const t1 = {$or: [
        { $all: generateSearchStrings(targetShip, 0, 0)},
        { $all: generateSearchStrings(targetShip, 0, 0)},
        { $all: generateSearchStrings(targetShip, 0, 0)},
        { $all: generateSearchStrings(targetShip, 0, 0)},
    ]};
    return t1;
}

async function getShipLoadoutRates(client) {
    const matchCollection = client.db("mhtest").collection("Matches");
    // const targetShip = { Model: 16, Guns: {3: 171} }
    const targetShip = { Model: 16}
    // const target = {Model: 11, Guns: {0: 171}};
    // const target = {Model: 16};
    const tags = generateSearchStrings(targetShip, undefined, undefined);
    const pipeline = [
        // { $unwind: '$ShipLoadoutsSearchIndividual'},
        // { $match: { ShipLoadoutsSearchIndividual: { $all: tags}}},

        // Pre filter matches including searched for ship. Only for performence
        { $match: { $or: [
            { ShipLoadoutsSearchFull: { $all: generateSearchStrings(targetShip, 0, 0)}},
            { ShipLoadoutsSearchFull: { $all: generateSearchStrings(targetShip, 0, 1)}},
            { ShipLoadoutsSearchFull: { $all: generateSearchStrings(targetShip, 1, 0)}},
            { ShipLoadoutsSearchFull: { $all: generateSearchStrings(targetShip, 1, 1)}},
        ]}},
        { $match: { TeamCount: 2, TeamSize: 2, ShipsFull: true}},

        { $addFields: {
            MainShip: '$ShipLoadoutsModels',
            OtherShip: '$ShipLoadoutsModels'
        }},

        // Unwind twice to get ship matchup.
        { $unwind: {  path: "$MainShip" }},
        { $match: { 'MainShip.Tags': { $all: generateSearchStrings(targetShip, undefined, undefined)}}},
        { $unwind: { path: "$OtherShip" }},
        
        // Don't compare to self.
        { $match: { $expr: { $or: [
            { $ne: ['$OtherShip.TeamIdx', '$MainShip.TeamIdx']},
            { $ne: ['$OtherShip.ShipIdx', '$MainShip.ShipIdx']}
        ]}}},

        { "$group": { 
            _id: '$OtherShip.Loadout',
            count: {$sum: 1},
            PlayedVs: { $sum: {$cond: [{$ne: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]}, 1, 0]} },
            PlayedWith: { $sum: {$cond: [{$eq: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]}, 1, 0]} },

            WinsVS: { $sum: {$cond: [{ $and: [
                {$ne: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]},
                {$eq: ["$MainShip.TeamIdx", "$Winner"]}
            ]}, 1, 0]}},

            // LostVS: { $sum: {$cond: [{ $and: [
            //     {$ne: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]},
            //     {$ne: ["$MainShip.TeamIdx", "$Winner"]}
            // ]}, 1, 0]}},

            WinsWith: { $sum: {$cond: [{ $and: [
                {$eq: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]},
                {$eq: ["$MainShip.TeamIdx", "$Winner"]}
            ]}, 1, 0]}},

            // LossesWith: { $sum: {$cond: [{ $and: [
            //     {$eq: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]},
            //     {$ne: ["$MainShip.TeamIdx", "$Winner"]}
            // ]}, 1, 0]}},

            // Losses: { $sum: {$cond: [{$eq: ["$MainShip.TeamIdx", "$Winner"]}, 0, 1]} },
            // Wins: { $sum: {$cond: [{$eq: ["$MainShip.TeamIdx", "$Winner"]}, 1, 0]} },
        }},
        { "$sort": {count: -1}},
        // {$limit: 5}
    ];
    // console.log(pipeline);
    let agg = matchCollection.aggregate(pipeline)

    // const exp = await agg.explain('executionStats');
    // console.log(JSON.stringify(exp));
    // console.log(exp['stages'][0]['$cursor']['executionStats']);
    // console.log(JSON.stringify(exp));

    let result = await agg.toArray();
    console.log(result.length);
}

async function getShipWinrates(client) {
    
    const matchCollection = client.db("mhtest").collection("Matches");

    const shipModel = 16;

    const pipeline = [
        { $match: {"ShipLoadoutsModels.Model": shipModel}},
        { "$unwind": {
            path: "$ShipLoadoutsModels",
            includeArrayIndex: "ShipIndex"
        }},

        { $match: { "ShipLoadoutsModels.Model": shipModel }},

        { $addFields: {
            TeamIndex: { $floor: { $divide: [ 
              "$ShipIndex",
              "$TeamCount"
            ]}},
        }},

        { $facet: {
            "Count": [ { "$group": { _id: null, count: { $sum: 1 } } } ],
            "ModelWinrates": [
              { $group: {
                _id: "$ShipLoadoutsModels.Loadout",
                Wins: { $sum: {$cond: [{$eq: ["$TeamIndex", "$Winner"]}, 1, 0]} },
                // Losses: { $sum: {$cond: [{$eq: ["$TeamIndex", "$Winner"]}, 0, 1]} },
                PlayedGames: { $sum: 1 }
              }}
            ]
        }},

        {$unwind: '$ModelWinrates'},
        {$sort: {"ModelWinrates.PlayedGames": -1}}
    ]

    const agg = matchCollection.aggregate(pipeline);
    // const exp = await agg.explain();
    // console.log(exp['stages'][0]['$cursor']['executionStats']);
    // console.log(JSON.stringify(exp));
    // console.log(agg)
    for (let i = 0; i < 5; i++) {
        const result = await agg.next(); 
        console.log(result);
    }
    


}

function gunPosIdString(gunIdx, shipModel, gunId, teamIdx, shipIdx) {
    // const idStr = `T${teamIdx}S${shipIdx}G${gunIdx}M${shipModel}L${gunId}`;
    // return idStr;
    let loadoutObj;
    if (teamIdx != undefined && shipIdx != undefined) {
        loadoutObj = {T: teamIdx, S: shipIdx, G: gunIdx, model: shipModel, gun: gunId};
    }
    else {
        loadoutObj = {G: gunIdx, model: shipModel, gun: gunId};
    }
    return JSON.stringify(loadoutObj);
}

function loadoutSearchTag(teamIdx, shipIdx, modelId, gunIdx, gunId) {
    const loadoutObj = {};
    if (teamIdx != undefined) loadoutObj['T'] = teamIdx;
    if (shipIdx != undefined) loadoutObj['S'] = shipIdx;
    if (modelId != undefined) {
        loadoutObj['model'] = modelId;
    }
    if (gunIdx != undefined) {
        loadoutObj['G'] = gunIdx;
        loadoutObj['gun'] = gunId;
    }
    return JSON.stringify(loadoutObj);
}

function loadoutIdString(shipModel, guns) {
    return JSON.stringify({M: shipModel, G: guns});
}

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
        await getShipLoadoutRates(mongoClient);

    } finally {
        mongoClient.close();
    }
}
start().catch(console.dir);