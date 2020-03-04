// var path = require('path');
var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
var crypto = require('crypto');

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
// - logs!
// - sorting by total votes, fun_votes or comp_votes

const build_db = new sqlite('databases/build_db.db', { fileMustExist: true });
const user_db = new sqlite('databases/user_db.db', { fileMustExist: true });
const data_db = new sqlite('databases/data_db.db', { fileMustExist: true, readonly: true });

var app = express()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));


var vote_types = {0: "comp_votes", 1: "fun_votes"};
var allowed_vote_types = [0, 1];


app.post('/check_in', function(req, res){
  let ip = requestIp.getClientIp(req);
  let req_token = req.body[0];
  let user_token = getUserToken(req_token, ip);
  let ip_token = getUserToken("", ip);

  log.info(ip, " ", user_token, " check_in");

  userCheckIn(user_token, ip);

  if (user_token != req_token){
    res.status(200).send("0");
    return;
  }

  let user = user_db.prepare("SELECT display_name FROM users WHERE token=?").get(user_token);
  let ip_user = user_db.prepare("SELECT display_name FROM users WHERE token=?").get(ip_token);
  res.status(200).json([user_token, user.display_name, ip_user.display_name]);
});

app.post('/register', function(req, res){
  let ip = requestIp.getClientIp(req);
  let ip_token = getUserToken("", ip);
  let username = req.body[0];
  let password = req.body[1];
  
  log.info(ip, " ", ip_token, " register: ", username);

  // Validate data.
  let usernameValid = testUsername(username);
  if (!usernameValid[0]){
    res.status(400).send(usernameValid[1]);
    return;
  }
  let passwordValid = testPassword(password);
  if (!passwordValid[0]){
    res.status(400).send(passwordValid[1]);
    return;
  }

  let salt = makeID(8);
  let hashedPwd = hashString(password, salt);
  let new_token = generateToken();

  // Create account details
  user_db.prepare("INSERT INTO accounts (username, password, salt, token) VALUES (?,?,?,?)").run(username, hashedPwd, salt, new_token);
  user_db.prepare("INSERT INTO users (token, username, display_name, ips, registered) VALUES (?,?,?,?,1)").run(new_token, username, username, JSON.stringify([ip]));

  // Merge ip account
  // mergeUser(new_token, ip_token);
 
  // Return login token
  let ip_username = user_db.prepare("SELECT display_name FROM users WHERE token=?").get(ip_token).display_name;
  res.status(200).json([new_token, username, ip_username]);
});

app.post('/merge', function(req, res){
  let ip = requestIp.getClientIp(req);
  let user_token = req.body[0];
  let ip_token = getUserToken("", ip);

  
  log.info(ip, " ", ip_token, " merge: ", user_token, ", ", ip_token);

  if (!isUser(user_token)){
    log.error("Invalid user token.");
    res.status("400").send("Server error.");
    return;
  }

  mergeUser(user_token, ip_token);
  res.status("200").send("Accounts merged!");
});

app.post('/login', function(req, res){
  let ip = requestIp.getClientIp(req);
  let ip_token = getUserToken("", ip);
  let username = req.body[0];
  let password = req.body[1];

  
  log.info(ip, " ", ip_token, " login: ", username);

  if (!(typeof username == 'string' && typeof password == 'string')){
    res.status(400).send("bad request");
    return;
  }

  let tries = user_db.prepare("SELECT * FROM login_tries WHERE datetime(timestamp)>datetime('now', '-10 minute') AND successful=0 AND ip=?").all(ip);
  if (tries.length > 10) { // Too many failed tries
    log.error(ip, " Many failed tries.");
    res.status("200").send("-1");
    return;
  }

  let account = user_db.prepare("SELECT * FROM accounts WHERE username=?").get(username);
  if (!account){ // Account does not exist
    user_db.prepare("INSERT INTO login_tries (ip, username, successful) VALUES (?,?,?)").run(ip, username, 0);
    res.status("200").send("-2");
    return;
  }
  
  let hashedPwd = hashString(password, account.salt);

  if (account.password != hashedPwd){ // Wrong password
    user_db.prepare("INSERT INTO login_tries (ip, username, successful) VALUES (?,?,?)").run(ip, username, 0);
    res.status("200").send("-2");
    return;
  }

  // Login OK, send account token.
  let user = user_db.prepare("SELECT * FROM users WHERE token=?").get(account.token);
  let ip_user = user_db.prepare("SELECT * FROM users WHERE token=?").get(ip_token);
  userCheckIn(user.token, ip);
  res.status(200).json([user.token, user.display_name, ip_user.display_name]);
});

app.post('/change_profile', function(req, res){
  let ip = requestIp.getClientIp(req);
  let user_token = req.body[0];
  let action = req.body[1];
  let data = req.body[2];
  log.info(ip, " ", user_token, " change_profile: ", action, ", ", data);
  if (!isAccount(user_token)){
    log.error("Invalid user token supplied.");
    res.status("400").send("Server error");
    return;
  }

  // Test if request is valid
  let valid;
  if (action == "set_username") valid = testUsername(data, user_token);
  else if (action == "set_password") valid = testPassword(data);
  else if (action == "set_name") valid = testName(data, user_token);
  else valid = [false, "Invalid request."];
  if (!valid[0]){
    res.status("400").send(valid[1]);
    return;
  }

  // Execute request
  if (action == "set_username"){
    user_db.prepare("UPDATE accounts SET username=? WHERE token=?").run(data, user_token);
    user_db.prepare("UPDATE users SET username=? WHERE token=?").run(data, user_token);
    res.status("200").send("Username updated!");
    return;
  }
  else if (action == "set_password"){
    let salt = makeID(4);
    let hashedPwd = hashString(data, salt);
    user_db.prepare("UPDATE accounts SET password=?, salt=? WHERE token=?").run(hashedPwd, salt, user_token);
    res.status("200").send("Password updated!");
    return;
  }
  else if (action == "set_name"){
    user_db.prepare("UPDATE users SET display_name=? WHERE token=?").run(data, user_token);
    res.status("200").send("Display name updated!");
    return;
  }


});

app.get('/get_datasets', function(req, res) {
  let ip = requestIp.getClientIp(req);
  let ip_token = getUserToken("", ip);
  log.info(ip, " ", ip_token, " get_datasets \t Datasets requested.");
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

app.post('/request_build', function(req, res, next) {
  let ip = requestIp.getClientIp(req);
  let user_token = getUserToken(req.body[0], ip);
  let start = req.body[1];
  let end = req.body[2];
  let name_filter = req.body[3];
  let ship_filter = req.body[4];
  let pve_filter = req.body[5];
  let submitter_filter = req.body[6];
  let sorting = req.body[7];
  log.info(ip, " ", user_token, " request_build \t Builds [", start, ",", start+8, "]");
  if (!(typeof start == 'number' && typeof end == 'number' && typeof name_filter == 'string' &&
      typeof ship_filter == 'string' && typeof pve_filter == 'string' && typeof submitter_filter == 'string'
      && typeof sorting == 'string') || start<1){
    res.status(400).send("bad request");
    return;
  }
  let params = ['%'+name_filter+'%', user_token];
  let sql = `
      SELECT * FROM ship_builds 
      WHERE 
      name LIKE ?
      AND (public=true OR submitter_token=?)`;
  if (ship_filter != 'Any'){
    sql += " AND INSTR(ship_type, ?)>0";
    params.push(ship_filter);
  }
  if (pve_filter != 'Include'){
    sql += " AND pve=?";
    params.push(pve_filter!="Exclude" ? 1 : 0);
  }
  if (submitter_filter.toLocaleLowerCase() == "me"){
    sql += " AND submitter_token=?";
    params.push(user_token);
  }
  else if (submitter_filter != ""){
    let possible_users = user_db.prepare("SELECT token FROM users WHERE display_name LIKE ?").all('%'+submitter_filter+'%');
    if (possible_users.length == 0){
      res.status(200).json([[], 0]);
      return;
    }
    if (possible_users.length > 0) sql += " AND (";
    for (let i=0; i<possible_users.length; i++){
      sql += "submitter_token=?";
      if (i != possible_users.length-1) sql += " OR ";
      params.push(possible_users[i].token);
    }
    if (possible_users.length > 0) sql += ")";
  }
  if (sorting == "Total votes") 
    sql += " ORDER BY (comp_votes+fun_votes) DESC";
  else if (sorting == "Comp votes")
    sql += " ORDER BY comp_votes DESC, fun_votes DESC";
  else if (sorting == "Fun votes")
    sql += " ORDER BY fun_votes DESC, comp_votes DESC";
  else if (sorting == "Date (old)")
    sql += " ORDER BY submission_time ASC";
  else if (sorting == "Date (new)")
    sql += " ORDER BY submission_time DESC";
  else if (sorting == "Alphabetical")
    sql += " ORDER BY name COLLATE NOCASE ASC";
  else
    sql += " ORDER BY (comp_votes+fun_votes) DESC";
  params.push(start-1);
  sql += " LIMIT ?, 8";


  let voter = user_db.prepare("SELECT upvoted_ids FROM users WHERE token=? LIMIT 1").get(user_token);
  let votes = JSON.parse(voter.upvoted_ids);
  if (!votes[0]) votes[0] = [];
  if (!votes[1]) votes[1] = [];

  let builds = build_db.prepare(sql).all(...params);
  let responseData = [];
  for (let i=0; i<builds.length; i++){
    let submitter_name = user_db.prepare("SELECT display_name FROM users WHERE token=?").get(builds[i].submitter_token).display_name;
    responseData.push({
      build_id: builds[i].id,
      build_code: builds[i].build_code,
      upvotes: [builds[i].comp_votes, builds[i].fun_votes],
      description: builds[i].description,
      voted: [votes[0].includes(builds[i].id), votes[1].includes(builds[i].id)],
      mine: user_token == builds[i].submitter_token,
      public: Boolean(builds[i].public),
      uploader: submitter_name
    });
  }

  let n_builds = build_db.prepare("SELECT COUNT(*) as rowCount FROM ship_builds;").get().rowCount;

  res.status(200).json([responseData, n_builds]);
});

app.post('/request_single_build', function(req, res) {
  let ip = requestIp.getClientIp(req);
  let user_token = getUserToken(req.body[0], ip);
  let build_id = req.body[1];
  log.info(ip, " ", user_token, " request_single_build \t id:", build_id);
  let build = build_db.prepare("SELECT * FROM ship_builds WHERE id=? AND (submitter_token=? OR public=true)").get(build_id, user_token);
  if (!build){
    res.status(400).send("bad request");
    return;
  }
  res.status(200).json([build.build_code, build.description]);
});

app.post('/submit_build', function(req, res, next) {
  let ip = requestIp.getClientIp(req);
  let user_token = getUserToken(req.body[0], ip);
  let build_code = req.body[1];
  let description = req.body[2];
  if (typeof build_code != 'string' || typeof description != 'string'){
    res.status(400).send("bad request");
    return;
  }
  description = sanitizeHtml(description);

  let build_data = buildParser.parseBuildCode(build_code);
  if (!build_data || build_data.name.length == 0){
    res.status(400).send("bad request");
    return;
  }

  let name = build_data.name;
  let ship_type = build_data.ship;
  let pve = build_data.pve ? 1 : 0;

  let lastID = build_db.prepare(`INSERT INTO ship_builds 
    (submitter_token, name, ship_type, pve, build_code, description) 
    VALUES (?, ?, ?, ?, ?, ?)`).run(user_token, name, ship_type, pve, build_code, description).lastInsertRowid;
  
  let user_builds = user_db.prepare("SELECT submitted_builds FROM users WHERE token=?").get(user_token).submitted_builds;
  user_builds = JSON.parse(user_builds);
  user_builds.push(lastID);
  user_db.prepare("UPDATE users SET submitted_builds=? WHERE token=?").run(JSON.stringify(user_builds), user_token);

  
  log.info(ip, " ", user_token, " submit_build \t ", lastID, ", ", name, ", ", build_code);
  res.status(200).json([lastID]);
});

app.post('/upvote_build', function(req, res) {
  let ip = requestIp.getClientIp(req);
  let user_token = getUserToken(req.body[0], ip);
  let build_id = parseInt(req.body[1]);
  let enabling_vote = Boolean(req.body[2]);
  let vote_type = parseInt(req.body[3]);

  if (typeof build_id != 'number' || typeof enabling_vote != 'boolean' || !allowed_vote_types.includes(vote_type)){
    res.status(400).send("bad request");
    return;
  }

  let build_exist = build_db.prepare("SELECT * FROM ship_builds WHERE id=?").get(build_id);
  if(!build_exist){
    res.status(400).send("bad request: non existant build");
    return;
  }
  let votes = user_db.prepare("SELECT upvoted_ids FROM users WHERE token=? LIMIT 1").get(user_token).upvoted_ids;
  votes = JSON.parse(votes);

  if (!votes[vote_type]) votes[vote_type] = [];

  let vote_change = 0;
  let has_voted = votes[vote_type].includes(build_id);
  if (!has_voted && enabling_vote){
    votes[vote_type].push(build_id);
    vote_change = 1;
  }
  else if (has_voted && !enabling_vote){
    let index = votes[vote_type].indexOf(build_id);
    if (index > -1) votes[vote_type].splice(index, 1);
    vote_change = -1;
  }

  
  user_db.prepare("UPDATE users SET upvoted_ids=? WHERE token=?").run(JSON.stringify(votes), user_token);
  build_db.prepare("UPDATE ship_builds SET "+vote_types[vote_type]+"="+vote_types[vote_type]+"+? WHERE id=?").run(vote_change, build_id);
  
  log.info(ip, " ", user_token, " upvote_build \t id:", build_id, " change:"+vote_change, " votes: ", JSON.stringify(votes));
  res.status(200).send("Voted");

});

app.post('/remove_build', function(req, res) {
  let ip = requestIp.getClientIp(req);
  let user_token = getUserToken(req.body[0], ip);
  let build_id = parseInt(req.body[1]);
  if (build_id == NaN){
    res.status(400).send("bad request");
    return;
  }
  log.info(ip, " ", user_token, " remove_build \t id:", build_id);
  build_db.prepare("INSERT INTO ship_builds_removals SELECT CURRENT_TIMESTAMP, * FROM ship_builds WHERE id=? AND submitter_token=?;").run(build_id, user_token);
  build_db.prepare("DELETE FROM ship_builds WHERE id=? AND submitter_token=?;").run(build_id, user_token);
  res.status(200).send("build removed");
});

app.post('/publicice_build', function(req, res) {
  let ip = requestIp.getClientIp(req);
  let user_token = getUserToken(req.body[0], ip);
  let build_id = parseInt(req.body[1]);
  let make_public = Boolean(req.body[2]) ? 1 : 0;
  log.info(ip, " ", user_token, " publicice_build \t id:", build_id, " public:", make_public);
  build_db.prepare("UPDATE ship_builds SET public=? WHERE id=? AND submitter_token=?").run(make_public, build_id, user_token);
  res.status(200).json([make_public, build_id]);
});


function generateToken(){
  return makeID(32);
}


function hashString(str, salt){
  str = salt + str + salt;
  let hashed = crypto.createHash('sha256').update(str).digest('hex');
  return hashed;
}

function isAccount(token){
  let user = user_db.prepare("SELECT token FROM accounts WHERE token=?").get(token);
  if (user) return true;
  return false;
}

function getUserToken(req_token, ip){
  // Try to get user from token
  let user = user_db.prepare("SELECT token FROM users WHERE token=?").get(req_token);
  if (user) return user.token;
  
  // Invalid token test ip
  let ip_acc = user_db.prepare("SELECT token FROM ip_accounts WHERE ip=?").get(ip);
  if (ip_acc) return ip_acc.token;

  // No ip account, create one.
  let token = generateToken();
  let name = makeID(8);
  user_db.prepare("INSERT INTO ip_accounts (ip, token) VALUES (?,?)").run(ip, token);
  user_db.prepare("INSERT INTO users (token, username, display_name, ips) VALUES (?,?,?,?)").run(token, name, name, JSON.stringify([ip]));
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

function testPassword(str){
  if (typeof str != 'string') return [false, "Invalid data."];
  if (str.length > 128) return [false, "Password must be less than 128 characters."];
  if (str.length <= 0) return [false, "Password cannot be empty."];
  return [true, "OK"];
}

function testUsername(str, token=""){
  if (typeof str != 'string') return [false, "Invalid data."];
  if (str.toLowerCase() == 'me') return [false, "Username already in use."];
  if (str.length > 24) return [false, "Username must be less than 32 characters."];
  if (str.length <= 0) return [false, "Username cannot be empty."];
  if (testSpecialString(str)) return [false, "Username cannot contain special characters."];
  let account = user_db.prepare("SELECT username FROM accounts WHERE username=? AND token!=?").get(str, token);
  let user = user_db.prepare("SELECT display_name FROM users WHERE display_name=? AND token!=?").get(str, token);
  if (account || user) return [false, "Username already exists."];
  return [true, "OK"];
}

function testName(str, token=""){
  if (typeof str != 'string') return [false, "Invalid data."];
  if (str.toLowerCase() == 'me') return [false, "Display name already in use."];
  if (str.length > 24) return [false, "Display name must be less than 32 characters."];
  if (str.length <= 0) return [false, "Display name cannot be empty."];
  if (testSpecialString(str)) return [false, "Display name cannot contain special characters."];
  let account = user_db.prepare("SELECT username FROM accounts WHERE username=? AND token!=?").get(str, token);
  let user = user_db.prepare("SELECT display_name FROM users WHERE display_name=? AND token!=?").get(str, token);
  if (account || user) return [false, "Display name already exists."];
  return [true, "OK"];
}

function testSpecialString(str){
  return /[^a-zA-Z0-9\.\!\?\_\-]/g.test(str); //Allow no weird characters
}

function sanitizeHtml(str){
  str = String(str);
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function userCheckIn(user_token, ip){
  let user = user_db.prepare("SELECT * FROM users WHERE token=?").get(user_token);
  let ips = JSON.parse(user.ips);
  if (ips.indexOf(ip) === -1) ips.push(ip);
  user_db.prepare("UPDATE users SET last_visit=CURRENT_TIMESTAMP, n_visits=n_visits+1, ips=? WHERE token=?").run(JSON.stringify(ips), user_token);
}

function mergeUser(token_1, token_2){
  // Change build owners
  let builds_1 = user_db.prepare("SELECT submitted_builds FROM users WHERE token=?").get(token_1).submitted_builds;
  let builds_2 = user_db.prepare("SELECT submitted_builds FROM users WHERE token=?").get(token_2).submitted_builds;
  builds_1 = JSON.parse(builds_1);
  builds_2 = JSON.parse(builds_2);
  builds_1.concat(builds_2);
  user_db.prepare("UPDATE users SET submitted_builds=? WHERE token=?").run(JSON.stringify(builds_1), token_1);
  build_db.prepare("UPDATE ship_builds SET submitter_token=? WHERE submitter_token=?").run(token_1, token_2);

  // Merge votes
  let user_1_votes = user_db.prepare("SELECT upvoted_ids FROM users WHERE token=?").get(token_1).upvoted_ids;
  let user_2_votes = user_db.prepare("SELECT upvoted_ids FROM users WHERE token=?").get(token_2).upvoted_ids;
  user_1_votes = JSON.parse(user_1_votes);
  user_2_votes = JSON.parse(user_2_votes);
  let new_votes = {};
  for (let [key, value] of Object.entries(vote_types)) {
    if (!user_1_votes[key]) user_1_votes[key] = [];
    if (!user_2_votes[key]) user_2_votes[key] = [];
    let duplicates = user_1_votes[key].filter(elem => user_2_votes[key].includes(elem));
    let merged = user_1_votes[key].filter(elem => !user_2_votes[key].includes(elem)).concat(user_2_votes[key]);

    // Remove duplicate votes.
    for (let i of duplicates){
      build_db.prepare("UPDATE ship_builds SET "+value+"="+value+"-1 WHERE id=?").run(i);
    }
    new_votes[key] = merged;
  }
  user_db.prepare("UPDATE users SET upvoted_ids=? WHERE token=?").run(JSON.stringify(new_votes), token_1);

  // Remove user 2.
  user_db.prepare("DELETE FROM users WHERE token=?").run(token_2);
  user_db.prepare("DELETE FROM ip_accounts WHERE token=?").run(token_2);
}

function isUser(token){
  let user = user_db.prepare("SELECT username FROM accounts WHERE token=?").get(token);
  if (user) return true;
  return false;
}


var httpServer = http.createServer(app);
httpServer.listen(80);

var privateKey  = fs.readFileSync('certs/privkey.pem', 'utf8');
var certificate = fs.readFileSync('certs/cert.pem', 'utf8');
var ca = fs.readFileSync('certs/chain.pem');
var credentials = {key: privateKey, cert: certificate, ca: ca};
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(443);

