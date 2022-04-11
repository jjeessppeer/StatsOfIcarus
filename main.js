require('dotenv').config()
var express = require('express');
const { MongoClient, ReturnDocument } = require("mongodb");
var fs = require('fs');
var http = require('http');
const matchHistory = require("./matchHistory.js");

const db_url = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_ADRESS}/`;
// const db_url = `mongodb://localhost:27017/`;
let mongoClient = new MongoClient(db_url);

const MOD_VERSION_LATEST = "0.1.3";


var bodyParser = require("body-parser");
var requestIp = require('request-ip');
const sqlite = require('better-sqlite3');
const { assert } = require('console');

const data_db = new sqlite('databases/data_db.db', { fileMustExist: true, readonly: true });

var app = express()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/ping', function (req, res) {
    let ip = requestIp.getClientIp(req);
    res.status(200).send("OK");
});

app.get('/get_match_history', function (req, res) {
    let ip = requestIp.getClientIp(req);
    matches = data_db.prepare("SELECT * FROM Match_History").all();
    res.status(200).json(matches);
});

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
        res.status("400").send(`Mod version incompatible. Required version ${latestModVersion} (recieved ${req.body.ModVersion})`);
        return;
    }
    matchHistory.submitRecord(req.body, ip);
    res.status("202").send();
});

app.post('/get_match_history2', async function (req, res) {
    let ip = requestIp.getClientIp(req);


    let options = req.body;
    let filters = options.filters;
    let offset = options.offset;
    let count = options.count;
    let perspective = options.perspective;
    // console.log(options)
    let response = await matchHistory.getMatches(filters, perspective, offset, count);
    res.status("200").json(response);
});

app.get('/item-dataset', async function (req, res) {
    const mapCollection = mongoClient.db("mhtest").collection("Items-Maps");
    const skillCollection = mongoClient.db("mhtest").collection("Items-Skills");
    const gunCollection = mongoClient.db("mhtest").collection("Items-Guns");
    const shipCollection = mongoClient.db("mhtest").collection("Items-Ships");
    let response = {
        "Maps": await mapCollection.find({GameMode: 2}).toArray(),
        "Ships": await shipCollection.find({}).toArray(),
        "Guns": await gunCollection.find({}).toArray(),
        "Skills": await skillCollection.find({}).toArray()
    }
    res.status("200").json(response);
});

app.get('/item', async function (req, res) {
    const mapCollection = mongoClient.db("mhtest").collection("Items-Maps");
    const skillCollection = mongoClient.db("mhtest").collection("Items-Skills");
    const gunCollection = mongoClient.db("mhtest").collection("Items-Guns");
    const shipCollection = mongoClient.db("mhtest").collection("Items-Ships");

    let itemType = req.query.Item;
    let itemId = req.query.Id;
    if (!(itemType && itemId)){
        res.status("404").send();
        return;
    }
    let response = false;

    if (itemType == "map"){
        response = await mapCollection.findOne({_id: Number(req.query.Id)});
    }
    if (itemType == "skill"){
        response = await skillCollection.findOne({_id: Number(req.query.Id)});
    }
    if (itemType == "gun"){
        response = await gunCollection.findOne({_id: Number(req.query.Id)});
    }
    if (itemType == "ship"){
        response = await shipCollection.findOne({_id: Number(req.query.Id)});
    }
    if (!response || response.IconPath == "") {
        res.status("404").send();
        return;
    }
    res.status("200").json(response);

    // res.sendFile(__dirname + "/public/images/item-icons/item195.png");
    // res.status("200").json(response);
    
});

app.get('/item-icon', async function (req, res) {
    const mapCollection = mongoClient.db("mhtest").collection("Items-Maps");
    const skillCollection = mongoClient.db("mhtest").collection("Items-Skills");
    const gunCollection = mongoClient.db("mhtest").collection("Items-Guns");
    const shipCollection = mongoClient.db("mhtest").collection("Items-Ships");

    let itemType = req.query.Item;
    let itemId = req.query.Id;
    if (!(itemType && itemId)){
        res.status("404").send();
        return;
    }

    let response = false;
    if (itemType == "map"){
        response = await mapCollection.findOne({_id: Number(req.query.Id)});
    }
    if (itemType == "skill"){
        response = await skillCollection.findOne({_id: Number(req.query.Id)});
    }
    if (itemType == "gun"){
        response = await gunCollection.findOne({_id: Number(req.query.Id)});
    }
    if (itemType == "ship"){
        response = await shipCollection.findOne({_id: Number(req.query.Id)});
    }
    if (!response || response.IconPath == "") {
        res.status("404").send();
        return;
    }
    res.sendFile(`${__dirname}/public/images/item-icons/${response.IconPath}`);
    // res.status("200").json(response);
    
});

async function run() {
    try {
        // Connect to mongodb
        console.log("Connecting to db...")
        await mongoClient.connect();
        matchHistory.setMongoClient(mongoClient);
        // await matchHistory.connect();
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

// // Start HTTP server
// var httpServer = http.createServer(app);
// httpServer.listen(80);

// Start HTTPS server
// var privateKey  = fs.readFileSync('/etc/letsencrypt/live/statsoficarus.xyz/privkey.pem', 'utf8');
// var certificate = fs.readFileSync('/etc/letsencrypt/live/statsoficarus.xyz/cert.pem', 'utf8');
// var ca = fs.readFileSync('/etc/letsencrypt/live/statsoficarus.xyz/chain.pem');
// var credentials = {key: privateKey, cert: certificate, ca: ca};
// var httpsServer = https.createServer(credentials, app);
// httpsServer.listen(443);