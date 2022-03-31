const { MongoClient } = require("mongodb");
var fs = require('fs');

let record = JSON.parse(fs.readFileSync('record.json'));

const db_url = 'mongodb://127.0.0.1:27017';
let client = new MongoClient(db_url);


// Lock for insertMatchHistory. Function waits unil false to run.
let insertionRunning = false; 


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function updatePlayer(player, client) {
    const playersCollection = client.db("mhtest").collection("Players");
    let dbPlayer = await playersCollection.findOne({_id: player.UserId});
    
    let levels = [-1, -1, -1];
    let levelIndex = 0;
    if (player.Class == 1) levelIndex = 0;
    if (player.Class == 2) levelIndex = 1;
    if (player.Class == 4) levelIndex = 2;
    levels[levelIndex] = player.Level;

    if (!dbPlayer) {
        // Insert a new player
        console.log("Inserting new player...")
        let res = await playersCollection.insertOne({
            _id: player.UserId, 
            Name: player.Name, 
            Clan: player.Clan,
            MaxLevel: player.Level,
            Levels: levels
            });
    }
    else {
        // Update existing player
        // TODO
    }
}

async function insertMatchHistory(record) {
    while(insertionRunning){
        await sleep(10);
    }
    insertionRunning = true;

    const matchesCollection = client.db("mhtest").collection("Matches");
    const playersCollection = client.db("mhtest").collection("Players");
    const shipsCollection = client.db("mhtest").collection("Ships");
    const equipmentCollection = client.db("mhtest").collection("PlayerEquipment");

    // Check if match has already been added.
    let match = await matchesCollection.findOne({MatchId: record.MatchId});
    if (match){
        insertionRunning = false;
        return;
    }

    // Find ship build identifiers, or create new ones if does not exist.
    let shipIds = [];
    for (let ship of record.Ships){
        let dbShip = await shipsCollection.findOne({ShipModel: ship.ShipModel, Loadout: ship.ShipLoadout});
        if (dbShip) {
            shipIds.push(dbShip._id)
        }
        if (!dbShip){
            let res = await shipsCollection.insertOne({ShipModel: ship.ShipModel, Loadout: ship.ShipLoadout});
            shipIds.push(res.insertedId);
        }
    }

    // Find player identifiers, or create new ones of does not exist.
    let playerIds = [];
    let playerLevels = [];
    let playerEquipments = [];
    for (let ship of record.Ships) {
        for (let player of ship.Players){
            await updatePlayer(player, client);
            playerIds.push(player.UserId);
            playerLevels.push(player.Level);
            
            // // Make sure skills are sorted in db.
            player.Skills.sort(function(a, b) {
                return a - b;
            });

            let dbEquipment = await equipmentCollection.findOne({Skills: player.Skills});
            if (dbEquipment){
                playerEquipments.push(dbEquipment._id);
            }
            else {
                let res = await equipmentCollection.insertOne({Skills: player.Skills});
                playerEquipments.push(res.insertedId);
            }
        }
    }

    // Insert the match.
    let newMatch = {
        MatchId: record.MatchId,
        MapId: record.MapId,
        TeamSize: record.TeamSize,
        TeamCount: record.TeamCount,
        AvgLevel:  playerLevels.reduce( ( p, c ) => p + c, 0 ) / playerLevels.length,
        Ships: shipIds,
        Players: playerIds,
        Scores: [5, 2],
        MatchTime: 204,
        Timestamp: new Date().getTime()
    }
    await matchesCollection.insertOne(newMatch);

    insertionRunning = false;
}


function connect() {
    return client.connect();
}

function close() {
    return client.close();
}


module.exports = {
    insertMatchHistory,
    connect,
    close
    // connect
}