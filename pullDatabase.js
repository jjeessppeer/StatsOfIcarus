const sqlite = require('better-sqlite3');
const data_db = new sqlite('databases/data_db.db', { verbose: null });

//var docsapi = require('./public/docsapi.js');

var docsapi = require('./docsapi.js');

const sheet_id = "1Oo1-3ad5_8srmHnc_sUpxgF11kxsapyGs8ogd5cR46g";


var datasets = [];


data_db.prepare('DELETE FROM Ammo_stats;').run();
data_db.prepare('DELETE FROM Component_stats;').run();
data_db.prepare('DELETE FROM Damage_types;').run();
data_db.prepare('DELETE FROM Gun_stats;').run();
data_db.prepare('DELETE FROM Map_data;').run();
data_db.prepare('DELETE FROM Match_History;').run();
data_db.prepare('DELETE FROM Ship_Stats;').run();
data_db.prepare('DELETE FROM Ships_gun_angles;').run();
data_db.prepare('DELETE FROM Tool_stats;').run();
data_db.prepare('DELETE FROM Crosshair_data;').run();


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



