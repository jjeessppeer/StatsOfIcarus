const sqlite = require('better-sqlite3');
const historyDb = new sqlite('databases/match_history.db', { fileMustExist: true, verbose: null });

// Get matches that has specified player
let res = historyDb.prepare(`
    SELECT * from Matches 
    JOIN PlayerMatches on Matches.MatchIndex = PlayerMatches.MatchIndex 
    WHERE true`).all();
// console.log(res);

// Get matches that has 2 specified players
let res2 = historyDb.prepare(`
    SELECT (Matches.MatchIndex)
    FROM Matches
    JOIN PlayerMatches ON Matches.MatchIndex = PlayerMatches.MatchIndex
    WHERE PlayerMatches.PlayerIndex=1
    INTERSECT
    SELECT (Matches.MatchIndex)
    FROM Matches
    JOIN PlayerMatches ON Matches.MatchIndex = PlayerMatches.MatchIndex
    WHERE PlayerMatches.PlayerIndex=2
    `).all();
// console.log(res2);

// Get Players from a specified match id
let res3 = historyDb.prepare(`
    SELECT PlayerIndex, LoadoutIndex from PlayerMatches
    JOIN Matches on Matches.MatchIndex = PlayerMatches.MatchIndex
    WHERE PlayerMatches.MatchIndex=1`).all();
// console.log(res3);

// Get Player with loadout from match id
let res4 = historyDb.prepare(`
    SELECT PlayerIndex, LoadoutIndex, PlayerLoadouts.* from PlayerMatches 
    JOIN Matches on Matches.MatchIndex = PlayerMatches.MatchIndex
    JOIN PlayerLoadouts on PlayerLoadouts.PlayerLoadoutIndex = PlayerMatches.LoadoutIndex
    WHERE PlayerMatches.MatchIndex=1`).all();
console.log(res4);
// Get 

// let res2 = historyDb.prepare(`SELECT * from Matches WHERE MatchIndex=1`).all();

