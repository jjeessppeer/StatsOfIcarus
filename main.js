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
const {HISTORY_SEARCH_SCHEMA, MATCH_REQUEST_SCHEMA, MATCH_SUBMISSION_SCHEMA, PLAYER_SUBMISSION_SCHEMA} = require("./MatchHistory/requestSchemas.js");


const db_url = process.env.MONGODB_URL_STRING;
let mongoClient = new MongoClient(db_url);

const MOD_VERSION_LATEST = "0.2.0";

// var bodyParser = require("body-parser");
var requestIp = require('request-ip');
const { assert } = require('console');
const { nextTick } = require('process');

var app = express()

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
app.use(express.json());
app.use(express.static('public'));

app.get('/get_datasets', async function (req, res) {
    let ip = requestIp.getClientIp(req);
    const db = mongoClient.db("GameStats");
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
    res.status("202").send();
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