const { MongoClient } = require("mongodb");
const pipelines = require("./matchHistoryPipelines.js");
const utils = require("./matchHistoryUtils.js");

var client;

function setMongoClient(clientIn) {
    client = clientIn;
}

// Return all ship build ids matching the restrictions.
// async function getShipBuilds(restrictions) {
//     const matchCollection = client.db("mhtest").collection("Ships");
//     let query = {};
//     for (let i in restrictions) {
//         if (restrictions[i] == -1) continue;
//         if (i == 0) query['ShipModel'] = restrictions[i];
//         else query[`Loadout.${i - 1}`] = restrictions[i];
//     }

//     let results = matchCollection.find(query);
//     let out = [];
//     await results.forEach(doc => { out.push(doc._id) });
//     return out;
// }

async function matchHistorySearch(query) {
    let responseData = {
        perspective: query.perspective,
        originalQuery: JSON.parse(JSON.stringify(query)),
        modifiedQuery: query
    };

    if (query.perspective.type == 'Player') {
        // Add match filter for player;
        let playerId = await utils.getPlayerIdFromName(client, query.perspective.name);
        if (playerId) {
            query.filters.push( {type: "PlayerId", id: playerId} );
        }
    }

    let filterPipeline = await pipelines.generateMatchFilterPipeline(
        query.filters,
        client);

    if (query.perspective.type == 'Player') {
        // Add match filter for player;
        let playerId = await utils.getPlayerIdFromName(client, query.perspective.name);
        if (playerId) {
            let playerData = await getPlayerInfo(query.perspective.name, filterPipeline);
            responseData.playerData = playerData;
            responseData.perspective.name = playerData.PlayerInfo.Name;
        }
    }
    if (query.perspective.type == 'Overview'){
        responseData.shipWinrates = await getShipsOverviewInfo(filterPipeline);
    }
    let matches = await getRecentMatches(query.filters, 0);
    responseData.matches = matches;
    return responseData;
}

async function getPlayerInfo(playerName, filterPipeline) {
    const playersCollection = client.db("mhtest").collection("Players");
    const matchCollection = client.db("mhtest").collection("Matches");
    let playerId = await utils.getPlayerIdFromName(client, playerName);

    let playerInfoPipeline = pipelines.playerInfoPipeline(playerId);
    let playerInfoAggregate = playersCollection.aggregate(playerInfoPipeline);
    let playerInfo = await playerInfoAggregate.next();

    let playerWinratePipeline = pipelines.playerWinratesPipeline(filterPipeline, playerId);
    let winrateAggregate = matchCollection.aggregate(playerWinratePipeline);
    let playerWinrates = await winrateAggregate.next();

    playerInfo.Winrates = playerWinrates;

    return playerInfo;
}

async function getRecentMatches(filters, page) {
    const RESULTS_PER_PAGE = 10;
    const matchCollection = client.db("mhtest").collection("Matches");
    let basePipeline = pipelines.recentMatchesPipeline(RESULTS_PER_PAGE*page, RESULTS_PER_PAGE);
    let filterPipeline = await pipelines.generateMatchFilterPipeline(
        filters,
        client);
    let fullPipeline = filterPipeline.concat(basePipeline);
    let matchesAggregate = matchCollection.aggregate(fullPipeline);
    // let matchesAggregate2 = matchCollection.aggregate(fullPipeline);
    // console.log('__')
    // console.log(JSON.stringify(await matchesAggregate2.explain(true)));
    // console.log('__')
    let matches = await matchesAggregate.next();
    if (matches) matches['TotalCount'] = await matchCollection.count();
    else matches['TotalCount'] = 0;
    return matches;
}

async function getShipsOverviewInfo(filterPipeline) {

    const matchCollection = client.db("mhtest").collection("Matches");
    // let filterPipeline = await pipelines.generateMatchFilterPipeline(
    //     filters,
    //     client);
    let pipeline = pipelines.modelPickWinRates(filterPipeline);
    let aggregate = matchCollection.aggregate(pipeline);
    let result = await aggregate.next();
    return result;
}


module.exports = {
    matchHistorySearch,
    getPlayerInfo,
    getRecentMatches,
    getShipsOverviewInfo,
    setMongoClient
}