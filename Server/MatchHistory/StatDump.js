async function getStatDump(mongoClient) {
  const matchCollection = mongoClient.db("mhtest").collection("Matches");
  const matches = await matchCollection.aggregate([
    { $match: { TeamSize: 2, TeamCount: 2, GameMode: 2, MatchTags: "ShipsFull" } },
    { $sort: { "Timestamp": -1 } }, 
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
  for (let i = 0; i < matches.length; i++) {
    cleanUpMatchRecord(matches[i]);
  }
  // cleanUpMatchRecord(matches)
  return matches;
}

const CLASS_MAP = {
  0: "Engineer",
  1: "Gunner",
  2: "Pilot"
}

function cleanUpMatchRecord(match) {
  for (let t = 0; t < match.Ships.length; t++) {
    for (let s = 0; s < match.Ships[t].length; s++) {
      const shipId = match.Ships[s][t];
      const shipLoadout = match.ShipLoadouts.find(el => el._id.toString() == shipId.toString());
      const shipItem = match.ShipItems.find(el => el._id == shipLoadout.ShipModel);
      const guns = [];
      for (let g = 0; g < shipLoadout.Loadout.length; g++) {
        const gunItem = match.GunItems.find(el => el._id == shipLoadout.Loadout[g]);
        guns.push(gunItem.Name);
      }

      const crew = [];
      for (let p = 0; p < match.Players[s][t].length; p++) {
        const playerId = match.Players[s][t][p];
        const playerItem = match.PlayerInfo.find(el => el._id == playerId);

        const tools = [];
        const ammos = [];
        const pilot_tools = [];
        const loadoutId = match.Skills[s][t][p];
        const loadoutInfo = match.LoadoutInfo.find(el => loadoutId.toString() == el._id.toString());
        for (const skillId of loadoutInfo.Skills) {
          const skillItem = match.SkillItems.find(el => el._id == skillId);
          if (skillItem.SkillType == 3) tools.push(skillItem.Name);
          else if (skillItem.SkillType == 2) ammos.push(skillItem.Name);
          else if (skillItem.SkillType == 1) pilot_tools.push(skillItem.Name);
        }

        crew.push({
          Name: playerItem.Name,
          Class: CLASS_MAP[loadoutInfo.Class],
          Tools: tools,
          Ammos: ammos,
          PilotTools: pilot_tools
        });
      }

      match.Ships[s][t] = {
        Model: shipItem.Name,
        Name: match.ShipNames[t][s],
        Guns: guns,
        Pilot: crew[0],
        Crew: crew
      }
    }
  }
  match.Map = match.MapItem[0];
  delete match.MapItem;
  delete match.MapId;
  delete match.Players;
  delete match.Skills;
  delete match.LoadoutInfo;
  delete match.SkillItems;
  delete match.PlayerInfo;
  delete match.GunItems;
  delete match.ShipItems;
  delete match.ShipLoadouts;
  delete match.ShipNames;
}

module.exports = {
  getStatDump
};