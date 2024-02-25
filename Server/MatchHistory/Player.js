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


function getPlayerStats(mongoClient, playerId) {
  const playersCollection = client.db("mhtest").collection("Players");
  return [1, 2, 3];
}

module.exports = {
  getPlayerIdFromName,
  getPlayerInfo,
  getPlayerStats
};