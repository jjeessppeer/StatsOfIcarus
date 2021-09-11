const sqlite = require('better-sqlite3');
const fetch = require('node-fetch');
// import fetch from 'node-fetch';
const fs = require('fs');

const data_db = new sqlite('databases/data_db.db', { fileMustExist: false, verbose: null });

try {
  dropTables();
}
catch {}
initTables();


let sheet_id = "2PACX-1vTh_U6oGy_T5BmFBv3v2cJQLSlJJP8Gh-j5ZcAbjv7lEZ9jL9xCQv6QTOq8FFSxFMRFk01HbH2nxG2u";
let page_ids = {
  "Ammo_stats": "652479063",
  "Component_stats": "175497288",
  "Damage_types": "103576516",
  "Gun_stats": "246504315",
  "Map_data": "1018891882",
  "Match_History": "1960867417",
  "Ship_Stats": "248332817",
  "Ships_gun_angles": "1351961681",
  "Tool_stats": "771619337",
  "Crosshair_data": "1037511204"
};


for (const [name, page_id] of Object.entries(page_ids)){
  loadTableFromSheet(sheet_id, page_id, name);
}

function loadTableFromSheet(sheet_id, page_id, name="-") {
  let href = `https://docs.google.com/spreadsheets/d/e/${sheet_id}/pub?gid=${page_id}&single=true&output=csv`;
  console.log(`Fetching ${name} ${page_id}...`);
  fetch(href)
    .then(response => {
      // console.log(response);
      return response.text();
    })
    .then(text => {
      // console.log(text);
      // console.log(csvToArrays(text));
      let data_array = csvToArrays(text);
      insertArrayToTable(data_array, name);

    })
    .catch(error => {
      throw error;
    });
}


function insertArrayToTable(data_array, table_name) {
  let titles = data_array.shift();
  let values = data_array;

  // let cmd = `INSERT INTO ${table_name} VALUES (${titles})`;
  let cmd = `INSERT INTO ${table_name} VALUES (`;
  for (let i=0; i < titles.length; i++){
    cmd += "?";
    if (i != titles.length-1) cmd+=",";
  }
  cmd += ")";

  // console.log(cmd)
  // console.log(titles.length)
  // console.log(titles);
  // console.log(values[0].length)
  // console.log(values[0]);


  // let cmd2 = `INSERT INTO ${table_name} VALUES ({titles})`;

  values.forEach(element => {
    // console.log(element);
    let a = data_db.prepare(cmd);
    a.run(element);
  });

}

function csvToArrays(csv_string) {
  let result = [];
  let width = -1;

  let lines = csv_string.split(/\r?\n/g);
  lines.forEach(line => {
    values = CSVtoArray(line);

    // values = line.split(',');
    // if (width = -1) width = values.length;
    // if (width != values.length) throw 'Invalid input data: \n\t' + csv_string;
    result.push(values);
  });

  return result;
}

// Return array of string values, or NULL if CSV string not well formed.
function CSVtoArray(text) {
  var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
  var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
  // Return NULL if input string is not well formed CSV string.
  if (!re_valid.test(text)) return null;
  var a = [];                     // Initialize array to receive values.
  text.replace(re_value, // "Walk" the string using replace with callback.
      function(m0, m1, m2, m3) {
          // Remove backslash from \' in single quoted values.
          if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
          // Remove backslash from \" in double quoted values.
          else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
          else if (m3 !== undefined) a.push(m3);
          return ''; // Return empty string.
      });
  // Handle special case of empty last value.
  if (/,\s*$/.test(text)) a.push('');
  return a;
};



function dropTables() {
  data_db.prepare("DROP TABLE Ammo_stats").run();
  data_db.prepare("DROP TABLE Component_stats").run();
  data_db.prepare("DROP TABLE Damage_types").run();
  data_db.prepare("DROP TABLE Gun_stats").run();
  data_db.prepare("DROP TABLE Map_data").run();
  data_db.prepare("DROP TABLE Match_History").run();
  data_db.prepare("DROP TABLE Ship_Stats").run();
  data_db.prepare("DROP TABLE Ships_gun_angles").run();
  data_db.prepare("DROP TABLE Tool_stats").run();
  data_db.prepare("DROP TABLE Crosshair_data").run();
  console.log("Tables cleared.")
}

function initTables() {
  data_db.prepare(`CREATE TABLE "Ammo_stats" (
      "Name"	TEXT,
      "Alias"	TEXT,
      "Rotationspeed"	INTEGER,
      "Jitter"	INTEGER,
      "Clipsize"	INTEGER,
      "AOEradius"	INTEGER,
      "AOEdamage"	INTEGER,
      "Damage"	INTEGER,
      "Armingtime"	INTEGER,
      "Rateoffire"	INTEGER,
      "Projectilespeed"	INTEGER,
      "Firemodifier"	INTEGER,
      "Firedamage"	INTEGER,
      "Lift"	INTEGER,
      "Directdamage"	INTEGER,
      "Range"	INTEGER,
      "Rotationalarcs"	INTEGER
    )`).run();
  data_db.prepare(`CREATE TABLE "Component_stats" (
      "Name"	TEXT,
      "HP"	INTEGER
    )`).run();
  data_db.prepare(`CREATE TABLE "Crosshair_data" (
      "Name"	TEXT,
      "Degperpixel"	INTEGER,
      "Starty"	INTEGER,
      "Startx"	INTEGER,
      "Endx"	INTEGER,
      "Image"	TEXT
    )`).run();
  data_db.prepare(`CREATE TABLE "Damage_types" (
      "Name"	TEXT,
      "Balloon"	INTEGER,
      "Hull"	INTEGER,
      "Armor"	INTEGER,
      "Components"	INTEGER
    )`).run();
  data_db.prepare(`CREATE TABLE "Gun_stats" (
      "Name"	TEXT,
      "Alias"	TEXT,
      "Mode"	TEXT,
      "Weaponslot"	TEXT,
      "Damagetypeprimary"	TEXT,
      "Damageprimary"	INTEGER,
      "Damagetypesecondary"	TEXT,
      "Damagesecondary"	INTEGER,
      "Rateoffire"	INTEGER,
      "Reloadtime"	INTEGER,
      "Magazinesize"	INTEGER,
      "Fireprimary"	INTEGER,
      "Firesecondary"	INTEGER,
      "Projectilespeed"	INTEGER,
      "Range"	INTEGER,
      "Shelldrop"	INTEGER,
      "AOEradius"	INTEGER,
      "Buckshot"	INTEGER,
      "Armingtime"	REAL,
      "Sideangle"	INTEGER,
      "Upangle"	INTEGER,
      "Downangle"	INTEGER
    )`).run();
  data_db.prepare(`CREATE TABLE "Map_data" (
      "ID" TEXT,
      "Name"	TEXT,
      "Mode"	TEXT,
      "Size"	TEXT,
      "MapImage"	TEXT,
      "SpawnImage"	TEXT,
      "MapScale"	TEXT
    )`).run();
  data_db.prepare(`CREATE TABLE "Match_history" (
      "Dateofmatch"	TEXT,
      "Event"	TEXT,
      "Teamscores[Team1score]"	INTEGER,
      "Teamscores[Team2score]"	INTEGER,
      "T1Ship1"	TEXT,
      "T1Ship2"	TEXT,
      "T2Ship1"	TEXT,
      "T2Ship2"	TEXT,
      "T1S1Pilot"	TEXT,
      "T1S2Pilot"	INTEGER,
      "T2S1Pilot"	TEXT,
      "T2S2Pilot"	TEXT,
      "Map" TEXT
    )`).run();
  data_db.prepare(`CREATE TABLE "Ship_Stats" (
      "ShipType"	TEXT,
      "Armor"	INTEGER,
      "ArmorRebuildValue"	INTEGER,
      "HullHealth"	INTEGER,
      "LightWeapons"	INTEGER,
      "HeavyWeapons"	INTEGER,
      "LongitudinalSpeed(m/s)"	INTEGER,
      "LongitudinalAcceleration(m/s²)"	INTEGER,
      "TurnSpeed(deg/s)"	INTEGER,
      "TurnAcceleration(deg/s²)"	INTEGER,
      "VerticalSpeed(m/s)"	INTEGER,
      "VerticalAcceleration(m/s²)"	INTEGER,
      "Mass(t)"	INTEGER
    )`).run();
  data_db.prepare(`CREATE TABLE "Ships_gun_angles" (
      "Ship"	TEXT,
      "Nguns"	INTEGER,
      "Angle1"	REAL,
      "Angle2"	INTEGER,
      "Angle3"	INTEGER,
      "Angle4"	TEXT,
      "Angle5"	TEXT,
      "Angle6"	TEXT,
      "Position1"	TEXT,
      "Position2"	TEXT,
      "Position3"	TEXT,
      "Position4"	TEXT,
      "Position5"	TEXT,
      "Position6"	TEXT,
      "Slot1"	TEXT,
      "Slot2"	TEXT,
      "Slot3"	TEXT,
      "Slot4"	TEXT,
      "Slot5"	TEXT,
      "Slot6"	TEXT,
      "HelmPosition" TEXT
    )`).run();
  data_db.prepare(`CREATE TABLE "Tool_stats" (
      "Name"	TEXT,
      "Repair"	INTEGER,
      "Rebuild"	INTEGER,
      "Extinguish"	INTEGER,
      "Fireimmunity"	INTEGER,
      "Cooldown"	INTEGER
    )`).run();
  console.log("Tables initialized.")
}
