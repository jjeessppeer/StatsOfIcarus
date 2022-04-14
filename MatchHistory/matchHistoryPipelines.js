
function playerInfoPipeline(playerId, daysAgo) {
    let timeNow = new Date().getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    let minTime = timeNow - daysAgo * msPerDay;
    let pipeline = [
        { $match: {_id: playerId} },
        { $facet: {
          "ShipRates": [
            { $unwind: {
              path: "$MatchesPlayed"
            }},
            { $match: {"MatchesPlayed.Timestamp": {$gt: minTime}} },
        
            // Get the recent matches
            { $lookup: {
                from: "Matches",
                localField: "MatchesPlayed.MatchObjId",
                foreignField: "_id",
                as: "Matches"
            }},
            { $unwind: {
              path: "$Matches"
            }},
            { $lookup: {
              from: "PlayerEquipment",
              localField: "MatchesPlayed.PlayerLoadoutId",
              foreignField: "_id",
              as: "PlayerLoadout"
            }},
            { $unwind: {
              path: "$PlayerLoadout"
            }},
            { $lookup: {
              from: "Ships",
              localField: "MatchesPlayed.PlayerShipId",
              foreignField: "_id",
              as: "PlayerShipLoadout"
            }},
            { $unwind: {
              path: "$PlayerShipLoadout"
            }},
            { $group: {
              _id: {
                Ship: "$PlayerShipLoadout.ShipModel",
                Class: "$PlayerLoadout.Class"},
              count: {$sum: 1},
              wins: { $sum: {$cond: [{$eq: ["$MatchesPlayed.TeamIndex", "$Matches.Winner"]}, 1, 0]} }
            }}],
          "PlayerInfo": [
            {$project: {
              Name: "$Name",
              MatchesRecordedCount: "22"
            }}
          ]
          }}]
    return pipeline;
}


async function generateMatchFilterPipeline(filters, playerCollection, shipItemsCollection) {
  let filterPipeline = [];
  for (let filter of filters) {
    if (filter.filterType == "Player") {
        let searchName = filter.data;
        let player = await playerCollection.findOne({ "Name": new RegExp(searchName, "i") });
        let playerId = -2;
        if (player) playerId = player._id;
        let query = { $match: { FlatPlayers: playerId } };
        filterPipeline.push(query);
    }
    // if (filter.filterType == "Ship") {
    //     let searchName = filter.data;
    //     let shipItem = await shipItems.findOne({ "Name": new RegExp(searchName, "i") });
    //     let shipModel = -1;
    //     if (shipItem) shipModel = shipItem._id;
    //     let query = {
    //         $match: {
    //             $or: [
    //                 { Team_0_ShipModels: { $all: [shipModel] } },
    //                 { Team_1_ShipModels: { $all: [shipModel] } }
    //             ]
    //         }
    //     };
    //     filterPipeline.push(query);
    // }
  }
  return filterPipeline;
}

function recentMatchesPipeline(offset, count) {
  let pipeline = [
      { $match: { TeamSize: 2 } },
      { $match: { TeamCount: 2 } },
      { $match: { GameMode: 2 } },
      { $facet: {
        "Count": [ { "$group": { _id: null, count: { $sum: 1 } } } ],
        "Matches": [
          { "$sort": { "Timestamp": -1 } }, 
          { "$skip": offset }, 
          { "$limit": count },
          { $lookup: {
            from: "Players",
            localField: "FlatPlayers",
            foreignField: "_id",
            as: "PlayerInfo"
          }},
          { $lookup: {
            from: "PlayerEquipment",
            localField: "FlatSkills",
            foreignField: "_id",
            as: "LoadoutInfo"
          }},
          { $lookup: {
            from: "Ships",
            localField: "FlatShips",
            foreignField: "_id",
            as: "ShipLoadouts"
          }},
          { $lookup: {
            from: "Items-Ships",
            localField: "ShipLoadouts.ShipModel",
            foreignField: "_id",
            as: "ShipItems"
          }},
          { $lookup: {
            from: "Items-Skills",
            localField: "LoadoutInfo.Skills",
            foreignField: "_id",
            as: "SkillItems"
          }},
          { $lookup: {
            from: "Items-Guns",
            localField: "ShipLoadouts.Loadout",
            foreignField: "_id",
            as: "GunItems"
          }},
          { $lookup: {
            from: "Items-Maps",
            localField: "MapId",
            foreignField: "_id",
            as: "MapItem"
          }},
          { $project: {
            SubmitterIp: 0
          }}
        ]
      }},
      { $unwind: "$Count" },
      //output projection
      { $project: {
        Count: "$Count.count",
        Matches: "$Matches"
      }}
  ]
  return pipeline;
}


function modelPickWinRates() {
  let pipeline = [
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
  return pipeline;
}

module.exports = {
    playerInfoPipeline,
    recentMatchesPipeline,
    generateMatchFilterPipeline,
    modelPickWinRates
}