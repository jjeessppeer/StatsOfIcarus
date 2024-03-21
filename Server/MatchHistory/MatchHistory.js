const { getShipPickWinrate } = require("./ShipPickWinrate.js");
const { getMatches } = require("./MatchList.js");
const { getPlayerInfo, getPlayerShipStats, getPlayerIdFromName } = require("./Player.js");
const { getEloTimeline, getLeaderboardPage, getLeaderboardPosition } = require("./Elo.js");
const { submitReplay } = require("./SubmitReplay.js");
const { submitRecord, setMongoClient } = require("./Submit.js");

module.exports = {
    getShipPickWinrate,
    getMatches,
    getPlayerIdFromName, getPlayerInfo, getPlayerShipStats,
    getEloTimeline, getLeaderboardPage, getLeaderboardPosition,
    submitReplay,
    submitRecord, setMongoClient
};