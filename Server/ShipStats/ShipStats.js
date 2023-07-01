// TODO: use elo to generate weighted performence data.

// function gunPosIdObj(gunIdx, shipModel, gunId, teamIdx, shipIdx) {
//     // const idStr = `T${teamIdx}S${shipIdx}G${gunIdx}M${shipModel}L${gunId}`;
//     // return idStr;
//     let loadoutObj;
//     if (teamIdx != undefined && shipIdx != undefined) {
//         loadoutObj = {T: teamIdx, S: shipIdx, G: gunIdx, model: shipModel, gun: gunId};
//     }
//     else {
//         loadoutObj = {G: gunIdx, model: shipModel, gun: gunId};
//     }
//     return JSON.stringify(loadoutObj);
// }

function generateSearchStrings(target, teamIdx, shipIdx) {
    // const tags = [];
    // tags.push(JSON.stringify(loadoutSearchObj(teamIdx, shipIdx, target.Model)));
    // for (const gunIdx in target.Guns) {
    //     tags.push(JSON.stringify(loadoutSearchObj(teamIdx, shipIdx, undefined, Number(gunIdx), target.Guns[gunIdx])));
    // }
    // return tags;
    // const tags = generateSearchTagArr(target, teamIdx, shipIdx);
    // console.log(tags);
    // for (let i = 0; i < tags.length; i++) {
    //     tags[i] = JSON.stringify(tags[i]);
    // } 
    // return tags;

    const tags = [];
    for (const loadoutItem of target) {
        tags.push(JSON.stringify(loadoutItem));
    }
    return tags;
}

function generateSearchTagArr(target, teamIdx, shipIdx) {
    const tags = [];
    // tags.push(JSON.stringify(loadoutSearchObj(teamIdx, shipIdx, target.Model)));
    for (const loadoutObj in target) {
        tags.push(loadoutSearchObj(teamIdx, shipIdx, loadoutObj.model, loadoutObj.G, loadoutObj.gun));
        // tags.push(JSON.stringify(loadoutObj));
    }
    return tags;
}

function loadoutSearchObj(teamIdx, shipIdx, modelId, gunIdx, gunId) {
    const loadoutObj = {};
    if (teamIdx != undefined) loadoutObj['T'] = teamIdx;
    if (shipIdx != undefined) loadoutObj['S'] = shipIdx;
    if (modelId != undefined) loadoutObj['model'] = modelId;
    if (gunIdx != undefined) {
        loadoutObj['G'] = gunIdx;
        loadoutObj['gun'] = gunId;
    }
    return loadoutObj;
}

async function getShipMatchupStats(client, targetShipTags) {
    const matchCollection = client.db("mhtest").collection("Matches");
    // const targetShip = { Model: 16, Guns: {3: 171} }
    // const target = {Model: 11, Guns: {0: 171}};
    // const target = {Model: 16};
    const tags = generateSearchStrings(targetShipTags, undefined, undefined);
    const pipeline = [
        // { $unwind: '$ShipLoadoutsSearchIndividual'},
        // { $match: { ShipLoadoutsSearchIndividual: { $all: tags}}},

        // Pre filter matches including searched for ship. Only for performence
        // { $match: { $or: [
        //     { ShipLoadoutsSearchFull: { $all: generateSearchStrings(targetShip, 0, 0)}},
        //     { ShipLoadoutsSearchFull: { $all: generateSearchStrings(targetShip, 0, 1)}},
        //     { ShipLoadoutsSearchFull: { $all: generateSearchStrings(targetShip, 1, 0)}},
        //     { ShipLoadoutsSearchFull: { $all: generateSearchStrings(targetShip, 1, 1)}},
        // ]}},

        { $match: { TeamCount: 2, TeamSize: 2, ShipsFull: true}},

        { $addFields: {
            MainShip: '$ShipLoadoutsModels',
            OtherShip: '$ShipLoadoutsModels'
        }},

        // Unwind twice to get ship matchup.
        { $unwind: {  path: "$MainShip" }},
        { $match: { 'MainShip.Tags': { $all: tags}}},
        { $unwind: { path: "$OtherShip" }},
        
        // Don't compare to self.
        { $match: { $expr: { $or: [
            { $ne: ['$OtherShip.TeamIdx', '$MainShip.TeamIdx']},
            { $ne: ['$OtherShip.ShipIdx', '$MainShip.ShipIdx']}
        ]}}},

        { $addFields: {
            ActualOutcome: { $cond:[{ $eq: ["$MainShip.TeamIdx", 0] }, 
                '$Ranking.ActualOutcome', 
                { $subtract: [1, '$Ranking.ActualOutcome']}
            ]},
            ExpectedOutcome: { $cond:[{ $eq: ["$MainShip.TeamIdx", 0] }, 
                '$Ranking.ExpectedOutcome', 
                { $subtract: [1, '$Ranking.ExpectedOutcome']}
            ]},
        }},

        { "$group": { 
            _id: '$OtherShip.Loadout',
            count: {$sum: 1},
            PlayedVs: { $sum: {$cond: [{$ne: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]}, 1, 0]} },
            PlayedWith: { $sum: {$cond: [{$eq: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]}, 1, 0]} },

            WinsVs: { $sum: {$cond: [{ $and: [
                {$ne: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]},
                {$eq: ["$MainShip.TeamIdx", "$Winner"]}
            ]}, 1, 0]}},

            WinsWith: { $sum: {$cond: [{ $and: [
                {$eq: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]},
                {$eq: ["$MainShip.TeamIdx", "$Winner"]}
            ]}, 1, 0]}},

            ExpectedOutcomeVs: { $sum: {$cond: [
                {$ne: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]}, 
                '$ExpectedOutcome', 0
            ]}},

            ExpectedOutcomeWith: { $sum: {$cond: [
                {$eq: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]}, 
                '$ExpectedOutcome', 0
            ]}},

            ActualOutcomeVs: { $sum: {$cond: [
                {$ne: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]}, 
                '$ActualOutcome', 0
            ]}},

            ActualOutcomeWith: { $sum: {$cond: [
                {$eq: ["$MainShip.TeamIdx", "$OtherShip.TeamIdx"]}, 
                '$ActualOutcome', 0
            ]}},

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
    // console.log(result.length);
    // for (let i = 0; i < 5; i++) {
    //     console.log(result[i]);
    // }
    return result;
}

async function getShipLoadouts(client, shipModel, filterPipeline=[]) {
    const matchCollection = client.db("mhtest").collection("Matches");
    const pipeline = [
        ...filterPipeline,
        { $match: {TeamSize: 2, TeamCount: 2, ShipsFull: true}},
        { $match: {"ShipLoadoutsModels.Model": shipModel}},


        { $addFields: {
            MainShipLoadout: "$ShipLoadoutsModels",
        }},
        { "$unwind": {
            path: "$MainShipLoadout",
        }},
        { $match: { "MainShipLoadout.Model": shipModel }},

        { $addFields: {
            OtherTeamStartIdx: {$cond: [{$eq: ["$MainShipLoadout.TeamIdx", 0]}, 2, 0]},
        }},
        { $addFields: {
            OtherShipLoadout1: { $arrayElemAt: ["$ShipLoadoutsModels", {$add: ["$OtherTeamStartIdx", 0]}]},
            OtherShipLoadout2: { $arrayElemAt: ["$ShipLoadoutsModels", {$add: ["$OtherTeamStartIdx", 1]}]},
        }},

        { $addFields: {
            MainTeamActualOutcome: { $cond:[{ $eq: ["$MainShipLoadout.TeamIdx", 0] }, 
                '$Ranking.ActualOutcome', 
                { $subtract: [1, '$Ranking.ActualOutcome']}
            ]},
            MainTeamExpectedOutcome: { $cond:[{ $eq: ["$MainShipLoadout.TeamIdx", 0] }, 
                '$Ranking.ExpectedOutcome', 
                { $subtract: [1, '$Ranking.ExpectedOutcome']}
            ]},
        }},
        
        


        // { $addFields: {
        //     OtherTeamStartIdx: {$cond: [{$eq: ["$ShipLoadoutsModels.TeamIdx", 0]}, 0, 1]}
        // }},
        // { $project: {
        //     OtherShipLoadout1: { $arrayElemAt: ["$ShipLoadoutsModels", {$add: ["$OtherTeamStartIdx", 0]}]},
        //     OtherShipLoadout2: { $arrayElemAt: ["$ShipLoadoutsModels", {$add: ["$OtherTeamStartIdx", 1]}]},
        // }},

        // { $facet: {
        //     "Count": [ { "$group": { _id: null, count: { $sum: 1 } } } ],
        //     "LoadoutStats": [
              { $group: {
                _id: "$MainShipLoadout.Loadout",
                Wins: { $sum: {$cond: [{$eq: ["$MainShipLoadout.TeamIdx", "$Winner"]}, 1, 0]} },
                PlayedGames: { $sum: 1 },
                Mirrors: { $sum: { $cond: [ 
                    {$or: [
                        {$eq: ["$OtherShipLoadout1.Model", "$MainShipLoadout.Model"]},
                        {$eq: ["$OtherShipLoadout2.Model", "$MainShipLoadout.Model"]}
                    ]}, 
                    1, 0]
                }},
                ActualOutcome: { $sum: '$MainTeamActualOutcome'},
                ExpectedOutcome: { $sum: '$MainTeamExpectedOutcome'},
                // Mirrors1: { $sum: { $cond: [{$eq: ["$OtherShipLoadout1.Model", "$MainShipLoadout.Model"]}, 1, 0] }},
                // Mirrors2: { $sum: { $cond: [{$eq: ["$OtherShipLoadout2.Model", "$MainShipLoadout.Model"]}, 1, 0] }},
              }},
        //     ]
        // }},

        // {$unwind: '$LoadoutStats'},
        {$sort: {"PlayedGames": -1}}
    ]
    // console.log(JSON.stringify(pipeline, null, 2));

    const agg = matchCollection.aggregate(pipeline);
    // const exp = await agg.explain();
    // console.log(exp['stages'][0]['$cursor']['executionStats']);
    // console.log(JSON.stringify(exp));
    // console.log(agg)
    const result = await agg.toArray();
    // console.log(result.length);
    // for (let i = 0; i < 3; i++) {
    //     console.log(result[i]);
    // }
    // const r = result[0];
    // console.log("Main\n", r.MainShipLoadout, "\nOTHER1\n", r.OtherShipLoadout1, "\n", r.OtherShipLoadout2 ,"\n");
    // console.log(r.OtherTeamStartIdx, " | t:", r.MainShipLoadout.TeamIdx, " w:" ,r.Winner);
    return result;
    


}

async function getShipsWinrates(client, filterPipeline=[]) {
    const matchCollection = client.db("mhtest").collection("Matches");
    let pipeline = [
        ...filterPipeline,
        { $match: {TeamSize: 2, TeamCount: 2, ShipsFull: true}},
        { "$unwind": {
          path: "$ShipModels",
          includeArrayIndex: "TeamIndex"}},
        { "$unwind": {
          path: "$ShipModels"
        }},
        { $facet: {
          "Count": [ { "$group": { _id: null, count: { $sum: 1 } } } ],
          "ModelWinrates": [
            { $group: {
              _id: "$ShipModels",
              Wins: { $sum: {$cond: [{$eq: ["$TeamIndex", "$Winner"]}, 1, 0]} },
              // Losses: { $sum: {$cond: [{$eq: ["$TeamIndex", "$Winner"]}, 0, 1]} },
              PlayedGames: { $sum: 1 }
            }},
            { $lookup: {
              from: "Items-Ships",
              localField: "_id",
              foreignField: "_id",
              as: "ShipItem"
            }}
          ]
        }},
        { $unwind: "$Count" },
        { $project: {
          Count: "$Count.count",
          ModelWinrates: "$ModelWinrates"
        }}
      ];
      pipeline = filterPipeline.concat(pipeline);

    let aggregate = matchCollection.aggregate(pipeline);
    let result = await aggregate.next();
    return result;
}

module.exports = {
    getShipLoadouts,
    getShipMatchupStats,
    generateSearchStrings,
    generateSearchTagArr,
    loadoutSearchObj,
    getShipsWinrates
}