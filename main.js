var express = require('express');
var fs = require('fs');
var http = require('http');

const matchHistory = require("./matchHistory.js");
let record = JSON.parse(fs.readFileSync('record.json'));

var bodyParser = require("body-parser");
var requestIp = require('request-ip');
const sqlite = require('better-sqlite3');

const logOpts = {
  fileNamePattern:'log-<DATE>.log',
  logDirectory:'logs',
  timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS',
  dateFormat:'YYYY.MM.DD'
}
const log = require('simple-node-logger').createRollingFileLogger(logOpts);
const data_db = new sqlite('databases/data_db.db', { fileMustExist: true, readonly: true });

var app = express()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/ping', function(req, res){
  let ip = requestIp.getClientIp(req);
  log.info(ip, " ping.");
  res.status(200).send("OK");
});

app.get('/get_match_history', function(req, res) {
  let ip = requestIp.getClientIp(req);
  log.info(ip, " get_match_history \t Matches requested.");
  matches = data_db.prepare("SELECT * FROM Match_History").all();
  res.status(200).json(matches);
});

app.get('/get_datasets', function(req, res) {
  let ip = requestIp.getClientIp(req);
  log.info(ip, " get_datasets \t Datasets requested.");
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

app.post('/submit_match_history', function(req, res) {
  let ip = requestIp.getClientIp(req);
  console.log("Recieving match record");
  matchHistory.submitRecord(req.body);
  res.status("200").send("OK");
});

app.post('/get_match_history2', async function(req, res) {
  let ip = requestIp.getClientIp(req);
  let response = await matchHistory.getMatches([], 0, 10);
  res.status("200").json(response);
});






async function run() {
  try {
      // Connect to mongodb
      console.log("Connecting to db...")
      await matchHistory.connect();
      console.log("Connected to db...");

      // await matchHistory.getRecords();

      // await matchHistory.insertMatchHistory(record);

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