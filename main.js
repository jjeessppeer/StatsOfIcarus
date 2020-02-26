// var path = require('path');
var express = require('express');
var bodyParser = require("body-parser");
//var cors = require('cors');
var requestIp = require('request-ip');
const sqlite = require('better-sqlite3');
var buildParser = require('./buildParser.js');

const port = 3233

const log = require('simple-node-logger').createSimpleLogger({
  logFilePath:'serverlog.log',
  timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
});

// TODO: 
// - prevent adding duplicates
// - limit entries by ip

const access_db = new sqlite('access_db.db', { verbose: null });
const build_db = new sqlite('build_db.db', { verbose: null });
const data_db = new sqlite('data_db.db', { verbose: null });

var app = express()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/ping', function(req, res){
  let ip = requestIp.getClientIp(req);
  log.info(ip, " ping");

  access_db.prepare(`
    INSERT INTO visitors (ip, n_visits, first_visit, last_visit) 
    SELECT ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NOT EXISTS(SELECT 1 FROM visitors WHERE ip=?);`).run(ip, ip);
  access_db.prepare("UPDATE visitors SET n_visits=n_visits+1, last_visit=CURRENT_TIMESTAMP WHERE ip=?").run(ip);
  access_db.prepare("INSERT INTO accesses (ip) VALUES (?)").run(ip);
  res.status(200).send("OK");
});

app.get('/get_datasets', function(req, res) {
  let ip = requestIp.getClientIp(req);
  log.info(ip, " get_datasets \t Datasets requested.");
  let datasets = {};
  datasets.history = data_db.prepare("SELECT * FROM Match_History").all();
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

app.post('/request_build', function(req, res, next) {
  let ip = requestIp.getClientIp(req);
  let start = req.body[0];
  let end = req.body[1];
  let name_filter = req.body[2];
  let ship_filter = req.body[3];
  let pve_filter = req.body[4];
  let submitter_filter = req.body[5];
  let sorting = req.body[6];
  log.info(ip, " request_build \t Builds [", start, ",", start+8, "]");
  if (!(typeof start == 'number' && typeof end == 'number' && typeof name_filter == 'string' &&
      typeof ship_filter == 'string' && typeof pve_filter == 'string' && typeof submitter_filter == 'string'
      && typeof sorting == 'string') || start<1){
    res.status(400).send("bad request");
    return;
  }
  
  let params = ['%'+name_filter+'%', ip];
  let sql = `
      SELECT * FROM ship_builds 
      WHERE 
      name LIKE ?
      AND (public=true OR submitter_ip=?)`;
  if (ship_filter != 'Any'){
    sql += " AND INSTR(ship_type, ?)>0";
    params.push(ship_filter);
  }
  if (pve_filter != 'Include'){
    sql += " AND INSTR(pve, ?)>0";
    params.push(pve_filter!="Exclude" ? 1 : 0);
  }
  if (submitter_filter != "Anyone"){
    sql += " AND submitter_ip " + (submitter_filter=="Me" ? "=" : "!=") + " ?";
    params.push(ip);
  }
  if (sorting == "Votes (Asc.)") 
    sql += " ORDER BY upvotes ASC";
  else if (sorting == "Date (new)")
    sql += " ORDER BY submission_time DESC";
  else if (sorting == "Date (old)")
    sql += " ORDER BY submission_time ASC";
  else if (sorting == "Alphabetical")
    sql += " ORDER BY name COLLATE NOCASE ASC";
     
  else
    sql += " ORDER BY upvotes DESC";

  params.push(start-1);
  sql += " LIMIT ?, 8";

  let builds = build_db.prepare(sql).all(...params);
  let responseData = [];
  for (let i=0; i<builds.length; i++){
    responseData.push({
      build_id: builds[i].id,
      build_code: builds[i].build_code,
      upvotes: builds[i].upvotes,
      description: builds[i].description,
      voted: false,
      mine: requestIp.getClientIp(req) == builds[i].submitter_ip,
      public: Boolean(builds[i].public)
    });
  }
  
  let voter = build_db.prepare("SELECT * FROM voters WHERE ip=?").get(ip);
  if (voter){
    let votes = JSON.parse(voter.upvoted_ids);
    for (let i=0; i<responseData.length; i++){
      responseData[i].voted = votes.indexOf(responseData[i].build_id) != -1;
    }
  }

  let n_builds = build_db.prepare("SELECT COUNT(*) as rowCount FROM ship_builds;").get().rowCount;

  res.status(200).json([responseData, n_builds]);
});

app.post('/request_single_build', function(req, res) {
  let ip = requestIp.getClientIp(req);
  let build_id = req.body[0];
  log.info(ip, " request_single_build \t id:", build_id);
  let build = build_db.prepare("SELECT * FROM ship_builds WHERE id=? AND (submitter_ip=? OR public=true)").get(build_id, ip);
  if (!build){
    res.status(400).send("bad request");
    return;
  }
  res.status(200).json([build.build_code, build.description]);
});

app.post('/submit_build', function(req, res, next) {
  let ip = requestIp.getClientIp(req);
  let build_code = req.body[0];
  let description = req.body[1];
  if (!(typeof build_code == 'string'  && typeof description == 'string' )){
    res.status(400).send("bad request");
    return;
  }
  let build_data = buildParser.parseBuildCode(build_code);
  if (!build_data || build_data.name.length == 0){
    res.status(400).send("bad request");
    return;
  }

  let name = build_data.name;
  let ship_type = build_data.ship;
  let pve = build_data.pve ? 1 : 0;

  let lastID = build_db.prepare(`INSERT INTO ship_builds 
    (submitter_ip, name, ship_type, pve, build_code, description, upvotes, public) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(ip, name, ship_type, pve, build_code, description, 0, 0).lastInsertRowid;
  
  
  log.info(ip, " submit_build \t ", lastID, ", ", name, ", ", build_code);
  res.status(200).json([lastID]);
});

app.post('/upvote_build', function(req, res) {
  let ip = requestIp.getClientIp(req);
  let build_id = parseInt(req.body[0]);
  let enabling_vote = Boolean(req.body[1]);
  if (!(typeof build_id == 'number' && typeof enabling_vote == 'boolean')){
    res.status(400).send("bad request");
    return;
  }

  let build_exist = build_db.prepare("SELECT * FROM ship_builds WHERE id=?").get(build_id);
  if(!build_exist){
    res.status(400).send("bad request: non existant build");
    return;
  }

  // Add new voter if not existing.
  build_db.prepare(`
    INSERT INTO voters (ip, upvoted_ids) 
    SELECT ?, ?
    WHERE NOT EXISTS(SELECT 1 FROM voters WHERE ip=?);`).run(ip, JSON.stringify([]), ip);

  let votes = build_db.prepare("SELECT upvoted_ids FROM voters WHERE ip=?").get(ip).upvoted_ids;
  votes = JSON.parse(votes);
  let vote_change = 0;
  let has_voted = votes.includes(build_id);
  if (!has_voted && enabling_vote){
    votes.push(build_id);
    vote_change = 1;
  }
  else if (has_voted && !enabling_vote){
    let index = votes.indexOf(build_id);
    if (index > -1) votes.splice(index, 1);
    vote_change = -1;
  }
  
  build_db.prepare("UPDATE voters SET upvoted_ids=? WHERE ip=?").run(JSON.stringify(votes), ip);
  build_db.prepare("UPDATE ship_builds SET upvotes=upvotes+? WHERE id=?").run(vote_change, build_id);
  
  log.info(ip, " upvote_build \t id:", build_id, " change:"+vote_change, " votes: ", JSON.stringify(votes));
  res.status(200).json({id: build_id, voted: enabling_vote});

});

app.post('/remove_build', function(req, res) {
  let ip = requestIp.getClientIp(req);
  let build_id = parseInt(req.body[0]);
  if (build_id == NaN){
    res.status(400).send("bad request");
    return;
  }
  log.info(ip, " remove_build \t id:", build_id);
  build_db.prepare("INSERT INTO ship_builds_removals SELECT CURRENT_TIMESTAMP, * FROM ship_builds WHERE id=? AND submitter_ip=?;").run(build_id, ip);
  build_db.prepare("DELETE FROM ship_builds WHERE id=? AND submitter_ip=?;").run(build_id, ip);
  res.status(200).send("build removed");
});

app.post('/publicice_build', function(req, res) {
  let ip = requestIp.getClientIp(req);
  let build_id = parseInt(req.body[0]);
  let make_public = Boolean(req.body[1]) ? 1 : 0;
  log.info(ip, " publicice_build \t id:", build_id, " public:", make_public);
  build_db.prepare("UPDATE ship_builds SET public=? WHERE id=? AND submitter_ip=?").run(make_public, build_id, ip);
  res.status(200).json([make_public, build_id]);
});



app.listen(port, () => log.info(`Server started. Listening on ${port}!`))
