
const { generateFilterPipeline } = require("./MatchFilter.js");

async function getMatches(mongoClient, filter, page=0, pageSize=10) {
  page = Number(page);
  // TODO: Remove lookups. Instead let the client fetch and cache needed items.
  const matchCollection = mongoClient.db("mhtest").collection("Matches");
  const filterPipeline = generateFilterPipeline(filter);
  const matches = await matchCollection.aggregate([
      ...filterPipeline,
      { $match: { TeamSize: 2, TeamCount: 2, GameMode: 2 } },
      { $sort: { "Timestamp": -1 } }, 
      { $skip: page * pageSize }, 
      { $limit: pageSize },
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
        _id: 0,
        GameMode: 1,
        GunItems: 1,
        LoadoutInfo: 1,
        MapId: 1,
        MatchId: 1,
        MapItem: 1,
        MatchTags: 1,
        MatchTime: 1,
        PlayerInfo: {
          _id: 1,
          Name: 1
        },
        Players: 1,
        Ranking: 1,
        ReplaySaved: 1,
        Scores: 1,
        Ships: 1,
        ShipItems: 1,
        ShipLoadouts: 1,
        ShipNames: 1,
        SkillItems: 1,
        Skills: 1,
        TeamCount: 1,
        TeamSize: 1,
        Timestamp: 1,
        Winner: 1
      }}
  ]).toArray();
  return matches;
}

module.exports = {
  getMatches
}