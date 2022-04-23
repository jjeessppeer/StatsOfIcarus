require('dotenv').config()
var express = require('express');
const { checkSchema, validationResult, check } = require('express-validator');
const Joi = require('joi');
const { MongoClient, ReturnDocument } = require("mongodb");
var fs = require('fs');
var http = require('http');
const matchHistory = require("./matchHistory.js");
const matchHistorySubmit = require("./MatchHistory/matchHistorySubmit.js");
const matchHistoryRetrieve = require("./MatchHistory/matchHistoryRetrieve.js");
const matchHistoryUtils = require("./MatchHistory/matchHistoryUtils.js");

const db_url = process.env.MONGODB_URL_STRING;
let mongoClient = new MongoClient(db_url);

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
    res.status("200").json(datasets);
});

app.post('/submit_match_history', async function (req, res) {
    let ip = requestIp.getClientIp(req);
    assert(typeof req.body.ModVersion == "string");
    if (req.body.ModVersion != MOD_VERSION_LATEST) {
        res.status("400").send(`MatchHistoryMod version incompatible. Required version ${MOD_VERSION_LATEST} (recieved ${req.body.ModVersion})`);
        return;
    }
    matchHistory.submitRecord(req.body, ip);
    res.status("202").send();
});

const HISTORY_SEARCH_SCHEMA = Joi.object({
    perspective: Joi.object({
        type: Joi.string()
            .allow('Overview', 'Player', 'Ship'),
        name: Joi.string()
            .max(100)
            .min(0)
        })
        .required(),
    filters: Joi.array().items(
        Joi.object({
            type: Joi.string().allow('Player'),
            data: Joi.string().max(100)
        }),
        Joi.object({
            type: Joi.string().allow('PlayerId'),
            data: Joi.number().integer().min(-1)
        }))
        .max(0)
        .min(0)
});
app.post(
    '/match_history_search',
    async function(req, res) {

    let result = HISTORY_SEARCH_SCHEMA.validate(req.body);
    if (result.error){
        return res.status(400).send();
    }

    let responseData = {
        perspective: req.body.perspective,
        originalQuery: JSON.parse(JSON.stringify(req.body))
    };
    if (req.body.perspective.type == 'Player') {
        // Add match filter for player;
        let playerId = await matchHistoryUtils.getPlayerIdFromName(mongoClient, req.body.perspective.name);
        if (playerId) {
            req.body.filters.push( {type: "PlayerId", id: playerId} );
            let playerData = await matchHistoryRetrieve.getPlayerInfo(req.body.perspective.name);
            responseData.playerData = playerData;
            responseData.perspective.name = playerData.PlayerInfo.Name;
        }
        
    }
    if (req.body.perspective.type == 'Overview'){
        // TODO: cache default result of overview info
        responseData.shipWinrates = await matchHistoryRetrieve.getShipsOverviewInfo();
    }
    let matches = await matchHistoryRetrieve.getRecentMatches(req.body.filters, 0);
    responseData.matches = matches;
    res.status(200).json(responseData);
});

// app.post(
//     '/get_recent_matches', 
//     async function(req, res) {
//     let page = req.body.pageNumber;
//     let filters = req.body.filters;
//     let response = await matchHistoryRetrieve.getRecentMatches(filters, page);
//     res.status(200).json(response);
// });

// app.post(
//     '/get_ship_winrates',
//     async function(req, res) {
//         let response = await matchHistoryRetrieve.getShipsOverviewInfo();
//         res.status(200).json(response);
// });

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