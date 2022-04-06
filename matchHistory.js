const { MongoClient } = require("mongodb");
const fs = require('fs');
const assert = require('assert');
const { kill } = require("process");
const { json } = require("express/lib/response");


// const db_url = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_ADRESS}/`;
const db_url = `mongodb://localhost:27017/`;
let client = new MongoClient(db_url);


// Lock for insertMatchHistory. Function waits unil false to run.
let insertionRunning = false; 


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPlayerId(playerName) {
    // TODO handle ps4 players?
    const playersCollection = client.db("mhtest").collection("Players");
    playerName = playerName + " [PC]";
    let res = await playersCollection.findOne({Name: playerName});
    if (!res) return false;
    return res._id;
}

// Return all ship build ids matching the restrictions.
async function getShipBuilds(restrictions) {
    const matchCollection = client.db("mhtest").collection("Ships");
    let query = {};
    for (let i in restrictions) {
        if (restrictions[i] == -1) continue;
        if (i == 0) query['ShipModel'] = restrictions[i];
        else query[`Loadout.${i-1}`] = restrictions[i];
    }
    
    let results = matchCollection.find(query);
    let out = [];
    await results.forEach(doc => {out.push(doc._id)});
    return out;
}

async function generateMatchQuery(filters){
    // filters = [
    //     {filter_type: "PlayersSameTeam", include: true, players: ["whereami"]},
    //     {filter_type: "ShipBuilds", include: true, 
    //         ships: [ [[97, 171, -1], []], [[16], []] ]}
    // ];
    console.log(filters);
    if (filters.length == 0) {
        return {};
    }
    
    let fullQuery = {
        $and: [
        ]
    };
    console.log(JSON.stringify(filters));

    for (let filter of filters) {
        if (filter.filter_type == "PlayersSameTeam") {

            // Collect the player ids.
            let playerIds = [];
            for (let playerName of filter.players) {
                let playerId = await getPlayerId(playerName);
                if (!playerId) {
                    continue;
                }
                playerIds.push(playerId);
            }
            let query = {$or: [
                {T0_Players: {$all: playerIds}},
                {T1_Players: {$all: playerIds}}
            ]}
            if (!filter.include) {
                query = {'$nor': [query]};
            }
            fullQuery['$and'].push(query);
        }
        if (filter.filter_type == "ShipBuilds") {
            // let matchingBuilds = await getShipBuilds(filter.ships);
            // [ [[T1s1...], [T1s2...]], [[T2s1...], [T2s2...]] ]
            let shipBuilds = [ [[], []], [[], []] ];
            for (let i in filter.ships) {
                for (let j in filter.ships[i]) {
                    let builds = await getShipBuilds(filter.ships[i][j]);
                    shipBuilds[i][j] = builds;
                }
            }
            let query = {
                $or: [
                    {$and: [
                        { T0_Ships: {$in: shipBuilds[0][0]} },
                        { T0_Ships: {$in: shipBuilds[0][1]} },
                        { T1_Ships: {$in: shipBuilds[1][0]} },
                        { T1_Ships: {$in: shipBuilds[1][1]} }
                    ]},
                    {$and: [
                        { T1_Ships: {$in: shipBuilds[0][0]} },
                        { T1_Ships: {$in: shipBuilds[0][1]} },
                        { T0_Ships: {$in: shipBuilds[1][0]} },
                        { T0_Ships: {$in: shipBuilds[1][1]} }
                    ]}
                ]
            }
            fullQuery['$and'].push(query);
        }
    }
    return fullQuery;
}


async function getMatches(filters, offset, count) {
    console.log("Getting record");
    const matchCollection = client.db("mhtest").collection("Matches_2v2");
    const playersCollection = client.db("mhtest").collection("Players");

    console.log("Getting record");
    let fullQuery = await generateMatchQuery(filters);


    const pipeline = [
        //{$sort: {...}}
        {$match: fullQuery},
        {$lookup: {
            from: "Players",
            localField: "FlatPlayers",
            foreignField: "_id",
            as: "PlayerInfo"
        }},
        {$lookup: {
            from: "PlayerEquipment",
            localField: "FlatSkills",
            foreignField: "_id",
            as: "LoadoutInfo"
        }},
        {$lookup: {
            from: "Ships",
            localField: "FlatShips",
            foreignField: "_id",
            as: "ShipLoadouts"
        }},
        {$lookup: {
            from: "Items-Ships",
            localField: "ShipLoadouts.ShipModel",
            foreignField: "_id",
            as: "ShipItems"
        }},
        {$lookup: {
            from: "Items-Skills",
            localField: "LoadoutInfo.Skills",
            foreignField: "_id",
            as: "SkillItems"
        }},
        {$lookup: {
            from: "Items-Guns",
            localField: "ShipLoadouts.Loadout",
            foreignField: "_id",
            as: "GunItems"
        }},
        {$facet:{
          "stage1" : [ {"$group": {_id:null, count:{$sum:1}}} ],
          "stage2" : [ { "$skip": offset}, {"$limit": count} ]
        }},
        {$unwind: "$stage1"},
            //output projection
        {$project:{
            count: "$stage1.count",
            data: "$stage2"
        }}
   ];

    let aggCursor = matchCollection.aggregate(pipeline);
    let result = {};
    result = await aggCursor.next();
    aggCursor.close();
    // aggCursor.close();
    // await aggCursor.forEach(doc => {
    //     result.push(doc);
    //     result = doc;
    //     // console.log(doc);
    // });
    // aggCursor.close();
    // console.log("gotten");
    return result;

//    let cc = await matchCollection.estimatedDocumentCount();

//    console.log(cc);
//    console.log(res);
}


async function submitRecord(record, ip) {
    if (!validateHistorySubmission(record)) {
        console.log("Invalid match history.");
        return false;
    }

    if (record.TeamCount != 2 && record.TeamSize != 2) {
        console.log("Only 2v2 supported.");
        return false;
    }
    
    // Wait until no concurrent insertion is running.
    while(insertionRunning){
        await sleep(10);
    }

    insertionRunning = true;
    try {
        await insertMatchHistory(record, ip);
    } catch (err){
        console.log(err)
    } finally {
        insertionRunning = false;
    }
    return true;
}

function validateHistorySubmission(record){
    try {
        assert(typeof record.MatchId == "string");
        assert(Number.isInteger(record.MapId));
        assert(Number.isInteger(record.GameMode));
        assert(Number.isInteger(record.TeamSize));
        assert(Number.isInteger(record.TeamCount));
        assert(record.TeamSize <= 4);
        assert(record.TeamCount <= 4);

        assert(Number.isInteger(record.Winner));
        assert(Number.isInteger(record.MatchTime));
        assert(Array.isArray(record.Scores));
        assert(record.Scores.length == record.TeamCount);
        for (let score of record.Scores) assert(Number.isInteger(score));

        assert(Array.isArray(record.Ships));
        assert(record.Ships.length <= record.TeamSize * record.TeamCount);
        assert(record.Ships.length <= 8);
        for (let ship of record.Ships) {
            if (ship == null) continue;
            assert(typeof ship == 'object');
            assert(Number.isInteger(ship.ShipModel));
            assert(typeof ship.ShipName == "string");
            assert(Number.isInteger(ship.Team));
            assert(ship.Team <= 4);

            assert(Array.isArray(ship.ShipLoadout));
            assert(ship.ShipLoadout.length <= 6);
            for (let gun of ship.ShipLoadout) {
                assert(Number.isInteger(gun));
            }

            assert(Array.isArray(ship.SlotNames));
            assert(ship.SlotNames.length <= 6);
            for (let slotName of ship.SlotNames){
                assert(typeof slotName == "string");
            }

            assert(Array.isArray(ship.Players));
            assert(ship.Players.length == 4);
            for (let player of ship.Players) {
                assert(player == null || typeof player == 'object');
                if (player == null) continue;
                assert(Number.isInteger(player.UserId));
                assert(typeof player.Name == "string");
                assert(typeof player.Clan == "string");
                assert(Number.isInteger(player.Class));
                assert(Number.isInteger(player.Level));
                assert(Number.isInteger(player.MatchCount));
                assert(Number.isInteger(player.MatchCountRecent));

                assert(Array.isArray(player.Skills));
                assert(player.Skills.length < 9);
                for (let skill of player.Skills) {
                    assert(Number.isInteger(skill));
                }
            }
        }
    } catch (err) {
        console.log(err);
        return false;
    }
    return true;
}

async function updatePlayer(player) {
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

async function getShipLoadoutId(ship) {
    const shipsCollection = client.db("mhtest").collection("Ships");
    // Sort the ship loadout
    let sortedLoadout = [];
    for (let i = 0; i < ship.ShipLoadout.length; i++) {
        for (let j = 0; j < ship.ShipLoadout.length; j++) {
            if (ship.SlotNames[j] == `gun-slot-${i+1}`){
                sortedLoadout.push(ship.ShipLoadout[j]);
                break;
            }
        }
    }
    ship.ShipLoadout = sortedLoadout;
    
    let dbShip = await shipsCollection.findOne({ShipModel: ship.ShipModel, Loadout: ship.ShipLoadout});
    if (dbShip) {
        return dbShip._id;
    }
    let res = await shipsCollection.insertOne({ShipModel: ship.ShipModel, Loadout: ship.ShipLoadout});
    return res.insertedId;
}


// async function getEquipmentId(player){
// }

async function insertMatchHistory(record, ip) {
    const matchesCollection = client.db("mhtest").collection("Matches_2v2");
    const playersCollection = client.db("mhtest").collection("Players");
    const shipsCollection = client.db("mhtest").collection("Ships");
    const equipmentCollection = client.db("mhtest").collection("PlayerEquipment");

    // Check if match has already been added.
    let match = await matchesCollection.findOne({MatchId: record.MatchId});
    if (match){
        // TODO: Check if record matches. If it does add vote.
        return true;
    }

    let shipIds = [];
    let flatShipIds = []
    let shipNames = [];
    for (let ship of record.Ships) {
        while (shipIds.length <= ship.Team) shipIds.push([]);
        while (shipNames.length <= ship.Team) shipNames.push([]);
        shipNames[ship.Team].push(ship.ShipName);

        let shipId = await getShipLoadoutId(ship);
        shipIds[ship.Team].push(shipId);
        flatShipIds.push(shipId);
    }

    // Find player identifiers, or create new ones of does not exist.
    let playerIds = [];
    let flatPlayerIds = [];
    let playerLoadouts = [];
    let flatPlayerLoadouts = [];
    let playerCount = 0;

    let playerLevels = [];
    for (let ship of record.Ships) {
        while (playerIds.length <= ship.Team) playerIds.push([]);
        while (playerLoadouts.length <= ship.Team) playerLoadouts.push([]);
        for (let player of ship.Players){
            if (player == null){
                playerIds[ship.Team].push(-1);
                flatPlayerIds.push(-1);
                playerLoadouts[ship.Team].push(-1);
                flatPlayerLoadouts.push(-1);
                continue;
            }
            playerCount += 1;
            await updatePlayer(player);
            playerIds[ship.Team].push(player.UserId);
            flatPlayerIds.push(player.UserId);
            playerLevels.push(player.Level);
            
            // // Make sure skills are sorted in db.
            player.Skills.sort(function(a, b) {
                return a - b;
            });

            let dbEquipment = await equipmentCollection.findOne({Class: player.Class, Skills: player.Skills});
            if (dbEquipment){
                playerLoadouts[ship.Team].push(dbEquipment._id);
                flatPlayerLoadouts.push(dbEquipment._id);
            }
            else {
                let res = await equipmentCollection.insertOne({Class: player.Class, Skills: player.Skills});
                playerLoadouts[ship.Team].push(res.insertedId);
                flatPlayerLoadouts.push(res.insertedId);
            }
        }
    }

    // Insert the match.
    let newMatch = {
        SubmitterIp: ip,
        SubmissionCount: 1,
        MatchId: record.MatchId,
        MapId: record.MapId,
        ShipsFull: record.Ships.length == record.TeamSize * record.TeamCount,
        PlayersFull: playerCount == record.TeamSize * record.TeamCount * 4,
        GameMode: record.GameMode,
        TeamSize: record.TeamSize,
        TeamCount: record.TeamCount,
        AvgLevel:  playerLevels.reduce( ( p, c ) => p + c, 0 ) / playerLevels.length,
        Winner: record.Winner,
        Scores: record.Scores,
        MatchTime: record.MatchTime,
        Timestamp: new Date().getTime(),
        FlatPlayers: flatPlayerIds,
        FlatShips: flatShipIds,
        FlatSkills: flatPlayerLoadouts,
        Players: playerIds,
        Ships: shipIds,
        ShipNames: shipNames,
        Skills: playerLoadouts
    }

    // // Insert ship arrays
    // for (let i in shipIds) {
    //     newMatch[`T${i}_Ships`] = []; 
    //     newMatch[`T${i}_ShipNames`] = [];  
    //     for (let j in shipIds[i]){
    //         newMatch[`T${i}_Ships`].push(shipIds[i][j]);
    //         newMatch[`T${i}_ShipNames`].push(shipNames[i][j]);
    //     }
    // }

    // for (let i in playerIds) {
    //     newMatch[`T${i}_Players`] = []; 
    //     newMatch[`T${i}_PlayerLoadouts`] = [];
    //     for (let j in playerIds[i]) {
    //         newMatch[`T${i}_Players`].push(playerIds[i][j]);
    //         newMatch[`T${i}_PlayerLoadouts`].push(playerLoadouts[i][j]);
    //     }
    // }

    await matchesCollection.insertOne(newMatch);

    return true;
}


function connect() {
    return client.connect();
}

function close() {
    return client.close();
}

function setMongoClient(clientIn) {
    client = clientIn;
}


module.exports = {
    submitRecord,
    getMatches,
    setMongoClient,
    connect,
    close
    // connect
}