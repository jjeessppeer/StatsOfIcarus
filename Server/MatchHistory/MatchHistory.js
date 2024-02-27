const { getShipPickWinrate } = require("./ShipPickWinrate.js");
const { getMatches } = require("./MatchList.js");
const { getPlayerInfo, getPlayerStats, getPlayerIdFromName } = require("./Player.js");
const { getEloTimeline } = require("./Elo.js");


module.exports = {
    getShipPickWinrate,
    getMatches,
    getPlayerIdFromName,
    getPlayerInfo,
    getPlayerStats,
    getEloTimeline
};