const utils = require("./matchHistoryUtils.js");


function playerWinratesPipeline(filterPipeline, playerId) {
  const pipeline = [
    ...filterPipeline,
    { $addFields: {
      playerFlatIndex: { $indexOfArray: [ "$FlatPlayers", playerId ] },
    }},
    { $addFields: {
      playerTeamIndex: { $floor: { $divide: [ 
        "$playerFlatIndex",
        { $multiply: ["$TeamCount", 4] }
      ]}},
      playerLoadoutId: {$arrayElemAt: [
        "$FlatSkills", 
        "$playerFlatIndex"
      ]},
      playerShipLoadoutId: {$arrayElemAt: [
        "$FlatShips",
        { $floor: { $divide: ["$playerFlatIndex", 4 ] } }
      ]},
    }},
    { $lookup: {
        from: "Ships",
        localField: "playerShipLoadoutId",
        foreignField: "_id",
        as: "PlayerShipLoadout"
    }},
    { $lookup: {
      from: "PlayerEquipment",
      localField: "playerLoadoutId",
      foreignField: "_id",
      as: "PlayerLoadout"
    }},
    { $facet: {
      "OverallRates": [
        { $group: {
          _id: null,
          count: {$sum: 1},
          wins: { $sum: {$cond: [{$eq: ["$playerTeamIndex", "$Winner"]}, 1, 0]} }
        }},
      ],
      "ModelRates": [
        // Group: ShipModells -> PlayerClass
        { $group: {
          _id: {
            Ship: "$PlayerShipLoadout.ShipModel",
            Class: "$PlayerLoadout.Class"},
          count: {$sum: 1},
          wins: { $sum: {$cond: [{$eq: ["$playerTeamIndex", "$Winner"]}, 1, 0]} }
        }},
        { $project: {
          ShipModel: "$_id.Ship",
          PlayerClass: "$_id.Class",
          MatchCount: "$count",
          Wins: "$wins"
        }},
        { $group: {
          _id: "$ShipModel",
          MatchCount: { $sum: "$MatchCount" },
          Wins: { $sum: "$Wins" },
          ClassStats: { $push : "$$ROOT" }
        }},
        { $sort: {
          MatchCount: -1
        }}
      ],
      "ClassRates": [
        // Group: PlayerClass -> ShipModel
        { $group: {
          _id: {
            Ship: "$PlayerShipLoadout.ShipModel",
            Class: "$PlayerLoadout.Class"},
          count: {$sum: 1},
          wins: { $sum: {$cond: [{$eq: ["$playerTeamIndex", "$Winner"]}, 1, 0]} }
        }},
        { $project: {
          ShipModel: "$_id.Ship",
          PlayerClass: "$_id.Class",
          MatchCount: "$count",
          Wins: "$wins"
        }},
        { $group: {
          _id: "$PlayerClass",
          MatchCount: { $sum: "$MatchCount" },
          Wins: { $sum: "$Wins" },
          ModelStats: { $push : "$$ROOT" }
        }},
        { $sort: {
          _id: 1
        }}
      ]
    }},
  ]
  return pipeline
}

function playerInfoPipeline(playerId) {
    const pipeline = [
        { $match: {_id: playerId} },
        { $facet: {
          "PlayerInfo": [
            {$project: {
              Name: "$Name",
              Clan: "$Clan",
              MatchCount: "$MatchCount",
              Levels: "$Levels",
              SkillRatings: "$SkillRatings",
              ELORating: "$ELORating",
              ELOCategories: "$ELOCategories"
            }},
          ]
        }},
        { $unwind: {
          path: "$PlayerInfo"
        }}
      ]
    return pipeline;
}


async function generateMatchFilterPipeline(filters, mongoClient) {
  // let playerCollection = mongoClient.db("mhtest").collection("Players");

  let filterPipeline = [];
  for (let filter of filters) {
    if (filter.type == "Player") {
      let playerId = await utils.getPlayerIdFromName(mongoClient, filter.data);
      let query = { $match: { FlatPlayers: playerId } };
      filterPipeline.push(query);
    }
    if (filter.type == "PlayerId") {
      let query = { $match: { FlatPlayers: filter.id } };
      filterPipeline.push(query);
    }
    if (filter.type == "TagsInclude") {
      let query = { $match: { MatchTags: { $all: filter.tags } }};
      filterPipeline.push(query);
    }
    if (filter.type == "TagsExclude") {
      let query = { $match: { MatchTags: {$not: { $all: filter.tags }}}};
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
            SubmitterIp: 0,
            SubmitterIps: 0,
            SubmissionCount: 0,
            MatchId: 0,
            _id: 0,
            PlayerInfo: {
              SkillRatings: 0,
              ELORating: 0,
              MatchesPlayed: 0
            }
          }}
        ]
      }},
      { $unwind: "$Count" },
      //output projection
      { $project: {
        FilteredCount: "$Count.count",
        Matches: "$Matches"
      }}
  ]
  return pipeline;
}


function modelPickWinRates(filterPipeline) {
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
  pipeline = filterPipeline.concat(pipeline);
  return pipeline;
}

module.exports = {
  playerInfoPipeline,
  playerWinratesPipeline,
  recentMatchesPipeline,
  generateMatchFilterPipeline,
  modelPickWinRates
}