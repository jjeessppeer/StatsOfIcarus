const { generateFilterPipeline } = require("./MatchFilter.js");

async function getPlayerIdFromName(mongoClient, name, exactMatch = false) {
  const playersCollection = mongoClient.db("mhtest").collection("Players");
  let player;
  if (exactMatch) {
    name = name + " [PC]";
    player = await playersCollection.findOne({ Name: name });
  }
  else {
    // Escape characters before searching
    let queryString = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    player = await playersCollection.findOne(
      { "Name": new RegExp(queryString, "i") },
      { _id: true });
  }
  if (player) return player._id;
  return NaN;
}

async function getPlayerInfo(mongoClient, playerId) {
  const playersCollection = mongoClient.db("mhtest").collection("Players");

  // const playerId = getPlayerIdFromName(mongoClient, playerName);
  const playerInfo = await playersCollection.aggregate([
    { $match: { _id: playerId } },
    {
      $project: {
        _id: 1,
        Name: 1,
        Clan: 1,
        SkillRatings: 1,
        ELORating: 1
      }
    }
  ]).next();
  return playerInfo;
}

async function getPlayerShipStats(mongoClient, filter, playerId) {
  const matchCollection = mongoClient.db("mhtest").collection("Matches");

  const filterPipeline = generateFilterPipeline(filter);
  const rates = await matchCollection.aggregate([
    ...filterPipeline,
    { $match: { FlatPlayers: playerId } },
    { $addFields: { 
      playerFlatIndex: { $indexOfArray: [ "$FlatPlayers", playerId ] } 
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
  ]).next();

  return rates;
}

module.exports = {
  getPlayerIdFromName,
  getPlayerInfo,
  getPlayerShipStats
};