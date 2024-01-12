// require('dotenv').config()

var express = require('express');
const Joi = require('joi');
const { MongoClient, ReturnDocument } = require("mongodb");
var fs = require('fs');
var http = require('http');
const semver = require('semver');

const schemaMiddleware = require('./SchemaValidation/middleware.js');
const schemas = require('./SchemaValidation/schemas.js');

const matchHistory = require("./matchHistory.js");
const matchHistorySubmit = require("./MatchHistory/matchHistorySubmit.js");
const matchHistoryRetrieve = require("./MatchHistory/matchHistoryRetrieve.js");
const matchHistoryUtils = require("./MatchHistory/matchHistoryUtils.js");
const elo = require("./Elo/EloHelper.js");
const lobbyBalancer = require("./Elo/LobbyBalancer.js");
const { HISTORY_SEARCH_SCHEMA, MATCH_REQUEST_SCHEMA } = require("./MatchHistory/requestSchemas.js");

const matchRetrieve = require('./MatchHistory/Retrieve.js');

const shipStats = require('./ShipStats/ShipStats.js');

const { MONGODB_URL_STRING } = require("../config.json");
let mongoClient = new MongoClient(MONGODB_URL_STRING);

const MOD_VERSION_LATEST = "1.0.0";

const zlib = require('zlib');
const util = require('util');
const unzip = util.promisify(zlib.unzip);
const inflate = util.promisify(zlib.inflate);

// var bodyParser = require("body-parser");
var requestIp = require('request-ip');

var app = express()
app.use(express.json({ limit: '30mb' }));
app.use(express.text({ limit: '30mb' }));
app.use(express.urlencoded({
    limit: '30mb', 
    extended: true}));
app.use(express.static('public'));

app.get('/mod', function(req, res) {
    res.redirect('https://github.com/jjeessppeer/MatchHistoryMod/releases');
});

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

app.get('/match/:matchId/gunneryDetails',
    async function(req, res) {
    const matchesCollection = mongoClient.db("mhtest").collection("Matches");
    let agg = matchesCollection.aggregate([
        {$match: {MatchId: req.params.matchId}},
        {$project: {
            GunneryData: 1
        }}
    ]);
    let doc = await agg.next();
    if (!doc) {
        return res.status(404).send('Match not found.');

    }
    var inflated = (await unzip(Buffer.from(doc.GunneryData, 'base64'))).toString();
    var gunneryData = JSON.parse(inflated);
    res.status(200).json(gunneryData);
});

app.get('/match/:matchId/positionData',
    async function(req, res) {
    const matchesCollection = mongoClient.db("mhtest").collection("Matches");
    let agg = matchesCollection.aggregate([
        {$match: {MatchId: req.params.matchId}},
        {$project: {
            PositionData: 1
        }}
    ]);
    let doc = await agg.next();
    if (!doc || !doc.PositionData) {
        return res.status(404).send('Match not found.');

    }
    var inflated = (await unzip(Buffer.from(doc.PositionData, 'base64'))).toString();
    var positionData = JSON.parse(inflated);
    res.status(200).json(positionData);
});

app.post('/submit_match_history', 
    // schemaMiddleware(schemas.MATCH_SUBMISSION_SCHEMA),
    async function (req, res) {
    let ip = requestIp.getClientIp(req);

    let modVersion;
    try {
        modVersion = Joi.attempt(req.body.ModVersion, Joi.string().required());
    }
    catch (err) {
        return res.status(400).send(`MatchHistoryMod version incompatible.\nUpdate on github or statsoficarus.xyz/mod`);
    }

    modVersion = semver.valid(modVersion);
    if (modVersion == null) return;
    if (semver.satisfies(modVersion, '>=1.0.0')) {
        const validationResult = schemas.MATCH_SUBMISSION_2.validate(req.body);
        if (validationResult.error)
            return res.status(400).send(`MatchHistoryMod version incompatible.\nUpdate on github or statsoficarus.xyz/mod`);
        // var inflated = (await unzip(Buffer.from(req.body.CompressedPositionData, 'base64'))).toString();
        // var positionData = JSON.parse(inflated);
        // console.log(positionData);
        matchHistory.submitRecord(req.body.LobbyData, req.body.CompressedGunneryData, req.body.CompressedPositionData, ip);
        return res.status(200).send();
    }
    else if(semver.satisfies(modVersion, '>=0.1.3')) {
        const validationResult = schemas.MATCH_SUBMISSION_1.validate(req.body);
        if (validationResult.error)
            return res.status(400).send(`MatchHistoryMod version incompatible.\nUpdate on github or statsoficarus.xyz/mod`);
        // Upload 0.1 data.
        matchHistory.submitRecord(req.body, false, false, ip);
        return res.status(400).send(`New version of MatchHistoryMod available. \nCurrent: ${req.body.ModVersion} \nLatest: ${MOD_VERSION_LATEST}\nUpdate on github or statsoficarus.xyz/mod`);
    }

    return res.status(400).send(`MatchHistoryMod version incompatible.\nUpdate on github or statsoficarus.xyz/mod`);
});

app.post('/match_history_search',
    async function(req, res) {

    let validationResult = HISTORY_SEARCH_SCHEMA.validate(req.body);
    if (validationResult.error){
        return res.status(400).send();
    }
    let responseData = await matchHistoryRetrieve.matchHistorySearch(req.body);
    res.status(200).json(responseData);
});

app.post('/request_matches', 
    async function(req, res) {

    let requestValidation = MATCH_REQUEST_SCHEMA.validate(req.body);
    if (requestValidation.error){
        return res.status(400).send();
    }

    let matches = await matchHistoryRetrieve.getRecentMatches(req.body.filters, req.body.page);
    
    res.status(200).json(matches);
});

app.post('/player_rating',
    schemaMiddleware(schemas.eloTimelineRequest),
    async function(req, res) {
        
    const eloTimeline = await elo.getPlayerEloData(mongoClient, req.body.playerId, req.body.rankingGroup);
    const ladderRank = await elo.getLeaderboardPosition(mongoClient, req.body.rankingGroup, req.body.playerId);
    res.status(200).json({Timeline: eloTimeline, LadderRank: ladderRank});
});

app.post('/balance_lobby',
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

app.post('/leaderboard_page',
    schemaMiddleware(schemas.leaderboardRequest),
    async function(req, res) {
    
    const pageSize = 10;
    const start = Math.floor(req.body.Position / pageSize) * pageSize;
    let page = await elo.getLeaderboardPage(mongoClient, req.body.RatingGroup, start, pageSize);
    res.status(200).json(page);
});


const {processHistoryQuery, generateMatchFilterPipeline} = require('./MatchHistory/HistoryFilter.js');
app.post('/ship_loadouts',
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

app.post('/ship_matchup_stats',
    async function(req, res) {
    const dat = await shipStats.getShipMatchupStats(mongoClient, req.body.TargetShip);
    res.status(200).json(dat);
});

app.get('/game-item/:itemType/:itemId',
    async function(req, res) {
    const itemType = req.params.itemType;
    const itemId = Number(req.params.itemId);
    let collection; 
    if (itemType === 'gun') 
        collection = mongoClient.db("mhtest").collection("Items-Guns");
    else if (itemType === 'ship') 
        collection = mongoClient.db("mhtest").collection("Items-Ships");
    else if (itemType === 'map')
        collection = mongoClient.db("mhtest").collection("Items-Maps");
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
});

app.get('/guns', async function(req, res) {
    collection = mongoClient.db("mhtest").collection("Items-Guns");
    const guns = await collection.find({Usable: true}).toArray();
    res.status(200).json(guns);
});

app.get('/ammos', async function(req, res) {
    collection = mongoClient.db("mhtest").collection("Items-Skills");
    const ammos = await collection.find({SkillType: 2}).toArray();
    res.status(200).json(ammos);
})

app.get('/ships', async function(req, res) {
    collection = mongoClient.db("mhtest").collection("Items-Ships");
    const ships = await collection.find({Usable: true}).toArray();
    res.status(200).json(ships);
})

app.get('/maps/:mode/:teams/:ships', async function(req, res) {
    const mode = Number(req.params.mode);
    const ships = Number(req.params.ships);
    const teams = Number(req.params.teams);
    if (!ships || !teams || !mode) return res.status(404).send();
    const collection = mongoClient.db("mhtest").collection("Items-Maps");
    const maps = await collection.find({
        GameMode: mode,
        TeamSize: {$size: teams},
        [`TeamSize.${teams-1}`]: ships,
        Public: true
    }).toArray();
    res.status(200).json(maps);
});




app.post('/search/player', async function(req, res) {
    // Get player specific data. Winrate, elo and stuff.
});

app.post('/search/ship', async function(req, res) {
    // Get ship specific data
});

app.post(
    '/matches', 
    schemaMiddleware(schemas.matchListRequest),
    async function(req, res) {
    const matches = await matchRetrieve.getMatches(mongoClient, req.body.filter, req.body.page);
    res.status(200).json(matches);
});

app.get('/pickrate/:shipModel/:timestampStart/:timestampEnd', async function(req, res) {
    const shipModel = Number(req.params.shipModel);
    const timestampStart = Number(req.params.timestampStart);
    const timestampEnd = Number(req.params.timestampEnd);
    const timeSpan = timestampEnd - timestampStart;
    const weeks = Math.ceil(timeSpan / 1000 / 60 / 60 / 24 / 7);
    const buckets = Math.max(0, Math.min(weeks, 100));
    const collection = mongoClient.db("mhtest").collection("Matches");
    const agg = collection.aggregate([
        { $match: {Timestamp: {$gt: timestampStart, $lt: timestampEnd}}},
        { "$unwind": {
            path: "$ShipModels",
            includeArrayIndex: "TeamIndex"}},
        { "$unwind": {
            path: "$ShipModels"
        }},
        { $bucketAuto: {
            groupBy: "$Timestamp",
            buckets: buckets,
            output: {
                picks: { $sum: { $cond: [{$eq: ["$ShipModels", shipModel]}, 1, 0] } },
                count: { $sum: 1 }
            }
        }}
    ]);
    const r = await agg.toArray();
    res.status(200).json(r);
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