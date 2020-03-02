// var path = require('path');
var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');

var bodyParser = require("body-parser");
var requestIp = require('request-ip');
const sqlite = require('better-sqlite3');
var buildParser = require('./buildParser.js');

const logOpts = {
  fileNamePattern:'log-<DATE>.log',
  logDirectory:'logs',
  timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS',
  dateFormat:'YYYY.MM.DD'
}
// const log = require('simple-node-logger').createRollingFileLogger(logOpts);
const log = require('simple-node-logger').createSimpleLogger(logOpts);

// TODO: 
// - prevent adding duplicates
// - limit entries by ip

const access_db = new sqlite('databases/access_db.db', { fileMustExist: true });
const build_db = new sqlite('databases/build_db.db', { fileMustExist: true });
const user_db = new sqlite('databases/user_db.db', { fileMustExist: true });
const data_db = new sqlite('databases/data_db.db', { fileMustExist: true, readonly: true });

var app = express()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/check_in', function(req, res){
  let ip = requestIp.getClientIp(req);
  let req_token = req.body[0];
  let user_token = getUserToken(req_token, ip);

  console.log(user_token, "\n", req_token, "\n");
  if (user_token != req_token){
    res.status(200).send("0");
    return;
  }

  let user = user_db.prepare("SELECT display_name FROM users WHERE token=?").get(user_token);
  res.status(200).json([user_token, user.display_name]);
});

app.post('/register', function(req, res){
  let ip = requestIp.getClientIp(req);
  let user_token = getUserToken("", ip);
  let username = req.body[0];
  let password = req.body[1];
  
  if (!(typeof username == 'string' && typeof password == 'string')){
    res.status(400).send("bad request");
    return;
  }

  if (testSpecialString(username)){
    res.status(200).send("-2");
    return;
  }

  let account = user_db.prepare("SELECT * FROM accounts WHERE username=?").get(username);
  if (account){ // Username exists
    res.status("200").send("-1");
    return;
  }

  // Create account details
  user_db.prepare("INSERT INTO accounts (username, password, token) VALUES (?,?,?)").run(username, password, user_token);
  user_db.prepare("UPDATE users SET display_name=?, registered=1 WHERE token=?").run(username, user_token);
  // Remove ip account
  user_db.prepare("DELETE FROM ip_accounts WHERE token=?").run(user_token);
 
  // Return login token
  let user = user_db.prepare("SELECT display_name FROM users WHERE token=?").get(user_token);
  res.status(200).json([user_token, user.display_name]);
});

app.post('/login', function(req, res){
  let ip = requestIp.getClientIp(req);
  let username = req.body[0];
  let password = req.body[1];

  if (!(typeof username == 'string' && typeof password == 'string')){
    res.status(400).send("bad request");
    return;
  }

  let tries = user_db.prepare("SELECT * FROM login_tries WHERE datetime(timestamp)>datetime('now', '-10 second') AND successful=0 AND ip=?").all(ip);
  if (tries.length > 10) { // Too many failed tries
    res.status("200").send("-1");
    return;
  }

  let account = user_db.prepare("SELECT * FROM accounts WHERE username=?").get(username);
  if (!account){ // Account does not exist
    user_db.prepare("INSERT INTO login_tries (ip, username, successful) VALUES (?,?,?)").run(ip, username, 0);
    res.status("200").send("-2");
    return;
  }

  if (account.password != password){ // Wrong password
    user_db.prepare("INSERT INTO login_tries (ip, username, successful) VALUES (?,?,?)").run(ip, username, 0);
    res.status("200").send("-2");
    return;
  }

  // Login OK, send account token.
  let user = user_db.prepare("SELECT * FROM users WHERE token=?").get(account.token);
  res.status(200).json([user.token, user.display_name]);
});



app.get('/get_datasets', function(req, res) {
  let ip = requestIp.getClientIp(req);
  log.info(ip, " get_datasets \t Datasets requested.");
  let datasets = {};
  //datasets.history = data_db.prepare("SELECT * FROM Match_History").all();
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



// app.post('/request_build', function(req, res, next) {
//   let ip = requestIp.getClientIp(req);
//   let user_token = getUserToken(req[0]);
//   let start = req.body[1];
//   let end = req.body[2];
//   let name_filter = req.body[3];
//   let ship_filter = req.body[4];
//   let pve_filter = req.body[5];
//   let submitter_filter = req.body[6];
//   let sorting = req.body[7];
//   log.info(ip, " request_build \t Builds [", start, ",", start+8, "]");
//   if (!(typeof start == 'number' && typeof end == 'number' && typeof name_filter == 'string' &&
//       typeof ship_filter == 'string' && typeof pve_filter == 'string' && typeof submitter_filter == 'string'
//       && typeof sorting == 'string') || start<1){
//     res.status(400).send("bad request");
//     return;
//   }
  
//   let params = ['%'+name_filter+'%', username];
//   let sql = `
//       SELECT * FROM ship_builds 
//       WHERE 
//       name LIKE ?
//       AND (public=true OR submitter_username=?)`;
//   if (ship_filter != 'Any'){
//     sql += " AND INSTR(ship_type, ?)>0";
//     params.push(ship_filter);
//   }
//   if (pve_filter != 'Include'){
//     sql += " AND pve=?";
//     params.push(pve_filter!="Exclude" ? 1 : 0);
//   }
//   if (submitter_filter != "Anyone"){
//     sql += " AND submitter_username " + (submitter_filter=="Me" ? "=" : "!=") + " ?";
//     params.push(username);
//   }
//   if (sorting == "Votes (Asc.)") 
//     sql += " ORDER BY upvotes ASC";
//   else if (sorting == "Date (new)")
//     sql += " ORDER BY submission_time DESC";
//   else if (sorting == "Date (old)")
//     sql += " ORDER BY submission_time ASC";
//   else if (sorting == "Alphabetical")
//     sql += " ORDER BY name COLLATE NOCASE ASC";
     
//   else
//     sql += " ORDER BY upvotes DESC";

//   params.push(start-1);
//   sql += " LIMIT ?, 8";

//   let builds = build_db.prepare(sql).all(...params);
//   let responseData = [];
//   for (let i=0; i<builds.length; i++){
//     responseData.push({
//       build_id: builds[i].id,
//       build_code: builds[i].build_code,
//       upvotes: builds[i].upvotes,
//       description: builds[i].description,
//       voted: false,
//       mine: username == builds[i].submitter_username,
//       public: Boolean(builds[i].public)
//     });
//   }
  
//   let voter = user_db.prepare("SELECT upvoted_ids FROM users WHERE username=? LIMIT 1").get(username);
//   if (voter){
//     let votes = JSON.parse(voter.upvoted_ids);
//     for (let i=0; i<responseData.length; i++){
//       responseData[i].voted = votes.indexOf(responseData[i].build_id) != -1;
//     }
//   }

//   let n_builds = build_db.prepare("SELECT COUNT(*) as rowCount FROM ship_builds;").get().rowCount;

//   res.status(200).json([responseData, n_builds]);
// });



// app.post('/request_single_build', function(req, res) {
//   let ip = requestIp.getClientIp(req);
//   let build_id = req.body[0];
//   let username = getUsername(ip)
//   log.info(ip, " request_single_build \t id:", build_id);
//   let build = build_db.prepare("SELECT * FROM ship_builds WHERE id=? AND (submitter_username=? OR public=true)").get(build_id, username);
//   if (!build){
//     res.status(400).send("bad request");
//     return;
//   }
//   res.status(200).json([build.build_code, build.description]);
// });

// app.post('/submit_build', function(req, res, next) {
//   let ip = requestIp.getClientIp(req);
//   let username = getUsername(ip);
//   let build_code = req.body[0];
//   let description = req.body[1];
//   if (!(typeof build_code == 'string'  && typeof description == 'string' )){
//     res.status(400).send("bad request");
//     return;
//   }
//   let build_data = buildParser.parseBuildCode(build_code);
//   if (!build_data || build_data.name.length == 0){
//     res.status(400).send("bad request");
//     return;
//   }

//   let name = build_data.name;
//   let ship_type = build_data.ship;
//   let pve = build_data.pve ? 1 : 0;

//   let lastID = build_db.prepare(`INSERT INTO ship_builds 
//     (submitter_username, name, ship_type, pve, build_code, description, upvotes, public) 
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(username, name, ship_type, pve, build_code, description, 0, 0).lastInsertRowid;
  
//   // Add build to user list
  
//   log.info(ip, " submit_build \t ", lastID, ", ", name, ", ", build_code);
//   res.status(200).json([lastID]);
// });

// app.post('/upvote_build', function(req, res) {
//   let ip = requestIp.getClientIp(req);
//   let build_id = parseInt(req.body[0]);
//   let username = getUsername(ip);

//   let enabling_vote = Boolean(req.body[1]);
//   if (!(typeof build_id == 'number' && typeof enabling_vote == 'boolean')){
//     res.status(400).send("bad request");
//     return;
//   }

//   let build_exist = build_db.prepare("SELECT * FROM ship_builds WHERE id=?").get(build_id);
//   if(!build_exist){
//     res.status(400).send("bad request: non existant build");
//     return;
//   }
//   let votes = user_db.prepare("SELECT upvoted_ids FROM users WHERE username=? LIMIT 1").get(username).upvoted_ids;
//   votes = JSON.parse(votes);
//   let vote_change = 0;
//   let has_voted = votes.includes(build_id);
//   if (!has_voted && enabling_vote){
//     votes.push(build_id);
//     vote_change = 1;
//   }
//   else if (has_voted && !enabling_vote){
//     let index = votes.indexOf(build_id);
//     if (index > -1) votes.splice(index, 1);
//     vote_change = -1;
//   }
  
//   user_db.prepare("UPDATE users SET upvoted_ids=? WHERE username=?").run(JSON.stringify(votes), username);
//   build_db.prepare("UPDATE ship_builds SET upvotes=upvotes+? WHERE id=?").run(vote_change, build_id);
  
//   log.info(ip, " upvote_build \t id:", build_id, " change:"+vote_change, " votes: ", JSON.stringify(votes));
//   res.status(200).json({id: build_id, voted: enabling_vote});

// });

// app.post('/remove_build', function(req, res) {
//   let ip = requestIp.getClientIp(req);
//   let username = getUsername(ip)
//   let build_id = parseInt(req.body[0]);
//   if (build_id == NaN){
//     res.status(400).send("bad request");
//     return;
//   }
//   log.info(ip, " remove_build \t id:", build_id);
//   build_db.prepare("INSERT INTO ship_builds_removals SELECT CURRENT_TIMESTAMP, * FROM ship_builds WHERE id=? AND submitter_username=?;").run(build_id, username);
//   build_db.prepare("DELETE FROM ship_builds WHERE id=? AND submitter_username=?;").run(build_id, username);
//   res.status(200).send("build removed");
// });

// app.post('/publicice_build', function(req, res) {
//   let ip = requestIp.getClientIp(req);
//   let username = getUsername(ip)
//   let build_id = parseInt(req.body[0]);
//   let make_public = Boolean(req.body[1]) ? 1 : 0;
//   log.info(ip, " publicice_build \t id:", build_id, " public:", make_public);
//   build_db.prepare("UPDATE ship_builds SET public=? WHERE id=? AND submitter_username=?").run(make_public, build_id, username);
//   res.status(200).json([make_public, build_id]);
// });



function generateToken(){
  return makeID(32);
}


function getUserToken(req_token, ip){
  let user = user_db.prepare("SELECT token FROM users WHERE token=?").get(req_token);
  if (user) return user.token;

  // Invalid token test ip
  let ip_acc = user_db.prepare("SELECT token FROM ip_accounts WHERE ip=?").get(ip);
  if (ip_acc) return ip_acc.token;

  // No ip account, create one.
  let token = generateToken();
  let name = makeID(10);
  user_db.prepare("INSERT INTO ip_accounts (ip, token) VALUES (?,?)").run(ip, token);
  user_db.prepare("INSERT INTO users (token, username, display_name, ips) VALUES (?,?,?,?)").run(token, name, name, "["+ip+"]");
  return token;
}


function makeID(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  // Check if exists

  return result;
}


function testSpecialString(str){
  return /[^a-zA-Z0-9\.\!\?\_\-]/g.test(str); //Allow no weird characters
}


var httpServer = http.createServer(app);
httpServer.listen(80);

var privateKey  = fs.readFileSync('certs/privkey.pem', 'utf8');
var certificate = fs.readFileSync('certs/cert.pem', 'utf8');
var ca = fs.readFileSync('certs/chain.pem');
var credentials = {key: privateKey, cert: certificate, ca: ca};
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(443);

