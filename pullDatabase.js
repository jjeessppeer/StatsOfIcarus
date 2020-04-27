const sqlite = require('better-sqlite3');
const data_db = new sqlite('databases/data_db.db', { verbose: null });

//var docsapi = require('./public/docsapi.js');

var docsapi = require('./docsapi.js');

const sheet_id = "1Oo1-3ad5_8srmHnc_sUpxgF11kxsapyGs8ogd5cR46g";

var datasets = [];


dropTables();
initTables();

console.log("Downloading datasets...");
//docsapi.loadDatasetFromSheet(sheet_id, 2, (dataset) => {parseDataset(dataset, "Match_History")});
docsapi.loadDatasetFromSheet(sheet_id, 4, (dataset) => {parseDataset(dataset, "Gun_stats")});
docsapi.loadDatasetFromSheet(sheet_id, 5, (dataset) => {parseDataset(dataset, "Ammo_stats")});
docsapi.loadDatasetFromSheet(sheet_id, 6, (dataset) => {parseDataset(dataset, "Damage_types")});
docsapi.loadDatasetFromSheet(sheet_id, 7, (dataset) => {parseDataset(dataset, "Tool_stats")});
docsapi.loadDatasetFromSheet(sheet_id, 8, (dataset) => {parseDataset(dataset, "Component_stats")});
docsapi.loadDatasetFromSheet(sheet_id, 9, (dataset) => {parseDataset(dataset, "Ship_Stats")});
docsapi.loadDatasetFromSheet(sheet_id, 10, (dataset) => {parseDataset(dataset, "Map_data")});
docsapi.loadDatasetFromSheet(sheet_id, 11, (dataset) => {parseDataset(dataset, "Crosshair_data")});
docsapi.loadDatasetFromSheet(sheet_id, 12, (dataset) => {parseDataset(dataset, "Ships_gun_angles")});

function parseDataset(dataset, table_name){
  let cmd = "INSERT INTO " + table_name + " VALUES (";
  for (let i=0; i < dataset.titles.length; i++){
    cmd += "?";
    if (i != dataset.titles.length-1) cmd+=",";
  }
  cmd += ")";

  for (let i=0; i < dataset.content.length; i++){
    data_db.prepare(cmd).run(dataset.content[i]);

  } 
}

function dropTables(){
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

function initTables(){
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
    "Timestamp"	TEXT,
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
    "T2S2Pilot"	TEXT
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
    "Slot6"	TEXT
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


// Clear database

/*
data_db.prepare('DROP TABLE Ammo_stats');
data_db.prepare('DROP TABLE Component_stats');
data_db.prepare('DROP TABLE Damage_types');
data_db.prepare('DROP TABLE Gun_stats');
data_db.prepare('DROP TABLE Map_data');
data_db.prepare('DROP TABLE Match_History');
data_db.prepare('DROP TABLE Ship_Stats');
data_db.prepare('DROP TABLE Ships_gun_angles');
data_db.prepare('DROP TABLE Tool_stats');

// Recreate tables
*/



