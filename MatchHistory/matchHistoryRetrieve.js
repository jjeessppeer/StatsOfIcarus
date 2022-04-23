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



async function getPlayerInfo(playerName, timeSpanDays=366) {
    const playersCollection = client.db("mhtest").collection("Players");
    let playerId = await utils.getPlayerIdFromName(client, playerName);
    let playerInfoPipeline = pipelines.playerInfoPipeline(playerId, timeSpanDays);
    
    let playerInfoAggregate = playersCollection.aggregate(playerInfoPipeline);
    let playerInfo = await playerInfoAggregate.next();

    let playerWinratePipeline = pipelines.playerWinratesPipeline(playerId, timeSpanDays);
    let winrateAggregate = playersCollection.aggregate(playerWinratePipeline);
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
    let matches = await matchesAggregate.next();
    return matches;
}

async function getShipsOverviewInfo() {
    // TODO: add filter option.
    const matchCollection = client.db("mhtest").collection("Matches");
    let basePipeline = pipelines.modelPickWinRates();
    let aggregate = matchCollection.aggregate(basePipeline);
    let result = await aggregate.next();
    await aggregate.forEach(element => {
        result.push(element);
    });
    return result;
}


module.exports = {
    getPlayerInfo,
    getRecentMatches,
    getShipsOverviewInfo,
    setMongoClient
}