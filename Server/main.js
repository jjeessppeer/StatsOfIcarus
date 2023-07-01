// require('dotenv').config()

var express = require('express');
const { checkSchema, validationResult, check } = require('express-validator');
const Joi = require('joi');
const { MongoClient, ReturnDocument } = require("mongodb");
var fs = require('fs');
var http = require('http');

const schemaMiddleware = require('./SchemaValidation/middleware.js');
const schemas = require('./SchemaValidation/schemas.js');

const matchHistory = require("./matchHistory.js");
const matchHistorySubmit = require("./MatchHistory/matchHistorySubmit.js");
const matchHistoryRetrieve = require("./MatchHistory/matchHistoryRetrieve.js");
const matchHistoryUtils = require("./MatchHistory/matchHistoryUtils.js");
const elo = require("./Elo/EloHelper.js");
const {HISTORY_SEARCH_SCHEMA, MATCH_REQUEST_SCHEMA, MATCH_SUBMISSION_SCHEMA, PLAYER_SUBMISSION_SCHEMA} = require("./MatchHistory/requestSchemas.js");


const shipStats = require('./ShipStats/ShipStats.js');

const { MONGODB_URL_STRING } = require("../config.json");
let mongoClient = new MongoClient(MONGODB_URL_STRING);

const MOD_VERSION_LATEST = "0.1.3";

// var bodyParser = require("body-parser");
var requestIp = require('request-ip');
const sqlite = require('better-sqlite3');
const { assert } = require('console');
const { nextTick } = require('process');

const data_db = new sqlite('databases/data_db.db', { fileMustExist: true, readonly: true });

var app = express()

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
app.use(express.json());
app.use(express.static('public'));

app.get('/get_datasets', function (req, res) {
    let ip = requestIp.getClientIp(req);
    let datasets = {};
    // datasets.history = data_db.prepare("SELECT * FROM Match_History").all();
    datasets.gun_stats = data_db.prepare("SELECT * FROM Gun_stats").all();
    datasets.ammo_stats = data_db.prepare("SELECT * FROM Ammo_stats").all();
    datasets.damage_stats = data_db.prepare("SELECT * FROM Damage_types").all();
    datasets.tool_stats = data_db.prepare("SELECT * FROM Tool_stats").all();
    datasets.component_stats = data_db.prepare("SELECT * FROM Component_stats").all();
    datasets.ship_stats = data_db.prepare("SELECT * FROM Ship_Stats").all();
    datasets.map_data = data_db.prepare("SELECT * FROM Map_data").all();
    datasets.crosshair_data = data_db.prepare("SELECT * FROM Crosshair_data").all();
    datasets.ships_gun_angles = data_db.prepare("SELECT * FROM Ships_gun_angles").all();
    res.status(200).json(datasets);
});

app.post('/submit_match_history', async function (req, res) {
    let ip = requestIp.getClientIp(req);

    let validationResult = MATCH_SUBMISSION_SCHEMA.validate(req.body);
    if (validationResult.error){
        return res.status(400).send("Error submitting match history.");
    }

    if (req.body.ModVersion != MOD_VERSION_LATEST) {
        return res.status("400").send(`MatchHistoryMod version incompatible. Required version ${MOD_VERSION_LATEST} (recieved ${req.body.ModVersion})`);
    }
    matchHistory.submitRecord(req.body, ip);
    res.status(202).send();
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