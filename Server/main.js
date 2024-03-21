// require('dotenv').config()

var express = require('express');
const Joi = require('joi');
const mongodb = require("mongodb");
const { MongoClient, ReturnDocument } = require("mongodb");
var fs = require('fs');
const stream = require('stream');
var http = require('http');
const semver = require('semver');
const { Lock } = require("../Lock.js");
const insertionLock = new Lock();

const { schemaMiddleware, queryValidator, bodyValidator } = require('./SchemaValidation/middleware.js');
const schemas = require('./SchemaValidation/schemas.js');

// const matchHistory = require("./matchHistory.js");
const MatchHistory = require("./MatchHistory/MatchHistory.js");
const acmi = require("./Acmi/acmi.js");
// const lobbyBalancer = require("./Elo/LobbyBalancer.js");
// const shipStats = require('./ShipStats/ShipStats.js');

const { MONGODB_URL_STRING } = require("../config.json");
let mongoClient = new MongoClient(MONGODB_URL_STRING);

const MOD_VERSION_LATEST = "2.0.0";

const zlib = require('zlib');
const util = require('util');
const unzip = util.promisify(zlib.unzip);
const inflate = util.promisify(zlib.inflate);

var requestIp = require('request-ip');

const app = express()
app.use(express.json({ limit: '30mb' }));
app.use(express.text({ limit: '30mb' }));
app.use(express.urlencoded({
    limit: '30mb', 
    extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');


app.get('/', function(req, res) {
  res.redirect('/MatchHistory');
});

app.get('/MatchHistory', function(req, res) {
  res.render('pages/MatchHistory');
});

app.get('/DamageCalculator', function(req, res) {
    res.render('pages/DamageCalculator');
});

app.get('/Maps', function(req, res) {
    res.render('pages/Maps');
});

app.get('/TournamentRandomizer', function(req, res) {
    res.render('pages/TournamentRandomizer');
});

app.get('/About', function(req, res) {
    res.render('pages/About');
});

app.get('/ShipBuilder', function(req, res) {
    res.render('pages/ShipBuilder');
});

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

// app.get('/match/:matchId/gunneryDetails',
//     async function(req, res) {
//     const matchesCollection = mongoClient.db("mhtest").collection("Matches");
//     let agg = matchesCollection.aggregate([
//         {$match: {MatchId: req.params.matchId}},
//         {$project: {
//             GunneryData: 1
//         }}
//     ]);
//     let doc = await agg.next();
//     if (!doc) {
//         return res.status(404).send('Match not found.');
//     }
//     var inflated = (await unzip(Buffer.from(doc.GunneryData, 'base64'))).toString();
//     var gunneryData = JSON.parse(inflated);
//     res.status(200).json(gunneryData);
// });

// app.get('/match/:matchId/positionData',
//     async function(req, res) {
//     const matchesCollection = mongoClient.db("mhtest").collection("Matches");
//     let agg = matchesCollection.aggregate([
//         {$match: {MatchId: req.params.matchId}},
//         {$project: {
//             PositionData: 1
//         }}
//     ]);
//     let doc = await agg.next();
//     if (!doc || !doc.PositionData) {
//         return res.status(404).send('Match not found.');
//     }
//     var inflated = (await unzip(Buffer.from(doc.PositionData, 'base64'))).toString();
//     var positionData = JSON.parse(inflated);
//     res.status(200).json(positionData);
// });

app.get('/match/:matchId/replay', async function(req, res) {
    const matchId = req.params.matchId

    const db = mongoClient.db("mhtest");
    const bucket = new mongodb.GridFSBucket(db, { bucketName: 'fsReplays' });
    const cursor = bucket.find({filename: matchId});
    const doc = await cursor.next();
    if (!doc) {
        return res.status(404).send("Match not found.");
    }
    const matchDoc = await db.collection("Matches").findOne({MatchId: matchId});
    if (!matchDoc) {
        return res.status(404).send("Match not found.");
    }
    const mapItem = await db.collection("Items-Maps").findOne({_id: matchDoc.MapId});
    res.attachment(`${doc.uploadDate.toISOString().substring(0, 10)}_${mapItem.Name}.acmi`);
    bucket.openDownloadStream(doc._id).pipe(res);
});

app.post('/submit_match_history', 
    async function (req, res) {
    let ip = requestIp.getClientIp(req);

    const modVersion = semver.valid(req.body.ModVersion);
    if (modVersion == null){
        return res.status(400).send(`MatchHistoryMod version incompatible.\nUpdate on github or statsoficarus.xyz/mod`);
    }

    // TODO: Come up with cleaner backwards compatibility.
    let updateAvailable = false;
    let uploadFailed = false;

    if (semver.satisfies(modVersion, '>=2.0.0')) {
        const validationResult = schemas.MatchSubmission['2.0.0'].validate(req.body);
        if (validationResult.error)
            uploadFailed = true;
        else
            MatchHistory.submitRecord(req.body.LobbyData, false, false, ip, insertionLock);
    }
    else if (semver.satisfies(modVersion, '>=1.0.0')) {
        const validationResult = schemas.MatchSubmission['1.0.0'].validate(req.body);
        if (validationResult.error)
            uploadFailed = true;
        else
            MatchHistory.submitRecord(req.body.LobbyData, req.body.CompressedGunneryData, req.body.CompressedPositionData, ip, insertionLock);
        // updateAvailable = true;
    }
    else if(semver.satisfies(modVersion, '>=0.1.3')) {
        const validationResult = schemas.MatchSubmission['0.1.3'].validate(req.body);
        if (validationResult.error)
            uploadFailed = true;
        else
            MatchHistory.submitRecord(req.body, false, false, ip, insertionLock);
        updateAvailable = true;
    }
    else {
        uploadFailed = true;
    }

    // Return status.
    if (uploadFailed) {
        return res.status(400).send(`MatchHistoryMod version incompatible.\nUpdate on github or statsoficarus.xyz/mod`);
    }
    else if (updateAvailable) {
        return res.status(400).send(`New version of MatchHistoryMod available. \nCurrent: ${req.body.ModVersion} \nLatest: ${MOD_VERSION_LATEST}\nUpdate on github or statsoficarus.xyz/mod`);
    }

    return res.status(200).send();
});

app.post('/submit_replay', async function(req, res) {
    const matchId = req.body.MatchId;
    const acmiString = req.body.AcmiString;
    const success = await MatchHistory.submitReplay(mongoClient, acmiString, matchId, insertionLock);

    if (success) return res.status(200).send();
    return res.status(400).send("Failed to upload replay.");
});

app.get('/match_list/page/:page',
    queryValidator(schemas.matchFilter),
    async function (req, res) {
    const page = Number(req.params.page);
    const matches = await MatchHistory.getMatches(mongoClient, req.query, page);
    res.status(200).json(matches);
});

app.get('/leaderboard/:category/:page',
    async function(req, res) {
    const page = Number(req.params.page);
    const category = String(req.params.category);
    const leaderboardPage = await MatchHistory.getLeaderboardPage(mongoClient, page, category);
    res.status(200).json(leaderboardPage);
});

app.get('/player_id/:playerName',
    async function(req, res) {
    const playerName = String(req.params.playerName);
    const playerId = await MatchHistory.getPlayerIdFromName(mongoClient, playerName);
    if (isNaN(playerId)) {
        return res.status(404).send();
    }
    res.status(200).json(playerId);
});

app.get('/player/:playerId/info',
    async function(req, res) {
    const playerId = Number(req.params.playerId);
    const playerInfo = await MatchHistory.getPlayerInfo(mongoClient, playerId);
    if (!playerInfo) {
        return res.status(404).send();
    }
    res.status(200).json(playerInfo);
});

app.get('/player/:playerId/elo/:category',
    async function(req, res) {
    const playerId = Number(req.params.playerId);
    const category = String(req.params.category);
    const eloTimeline = await MatchHistory.getEloTimeline(mongoClient, playerId, category);
    const leaderboardPosition = await MatchHistory.getLeaderboardPosition(mongoClient, playerId, category);
    res.status(200).json({
        EloTimeline: eloTimeline, 
        LeaderboardPosition: leaderboardPosition});
});

app.get('/player/:playerId/ship_stats',
    queryValidator(schemas.matchFilter),
    async function(req, res) {
    const playerId = Number(req.params.playerId);
    const filter = req.query;
    const stats = await MatchHistory.getPlayerShipStats(mongoClient, filter, playerId);
    res.status(200).json(stats);
});

// app.post('/balance_lobby',
//     schemaMiddleware(schemas.lobbyBalance),
//     async function(req, res) {
//     const balancedTeams = await lobbyBalancer.generateBalancedTeams(
//         mongoClient, 
//         req.body.playerIds, 
//         req.body.randomness,
//         req.body.teamCount,
//         req.body.teamSize,
//         req.body.keepPilots);
//     res.status(200).json(balancedTeams);
// });

// const {processHistoryQuery, generateMatchFilterPipeline} = require('./MatchHistory/HistoryFilter.js');
// app.post('/ship_loadouts',
//     async function(req, res) {
            
//     const collection = mongoClient.db("mhtest").collection("Items-Ships");
//     const item = await collection.findOne({Name: req.body.perspective.name});
    
//     const queryResponse = await processHistoryQuery(mongoClient, req.body);
//     const filterPipeline = await generateMatchFilterPipeline(mongoClient, queryResponse.modifiedQuery.filters);
//     const loadoutList = await shipStats.getShipLoadouts(mongoClient, item._id, filterPipeline);
//     const shipsWinrates = await shipStats.getShipsWinrates(mongoClient, filterPipeline);

//     queryResponse.loadoutList = loadoutList;
//     queryResponse.shipsWinrates = shipsWinrates;

//     res.status(200).json(queryResponse);
// });

// app.post('/ship_matchup_stats',
//     async function(req, res) {
//     const dat = await shipStats.getShipMatchupStats(mongoClient, req.body.TargetShip);
//     res.status(200).json(dat);
// });

app.get('/game-item/:itemType/:itemId',
    async function(req, res) {
    const itemType = String(req.params.itemType);
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


app.post(
    '/ship_popularity',
    schemaMiddleware(schemas.shipPopularity),
    async function(req, res) {
    const shiprates = await MatchHistory.getShipPickWinrate(mongoClient, req.body.filter);
    res.status(200).json(shiprates);
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
        MatchHistory.setMongoClient(mongoClient);
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