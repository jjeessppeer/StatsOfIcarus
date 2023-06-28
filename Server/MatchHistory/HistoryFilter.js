
async function processHistoryQuery(mongoClient, query) {
    let responseData = {
        originalQuery: JSON.parse(JSON.stringify(query)),
        modifiedQuery: query
    };
    if (query.perspective.type == 'Player') {
        // Add match filter for player;
        let playerId = await getPlayerIdFromName(mongoClient, query.perspective.name);
        if (playerId) {
            query.filters.push( {type: "PlayerId", id: playerId} );
        }
    }
    return responseData;
}

async function generateMatchFilterPipeline(mongoClient, filters) {
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
      // if (filter.type == "MinElo") {

      // }
    }
    
    return filterPipeline;
  }

async function getPlayerIdFromName(mongoClient, name, exactMatch=false) {
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
    return undefined;
}

module.exports = {
  generateMatchFilterPipeline,
  processHistoryQuery
}