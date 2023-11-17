// require('dotenv').config()

var express = require('express');
const { checkSchema, validationResult, check } = require('express-validator');
const Joi = require('joi');
const { MongoClient, ReturnDocument } = require("mongodb");
var fs = require('fs');
var http = require('http');
const semver = require('semver')

const schemaMiddleware = require('./SchemaValidation/middleware.js');
const schemas = require('./SchemaValidation/schemas.js');

const matchHistory = require("./matchHistory.js");
const matchHistorySubmit = require("./MatchHistory/matchHistorySubmit.js");
const matchHistoryRetrieve = require("./MatchHistory/matchHistoryRetrieve.js");
const matchHistoryUtils = require("./MatchHistory/matchHistoryUtils.js");
const elo = require("./Elo/EloHelper.js");
const lobbyBalancer = require("./Elo/LobbyBalancer.js");
const {HISTORY_SEARCH_SCHEMA, MATCH_REQUEST_SCHEMA, MATCH_SUBMISSION_SCHEMA} = require("./MatchHistory/requestSchemas.js");

const shipStats = require('./ShipStats/ShipStats.js');

const { MONGODB_URL_STRING } = require("../config.json");
let mongoClient = new MongoClient(MONGODB_URL_STRING);

const MOD_VERSION_LATEST = "0.2.0";
const MOD_VERSION_REQUIRED = "0.1.3";

const zlib = require('zlib');
const util = require('util');
const unzip = util.promisify(zlib.unzip);
const inflate = util.promisify(zlib.inflate);

// var bodyParser = require("body-parser");
var requestIp = require('request-ip');
const { assert } = require('console');
const { nextTick } = require('process');

var app = express()
app.use(express.json({ limit: '100mb' }));
app.use(express.text({ limit: '100mb' }));
app.use(express.urlencoded({
    limit: '100mb', 
    extended: true}));
app.use(express.static('public'));

app.get('/get_datasets', async function (req, res) {
    let ip = requestIp.getClientIp(req);
    const db = mongoClient.db("testdb1");
    let datasets = {};
    datasets.gun_stats = await db.collection("Gun_stats").find({}).toArray();
    datasets.ammo_stats = await db.collection("Ammo_stats").find({}).toArray();
    datasets.damage_stats = await db.collection("Damage_types").find({}).toArray();
    datasets.tool_stats = await db.collection("Tool_stats").find({}).toArray();
    datasets.component_stats = await db.collection("Component_stats").find({}).toArray();
    datasets.ship_stats = await db.collection("Ship_Stats").find({}).toArray();
    datasets.map_data = await db.collection("Map_data").find({}).toArray();
    datasets.crosshair_data = await db.collection("Crosshair_data").find({}).toArray();
    datasets.ships_gun_angles = await db.collection("Ships_gun_angles").find({}).toArray();
    for (const [key, value] of Object.entries(datasets)) {
        for (const v of datasets[key]) {
            delete v._id;
        }
    }

    res.status(200).json(datasets);
});

app.post(
    '/submit_match_history', 
    // schemaMiddleware(schemas.MATCH_SUBMISSION_SCHEMA),
    async function (req, res) {
    let ip = requestIp.getClientIp(req);

    console.log("Match recieved");
    let requestValidation = schemas.MATCH_SUBMISSION_SCHEMA.validate(req.body);
    if (requestValidation.error){
        console.log(requestValidation.error);
        return res.status(400).send();
    }
    console.log("Match OK");
    // if (semver.satisfies(req.body.ModVersion, `=>${MOD_VERSION_REQUIRED}`)) {
    //     return res.status(400).send(`MatchHistoryMod version incompatible. \nCurrent: ${req.body.ModVersion} \nLatest: ${MOD_VERSION_LATEST})`);
    // }
    // matchHistory.submitRecord(req.body, ip);

    // if (semver.satisfies(req.body.ModVersion, `<${MOD_VERSION_LATEST}`)) {
    //     return res.status(400).send(`New version of MatchHistoryMod available. \nCurrent: ${req.body.ModVersion} \nLatest: ${MOD_VERSION_LATEST}`);
    // }
    console.log("Match history recieved.");
    var inflated = (await unzip(Buffer.from(req.body.CompressedGunneryData, 'base64'))).toString();
    var gunneryData = JSON.parse(inflated);
    console.log(gunneryData);

    res.status(200).send();
});

app.post(
    '/match_history_search',
    async function(req, res) {

    let validationResult = HISTORY_SEARCH_SCHEMA.validate(req.body);
    if (validationResult.error){
        console.log(validationResult.error)
        return res.status(400).send();
    }
    let responseData = await matchHistoryRetrieve.matchHistorySearch(req.body);
    res.status(200).json(responseData);
});

app.post(
    '/request_matches', 
    async function(req, res) {

    let requestValidation = MATCH_REQUEST_SCHEMA.validate(req.body);
    if (requestValidation.error){
        return res.status(400).send();
    }

    let matches = await matchHistoryRetrieve.getRecentMatches(req.body.filters, req.body.page);
    
    res.status(200).json(matches);
});

app.post(
    '/player_rating',
    schemaMiddleware(schemas.eloTimelineRequest),
    async function(req, res) {
        
    const eloTimeline = await elo.getPlayerEloData(mongoClient, req.body.playerId, req.body.rankingGroup);
    const ladderRank = await elo.getLeaderboardPosition(mongoClient, req.body.rankingGroup, req.body.playerId);
    res.status(200).json({Timeline: eloTimeline, LadderRank: ladderRank});
});

app.post(
    '/balance_lobby',
    schemaMiddleware(schemas.lobbyBalance),
    async function(req, res) {
    const balancedTeams = await lobbyBalancer.generateBalancedTeams(
        mongoClient, 
        req.body.playerIds, 
        req.body.randomness,
        req.body.teamCount,
        req.body.teamSize,
        req.body.keepPilots);
    res.status(200).json(balancedTeams);
});


app.post(
    '/leaderboard_page',
    schemaMiddleware(schemas.leaderboardRequest),
    async function(req, res) {
    
    const pageSize = 10;
    const start = Math.floor(req.body.Position / pageSize) * pageSize;
    let page = await elo.getLeaderboardPage(mongoClient, req.body.RatingGroup, start, pageSize);
    res.status(200).json(page);
});


const {processHistoryQuery, generateMatchFilterPipeline} = require('./MatchHistory/HistoryFilter.js');
app.post(
    '/ship_loadouts',
    async function(req, res) {
            
    const collection = mongoClient.db("mhtest").collection("Items-Ships");
    const item = await collection.findOne({Name: req.body.perspective.name});
    
    const queryResponse = await processHistoryQuery(mongoClient, req.body);
    const filterPipeline = await generateMatchFilterPipeline(mongoClient, queryResponse.modifiedQuery.filters);
    const loadoutList = await shipStats.getShipLoadouts(mongoClient, item._id, filterPipeline);
    const shipsWinrates = await shipStats.getShipsWinrates(mongoClient, filterPipeline);

    queryResponse.loadoutList = loadoutList;
    queryResponse.shipsWinrates = shipsWinrates;

    res.status(200).json(queryResponse);
});

app.post(
    '/ship_matchup_stats',
    async function(req, res) {
        const dat = await shipStats.getShipMatchupStats(mongoClient, req.body.TargetShip);
        // console.log()
        res.status(200).json(dat);
});

app.get(
    '/game-item/:itemType/:itemId',
    async function(req, res) {
        const itemType = req.params.itemType;
        const itemId = Number(req.params.itemId);
        let collection; 
        if (itemType === 'gun') 
            collection = mongoClient.db("mhtest").collection("Items-Guns");
        else if (itemType === 'ship') 
            collection = mongoClient.db("mhtest").collection("Items-Ships");
        else {
            res.status(404).end();
            return;
        }

        const item = await collection.findOne({_id: itemId});
        if (item) {
            res.status(200).json(item);
            return;
        }
        res.status(404).end();
    }
)


async function run() {
    try {
        // Connect to mongodb
        console.log("Connecting to db...")
        await mongoClient.connect();
        matchHistory.setMongoClient(mongoClient);
        matchHistoryRetrieve.setMongoClient(mongoClient);
        console.log("Connected to db...");

        // Start Http server
        console.log("Starting http server...");
        var httpServer = http.createServer(app);
        httpServer.listen(80);

    } finally {
        // console.log("Disconnecting from db...");
        // await matchHistory.close();
    }
}

console.log("Starting server...")
run().catch(console.dir);