// TODO: use elo to generate weighted performence data.

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

function generateSearchStrings(target, teamIdx, shipIdx) {
    const tags = [];
    tags.push(loadoutSearchTag(teamIdx, shipIdx, target.Model));
    for (const gunIdx in target.Guns) {
        tags.push(loadoutSearchTag(teamIdx, shipIdx, undefined, Number(gunIdx), target.Guns[gunIdx]));
    }
    return tags;
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

async function getShipMatchupStats(client, targetShip = { Model: 16}) {
    const matchCollection = client.db("mhtest").collection("Matches");
    // const targetShip = { Model: 16, Guns: {3: 171} }
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
    for (let i = 0; i < 5; i++) {
        console.log(result[i]);
    }
    return result;
}

async function getShipLoadouts(client, shipModel = 16) {
    const matchCollection = client.db("mhtest").collection("Matches");
    const pipeline = [
        { $match: {"ShipLoadoutsModels.Model": shipModel}},
        { "$unwind": {
            path: "$ShipLoadoutsModels",
            includeArrayIndex: "ShipIndex"
        }},

        { $match: { "ShipLoadoutsModels.Model": shipModel }},

        { $facet: {
            "Count": [ { "$group": { _id: null, count: { $sum: 1 } } } ],
            "LoadoutStats": [
              { $group: {
                _id: "$ShipLoadoutsModels.Loadout",
                Wins: { $sum: {$cond: [{$eq: ["$ShipLoadoutsModels.TeamIdx", "$Winner"]}, 1, 0]} },
                PlayedGames: { $sum: 1 }
              }}
            ]
        }},

        {$unwind: '$LoadoutStats'},
        {$sort: {"LoadoutStats.PlayedGames": -1}}
    ]

    const agg = matchCollection.aggregate(pipeline);
    // const exp = await agg.explain();
    // console.log(exp['stages'][0]['$cursor']['executionStats']);
    // console.log(JSON.stringify(exp));
    // console.log(agg)
    const result = await agg.toArray();
    console.log(result.length);
    for (let i = 0; i < 5; i++) {
        console.log(result[i]);
    }
    return result;
    


}

module.exports = {
    getShipLoadouts,
    getShipMatchupStats
}