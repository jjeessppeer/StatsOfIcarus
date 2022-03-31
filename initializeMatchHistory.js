const sqlite = require('better-sqlite3');
const fs = require('fs');

const path = './file.txt'

try {
  fs.unlinkSync('databases/match_history.db')
} catch(err) {
  console.error(err)
}
const historyDb = new sqlite('databases/match_history.db', { fileMustExist: false, verbose: null });

historyDb.prepare(`CREATE TABLE "Matches" (
    "MatchIndex" INTEGER PRIMARY KEY,
    "MatchId" TEXT UNIQUE,

    "MapId"	INTEGER,
    "TeamSize" INTEGER,
    "TeamCount" INTEGER,

    "Scores" TEXT,
    "Winner" INTEGER,
    "MatchTime" INTEGER,
    "MatchDate" TEXT

    "Ships" TEXT,
    "ShipNames" TEXT,
    "Players" TEXT,
    "PlayerLoadouts" TEXT
)`).run();

historyDb.prepare(`CREATE TABLE "ShipMatches" (
    "MatchIndex" INTEGER,
    "BuildIndex" INTEGER,
    "Position"
)`).run();

historyDb.prepare(`CREATE TABLE "PlayerMatches" (
    "MatchIndex" INTEGER,
    "PlayerIndex" INTEGER,
    "LoadoutIndex" INTEGER,
    "ShipPosition" INTEGER,
    "Position" INTEGER
)`).run();

historyDb.prepare(`CREATE TABLE "ShipLoadouts" (
    "ShipLoadoutIndex" INTEGER PRIMARY KEY,
    "ShipId" INTEGER,
    "Gun_1" INTEGER,
    "Gun_2" INTEGER,
    "Gun_3" INTEGER,
    "Gun_4" INTEGER,
    "Gun_5" INTEGER,
    "Gun_6" INTEGER
)`).run();

historyDb.prepare(`CREATE TABLE "PlayerLoadouts" (
    "PlayerLoadoutIndex" INTEGER PRIMARY KEY,
    "Role" INTEGER,
    "Equipment_1" INTEGER,
    "Equipment_2" INTEGER,
    "Equipment_3" INTEGER,
    "Equipment_4" INTEGER,
    "Equipment_5" INTEGER,
    "Equipment_6" INTEGER
)`).run();

historyDb.prepare(`CREATE TABLE "Players" (
    "PlayerIndex" INTEGER PRIMARY KEY,
    "PlayerID" INTEGER UNIQUE,
    "Clan" TEXT,
    "Name" TEXT,
    "MatchCount" INTEGER
)`).run();
