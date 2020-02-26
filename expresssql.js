var path = require('path');
var express = require('express');
var bodyParser = require("body-parser");
var cors = require('cors');
var sqlite3 = require('sqlite3').verbose();
var requestIp = require('request-ip');
// var jsStringEscape = require('js-string-escape')
var SqlString = require('sqlstring');
var buildParser = require('./buildParser.js');

const log = require('simple-node-logger').createSimpleLogger({
  logFilePath:'serverlog.log',
  timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
});

// TODO: 
// - prevent adding duplicates
// - limit entries by ip

// var db = new sqlite3.Database(':memory:');
var build_db = new sqlite3.Database('build_db.db');
var data_db = new sqlite3.Database('data_db.db', sqlite3.OPEN_READONLY);
var access_db = new sqlite3.Database('access_db.db');

// function logErr(err){
//   if (err) log.error(err)
// }

function initializeTables(){
  access_db.serialize(function() {
    access_db.run(`
      CREATE TABLE visitors (
        ip TEXT NOT NULL PRIMARY KEY,
        n_visits INTEGER,
        first_visit DATETIME,
        last_visit DATETIME
      );`);
    access_db.run(`
      CREATE TABLE accesses (
        ip TEXT NOT NULL,
        time DATETIME DEFAULT CURRENT_TIMESTAMP
      );`);
  });

  // build_db.serialize(function() {
  //   build_db.run(`
  //     CREATE TABLE ship_builds (
  //       id INTEGER PRIMARY KEY AUTOINCREMENT,
  //       submission_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  //       submitter_ip TEXT NOT NULL,
  //       name TEXT NOT NULL,
  //       ship_type TEXT NOT NULL,
  //       pve BOOLEAN NOT NULL,
  //       build_code TEXT NOT NULL,
  //       description TEXT NOT NULL,
  //       upvotes INTEGER NOT NULL,
  //       public BOOLEAN NOT NULL
  //       );`);

  //   build_db.run(`
  //     CREATE TABLE ship_builds_removals (
  //       removal_time DATETIME,
  //       id INTEGER PRIMARY KEY,
  //       submission_time DATETIME,
  //       submitter_ip TEXT NOT NULL,
  //       name TEXT NOT NULL,
  //       ship_type TEXT NOT NULL,
  //       pve BOOLEAN NOT NULL,
  //       build_code TEXT NOT NULL,
  //       description TEXT NOT NULL,
  //       upvotes INTEGER NOT NULL,
  //       public BOOLEAN NOT NULL
  //       );`);

  //   build_db.run(`
  //       CREATE TABLE voters (
  //         ip TEXT NOT NULL,
  //         upvoted_ids TEXT NOT NULL
  //       );`);
  // });
}
// initializeTables();

function sanitizeHtml(str){
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var app = express()
app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200
}))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.enable('trust proxy')
const port = 3231

app.get('/ping', function(req, res){
  let ip = requestIp.getClientIp(req);
  log.info(ip, " Pinged.");
  access_db.serialize(() => {
    access_db.run(`
      INSERT INTO visitors (ip, n_visits, first_visit, last_visit) 
      SELECT ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS(SELECT 1 FROM visitors WHERE ip=?);`, [ip, ip]);
    access_db.run("UPDATE visitors SET n_visits=n_visits+1, last_visit=CURRENT_TIMESTAMP WHERE ip=?", [ip]);
    access_db.run("INSERT INTO accesses (ip) VALUES (?)", [ip]);
  });
  res.status(200).send("OK");
})

// build_db.all("SELECT * FROM ship_builds WHERE id=?", [build_id], function(err, row){
//   console.log(row);
// });
// build_db.all("SELECT * FROM voters WHERE ip=?", [ip], function(err, row){
//   console.log(row);
// });

app.get('/get_datasets', function(req, res) {
  let ip = requestIp.getClientIp(req);
  log.info(ip, " get_datasets \t Datasets requested.");
  data_db.serialize(() => {
    let datasets = {};
    let failed = false;
    data_db.all("SELECT * FROM Match_History", (err, rows) => {
      if (err) failed = true;
      datasets.history = rows;
    });
    data_db.all("SELECT * FROM Gun_stats", (err, rows) => {
      if (err) failed = true;
      datasets.gun_stats = rows;
    });
    data_db.all("SELECT * FROM Ammo_stats", (err, rows) => {
      if (err) failed = true;
      datasets.ammo_stats = rows;
    });
    data_db.all("SELECT * FROM Damage_types", (err, rows) => {
      if (err) failed = true;
      datasets.damage_stats = rows;
    });
    data_db.all("SELECT * FROM Tool_stats", (err, rows) => {
      if (err) failed = true;
      datasets.tool_stats = rows;
    });
    data_db.all("SELECT * FROM Component_stats", (err, rows) => {
      if (err) failed = true;
      datasets.component_stats = rows;
    });
    data_db.all("SELECT * FROM Ship_Stats", (err, rows) => {
      if (err) failed = true;
      datasets.ship_stats = rows;
    });
    data_db.all("SELECT * FROM Map_data", (err, rows) => {
      if (err) failed = true;
      datasets.map_data = rows;
    });
    data_db.all("SELECT * FROM Crosshair_data", (err, rows) => {
      if (err) failed = true;
      datasets.crosshair_data = rows;
    });
    data_db.all("SELECT * FROM Ships_gun_angles", (err, rows) => {
      if (err) failed = true;
      datasets.ships_gun_angles = rows;
      
      if (failed){
        res.status("400").send("something went wrong");
      }
      else{
        res.status("200").json(datasets);
      }
    });
  })
});


app.post('/request_single_build', function(req, res) {
  let ip = requestIp.getClientIp(req);
  let build_id = req.body[0];
  log.info(ip, " request_single_build \t Build ", build_id, " requested.");
  build_db.get("SELECT * FROM ship_builds WHERE id=? AND (submitter_ip=? OR public=true)", [build_id, ip], function(err, row){
    if (err || !row){
      res.status(400).send("bad request");
      return;
    }
    console.log(row);
    res.status(200).json([row.build_code, row.description]);
  })
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
  log.info(ip, " request_build \t Builds [", start, ",", end, "] requested.");
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
    params.push(pve_filter!="Exclude");
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
    sql += " ORDER BY name ASC";
  else
    sql += " ORDER BY upvotes DESC";

    
  build_db.all(sql, params, (err, ship_row) => {
    if (err) log.error(err);
    let responseData = [];
    let n_builds = ship_row.length;
    for (let i=start-1; i<=Math.min(end-1, ship_row.length-1); i++){
      responseData.push({
        build_id: ship_row[i].id,
        build_code: ship_row[i].build_code,
        upvotes: ship_row[i].upvotes,
        description: ship_row[i].description,
        voted: false,
        mine: requestIp.getClientIp(req) == ship_row[i].submitter_ip,
        public: Boolean(ship_row[i].public)
      });
    }
    build_db.get("SELECT * FROM voters WHERE ip=?", [ip], (err, voter_row) => {
      if (voter_row){
        let votes = JSON.parse(voter_row.upvoted_ids);
        for (let i=0; i<responseData.length; i++){
          responseData[i].voted = votes.indexOf(responseData[i].build_id) != -1;
        }
      }
      res.status(200).json([responseData, n_builds]);
    })
  });
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
  let pve = build_data.pve;
  
  build_db.run(`INSERT INTO ship_builds 
      (submitter_ip, name, ship_type, pve, build_code, description, upvotes, public) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [ip, name, ship_type, pve, build_code, description, 0, false], function(err, row) {
    if(err){
      res.status(400).send("bad request");
      return;
    }
    log.info(ip, " Build submitted ", name, ", ", this.lastID);
    res.status(200).json([this.lastID]);
  });
  // printDB();
});

app.post('/upvote_build', function(req, res) {
  let ip = requestIp.getClientIp(req);
  let build_id = parseInt(req.body[0]);
  let enabling_vote = Boolean(req.body[1]);
  if (!(typeof build_id == 'number' && typeof enabling_vote == 'boolean')){
    res.status(400).send("bad request");
    return;
  }

  build_db.get("SELECT * FROM ship_builds WHERE id=?", [build_id], function(err, row){
    if (!row){
      res.status(400).send("bad request: non existant build");
      return;
    }
    else {
      build_db.serialize(() => {

        // Add new voter if not existing.
        build_db.run(`
            INSERT INTO voters (ip, upvoted_ids) 
            SELECT ?, ?
            WHERE NOT EXISTS(SELECT 1 FROM voters WHERE ip=?);`, [ip, JSON.stringify([]), ip]);
    
        // Check current vote status
        build_db.get("SELECT * FROM voters WHERE ip=?", [ip], (err, row) => {
          let vote_change = 0;
          let votes = JSON.parse(row.upvoted_ids);
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
    
          // Update votes
          build_db.serialize(() => {
            log.info(ip, " Voted. Updating vote id:", build_id, ",", vote_change, ". Votes: ", JSON.stringify(votes));
            build_db.run("UPDATE voters SET upvoted_ids=? WHERE ip=?", [JSON.stringify(votes), ip]);
            build_db.run("UPDATE ship_builds SET upvotes=upvotes+? WHERE id=?", [vote_change, build_id]);

            
          })
        });

        res.status(200).json({id: build_id, voted: enabling_vote});
    
      });
    
    }
      
  });

});

app.post('/remove_build', function(req, res) {
  
  let ip = requestIp.getClientIp(req);
  let build_id = parseInt(req.body[0]);
  if (build_id == NaN){
    res.status(400).send("bad request");
    return;
  }

  log.info(ip, " Removing build ", build_id);

  build_db.serialize(function() {
    build_db.run("INSERT INTO ship_builds_removals SELECT CURRENT_TIMESTAMP, * FROM ship_builds WHERE id=? AND submitter_ip=?;", [build_id, ip]);
    build_db.run("DELETE FROM ship_builds WHERE id=? AND submitter_ip=?;", [build_id, ip], () => {
      res.status(200).send("build removed");
    });
  });
});

app.post('/publicice_build', function(req, res) {
  
  let ip = requestIp.getClientIp(req);
  let build_id = parseInt(req.body[0]);
  let make_public = Boolean(req.body[1]);
  log.info(ip, " Publicicing build ", build_id, " ", String(make_public));
  
  build_db.run("UPDATE ship_builds SET public=? WHERE id=? AND submitter_ip=?", [make_public, build_id, ip], (err) => {
    if (!err) res.status(200).json([make_public, build_id]);
  });
})


app.listen(port, () => log.info(`Server started. Listening on ${port}!`))
