require('dotenv').config()
var express = require('express');
const { checkSchema, validationResult, check } = require('express-validator');
const Joi = require('joi');
const { MongoClient, ReturnDocument } = require("mongodb");
var fs = require('fs');
var http = require('http');

const zlib = require('zlib');
const util = require('util');
const unzip = util.promisify(zlib.unzip);
const inflate = util.promisify(zlib.inflate);

const matchHistory = require("./matchHistory.js");
const matchHistorySubmit = require("./MatchHistory/matchHistorySubmit.js");
const matchHistoryRetrieve = require("./MatchHistory/matchHistoryRetrieve.js");
const matchHistoryUtils = require("./MatchHistory/matchHistoryUtils.js");
const { HISTORY_SEARCH_SCHEMA, MATCH_REQUEST_SCHEMA } = require("./RequestSchemas/HistoryRequest.js");
const { MATCH_SUBMISSION_SCHEMA } = require("./RequestSchemas/MatchSubmit.js");


const db_url = process.env.MONGODB_URL_STRING;
let mongoClient = new MongoClient(db_url);

const MOD_VERSION_LATEST = "0.2.0";

var requestIp = require('request-ip');
const { assert } = require('console');
const { nextTick } = require('process');

var app = express();

app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({
    limit: '100mb', 
    extended: true}));
app.use(express.text({
    limit: '100mb'}));
// app.use(express.urlencoded({limit: "500mb"}))
// app.use(express.urlencoded({
//     limit: "50mb",
//     extended: true
// }))
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

    if (req.body.ModVersion != MOD_VERSION_LATEST) {
        return res.status(400).send(`MatchHistoryMod version incompatible. Required version ${MOD_VERSION_LATEST} (recieved ${req.body.ModVersion})`);
    }
    
    let alreadySubmitted = await matchHistory.matchAlreadySubmitted(req.body.MatchId);
    if (alreadySubmitted) {
        return res.status(400).send(`Match already submitted.`);
    }

    var inflated = (await unzip(Buffer.from(req.body.GameData, 'base64'))).toString();
    var gameDataObj = JSON.parse(inflated);
    req.body.GameData = gameDataObj;

    let validationResult = MATCH_SUBMISSION_SCHEMA.validate(req.body);
    if (validationResult.error){
        console.log(validationResult.error)
        return res.status(400).send("Error submitting match history.");
    }
    res.status(202).send();
    matchHistory.submitRecord(req.body, ip);
});

app.get(
    '/match/:matchId/details',
    async function(req, res) {
    console.log(req.params);
    let details = await matchHistory.getMatchDetails(req.params.matchId);
    if (!details) {
        return res.status(404).send('Match not found.');
    }
    let inflated = await inflate(Buffer.from(details.GameData, 'base64'));
    inflated = JSON.parse(inflated);
    res.status(200).json(inflated);
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