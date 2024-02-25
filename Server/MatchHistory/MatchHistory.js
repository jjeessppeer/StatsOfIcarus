const { getShipPickWinrate } = require("./ShipPickWinrate.js");
const { getMatches } = require("./MatchList.js");
const { getPlayerInfo, getPlayerStats, getPlayerIdFromName } = require("./Player.js");


module.exports = {
    getShipPickWinrate,
    getMatches,
    getPlayerIdFromName,
    getPlayerInfo,
    getPlayerStats
};