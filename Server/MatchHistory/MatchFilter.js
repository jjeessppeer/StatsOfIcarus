

function generateFilterPipeline(filter) {
  const filterPipeline = [];
  // if (filter.PlayerName) {
  //   filterPipeline.push(playerFilter(filter.PlayerName, mongoClient))
  // }
  if (filter.PlayerId) {
    const query = { $match: { FlatPlayers: filter.PlayerId } };
    filterPipeline.push(query);
  }
  if (filter.TagsInclude) {
    const query = { $match: { MatchTags: { $all: filter.TagsInclude } } };
    filterPipeline.push(query);
  }
  if (filter.TagsExclude) {
    const query = { $match: { MatchTags: { $not: { $all: filter.TagsExclude } } } };
    filterPipeline.push(query);
  }
  if (filter.TimestampStart) {
    filterPipeline.push({ $match: { Timestamp: { $gt: timestampStart } } });
  }
  if (filter.TimestampEnd) {
    filterPipeline.push({ $match: { Timestamp: { $lt: TimestampEnd } } });
  }
  if (filter.ShipId) {
    // TODO.
  }
  return filterPipeline;
}

// async function playerFilter(playerName, mongoClient) {
//   let playerId = await getPlayerIdFromName(mongoClient, filter.data);
//   if (playerId) return { $match: { FlatPlayers: playerId } }
//   return -2;
// }

// async function getPlayerIdFromName(mongoClient, name, exactMatch = false) {
//   const playersCollection = mongoClient.db("mhtest").collection("Players");
//   let player;
//   if (exactMatch) {
//     name = name + " [PC]";
//     player = await playersCollection.findOne({ Name: name });
//   }
//   else {
//     // Escape characters before searching
//     let queryString = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//     player = await playersCollection.findOne(
//       { "Name": new RegExp(queryString, "i") },
//       { _id: true });
//   }
//   if (player) return player._id;
//   return false;
// }

module.exports = {
  generateFilterPipeline
}