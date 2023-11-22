const assert = require('assert');
const Elo = require('./Elo/EloHelper.js');
const MatchTagger = require('../Server/MatchHistory/MatchTagger.js');

const SCS_START_HOUR_UTC = 18;
const SCS_START_DAY = 0;
const SCS_HOUR_LENGTH = 4;


const MIN_SUBMISSION_INTERVAL_MINUTES = 1;
const MIN_SUBMISSION_INTERVAL_MS = MIN_SUBMISSION_INTERVAL_MINUTES * 60 * 1000;

var client;

// Lock for insertMatchHistory. Function waits unil false to run.
let insertionRunning = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function posModulo(a, b) {
    return ((a % b) + b) % b;
};


async function getPlayerId(playerName) {
    // TODO handle ps4 players?
    const playersCollection = client.db("mhtest").collection("Players");
    playerName = playerName + " [PC]";
    let res = await playersCollection.findOne({ Name: playerName });
    if (!res) return false;
    return res._id;
}

async function submitRecord(lobbyData, gunneryData, positionData, ip) {
    // Wait until no concurrent insertion is running.
    while (insertionRunning) {
        await sleep(10);
    }

    insertionRunning = true;
    try {
        await insertMatchHistory(lobbyData, gunneryData, positionData, ip);
    } catch (err) {
        console.log(err)
    } finally {
        insertionRunning = false;
    }
    return true;
}

async function updatePlayer(player, timestamp) {
    const playersCollection = client.db("mhtest").collection("Players");
    let dbPlayer = await playersCollection.findOne({ _id: player.UserId });

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
            Levels: levels,
            MatchCount: 0,
            MatchesWon: 0,
            MatchesPlayer: [],
            ELORating: {},
            LastMatchTimestamp: timestamp
        });
    }
    else {
        // Upadede existing player
        let dbLevels = dbPlayer.Levels;
        for (let i = 0; i < 3; i++) {
            if (levels[i] > dbLevels[i]) {
                dbLevels[i] = levels[i];
            }
        }
        await playersCollection.updateOne(
            {_id: player.UserId},
            {$set: {
                Levels: dbLevels, 
                MaxLevel: Math.max(dbLevels),
                LastMatchTimestamp: timestamp
            }},
        )
    }
}

function sortShipLoadout(ship) {
    let sortedLoadout = [];
    let sortedNames = [];
    for (let i = 0; i < ship.ShipLoadout.length; i++) {
        for (let j = 0; j < ship.ShipLoadout.length; j++) {
            if (ship.SlotNames[j] == `gun-slot-${i + 1}`) {
                sortedLoadout.push(ship.ShipLoadout[j]);
                sortedNames.push(ship.SlotNames[j]);
                break;
            }
        }
    }
    ship.SlotNames = sortedNames;
    ship.ShipLoadout = sortedLoadout;
}

async function getShipLoadoutId(ship) {
    const shipsCollection = client.db("mhtest").collection("Ships");

    let dbShip = await shipsCollection.findOne({ ShipModel: ship.ShipModel, Loadout: ship.ShipLoadout });
    if (dbShip) {
        return dbShip._id;
    }
    let res = await shipsCollection.insertOne({ ShipModel: ship.ShipModel, Loadout: ship.ShipLoadout });
    return res.insertedId;
}


async function getEquipmentId(player) {
    // Make sure skills are sorted in db.
    player.Skills.sort(function (a, b) {
        return a - b;
    });

    const equipmentCollection = client.db("mhtest").collection("PlayerEquipment");
    let dbEquipment = await equipmentCollection.findOne({ Class: player.Class, Skills: player.Skills });
    if (dbEquipment) {
        return dbEquipment._id;
    }
    let res = await equipmentCollection.insertOne({ Class: player.Class, Skills: player.Skills });
    return res.insertedId;
}

async function insertMatchHistory(lobbyData, gunneryData, positionData, ip) {
    const matchesCollection = client.db("mhtest").collection("Matches");
    const playersCollection = client.db("mhtest").collection("Players");
    const shipsCollection = client.db("mhtest").collection("Ships");
    var ipCollection = client.db("mhtest").collection("Submitters");

    let submissionDate = new Date();
    let submissionHour = submissionDate.getUTCHours();
    let submissionDay = submissionDate.getUTCDay();
    let submissionTicks = submissionDate.getTime();

    let submitter = await ipCollection.findOneAndUpdate(
        {_id: ip},
        {$set: {LastTimestamp: submissionTicks}, $inc: {SubmissionCount: 1}},
        {upsert: true});

    // Check so matches are not submitter too fast.
    if (submitter.value != null && 
        submissionTicks - submitter.value.LastTimestamp < MIN_SUBMISSION_INTERVAL_MS ) {
        await ipCollection.updateOne(
            {_id: ip},
            {$inc: {FailedSubmissions: 1}});
        return false;
    }

    // Check if match has already been added.
    let match = await matchesCollection.findOne({ MatchId: lobbyData.MatchId });
    
    if (match) {
        if (!match.SubmitterIps.includes(ip)) {
            match.SubmitterIps.push(ip);
            await matchesCollection.updateOne(
                {MatchId: lobbyData.MatchId},
                {$set: {SubmitterIps: match.SubmitterIps}});
        }

        return true;
    }

    let shipIds = [];
    let shipNames = [];
    let shipModels = [];
    let shipLoadouts = [];
    let shipCounters = [];

    let playerIds = [];
    let playerSkills = [];
    let playerLevels = [];
    let playerCount = 0;

    const timestamp = new Date().getTime();

    // Initialize array structure.
    for (let i = 0; i < lobbyData.TeamCount; i++) {
        // Add a ship info array per team
        shipIds.push([]);
        shipNames.push([]);
        shipModels.push([]);
        shipLoadouts.push([]);
        shipCounters.push(0);

        playerIds.push([]);
        playerSkills.push([]);
        playerLevels.push([]);

        for (let j = 0; j < lobbyData.TeamSize; j++) {
            // Add a player info array per ship
            playerIds[i].push([]);
            playerSkills[i].push([]);
            playerLevels[i].push([]);
        }
    }

    // Load ships and players into arrays
    for (let i = 0; i < lobbyData.Ships.length; i++) {
        let ship = lobbyData.Ships[i];
        let team = ship.Team;
        let shipIndex = shipCounters[team] + 0;
        shipCounters[team] += 1;
        sortShipLoadout(ship); // Sort the ship loadout before doing anything with it.
        let shipLoadoutId = await getShipLoadoutId(ship);
        shipNames[team].push(ship.ShipName);
        shipIds[team].push(shipLoadoutId);

        shipModels[team][shipIndex] = ship.ShipModel;
        shipLoadouts[team][shipIndex] = ship.ShipModel;

        for (let p = 0; p < ship.Players.length; p++) {
            let player = ship.Players[p];
            if (player == null) {
                playerIds[team][shipIndex].push(-1);
                playerSkills[team][shipIndex].push(-1);
                playerLevels[team][shipIndex].push(-1);
                continue;
            }
            playerCount += 1;
            await updatePlayer(player, timestamp);
            let equipmentId = await getEquipmentId(player);

            playerIds[team][shipIndex].push(player.UserId);
            playerSkills[team][shipIndex].push(equipmentId);
            playerLevels[team][shipIndex].push(player.Level);
        }
    }

    let flatPlayerIds = playerIds.flat(Infinity);
    let flatShipIds = shipIds.flat(Infinity);
    let flatSkills = playerSkills.flat(Infinity);
    let flatPlayerLevels = playerLevels.flat(Infinity);

    let avgPlayerLevel = flatPlayerLevels.reduce((partialSum, a) => partialSum + a, 0) / flatPlayerLevels.length;
    avgPlayerLevel = Math.ceil(avgPlayerLevel);

    let shipsFull = lobbyData.Ships.length == lobbyData.TeamSize * lobbyData.TeamCount;
    let playersFull = playerCount == lobbyData.TeamSize * lobbyData.TeamCount * 4;
    let emptySlots = lobbyData.TeamSize * lobbyData.TeamCount * 4 - playerCount;

    

    // Insert the match.
    let newMatch = {
        ModVersion: lobbyData.ModVersion,
        SubmitterIp: ip,
        SubmitterIps: [ip],
        Passworded: lobbyData.Passworded,
        Timestamp: timestamp,
        MatchTags: [],
        MatchId: lobbyData.MatchId,
        MapId: lobbyData.MapId,
        ShipsFull: shipsFull,
        PlayersFull: playersFull,
        MatchTime: lobbyData.MatchTime,
        GameMode: lobbyData.GameMode,
        TeamSize: lobbyData.TeamSize,
        TeamCount: lobbyData.TeamCount,
        Winner: lobbyData.Winner,
        Scores: lobbyData.Scores,
        AvgPlayerLevel: avgPlayerLevel,
        Ships: shipIds,
        ShipModels: shipModels,
        ShipLoadouts: shipLoadouts,
        ShipNames: shipNames,
        Players: playerIds,
        Skills: playerSkills,
        PlayerLevels: playerLevels,
        FlatPlayers: flatPlayerIds,
        FlatShips: flatShipIds,
        FlatSkills: flatSkills,
        FlatPlayerLevels: flatPlayerLevels,
        GunneryData: gunneryData,
        PositionData: positionData
    }

    if (lobbyData.Passworded)
        newMatch.MatchTags.push('Passworded')
    if (shipsFull)
        newMatch.MatchTags.push('ShipsFull')
    if (playersFull)
        newMatch.MatchTags.push('PlayersFull')

    if (MatchTagger.isSCS(newMatch))
        newMatch.MatchTags.push('SCS')
    if (shipsFull && emptySlots <= 1 && avgPlayerLevel >= 30 && lobbyData.Passworded)
        newMatch.MatchTags.push('Competitive')
    if (avgPlayerLevel >= 30 && emptySlots <= 2)
        newMatch.MatchTags.push('HighLevel')

    

    // Create some new fields to ease future filtering.
    for (let i = 0; i < newMatch.ShipModels.length; i++) {
        newMatch[`Team_${i}_ShipModels`] = newMatch.ShipModels[i];
        newMatch[`Team_${i}_ShipLoadouts`] = newMatch.ShipLoadouts[i];
        newMatch[`Team_${i}_ShipPlayers`] = newMatch.Players[i].flat(Infinity);
    }


    await matchesCollection.insertOne(newMatch);
    await Elo.processMatchAllCategories(client, newMatch);

    // let doc = await matchesCollection.findOne({MatchId: lobbyData.MatchId});
    let s = await matchesCollection.aggregate([
        { $match: {MatchId: lobbyData.MatchId} },
        {$project: {
            MatchId: 1,
            object_size: { $bsonSize: "$$ROOT"}
        }}
    ])
    let doc = await s.next();
    console.log(doc);

    return true;
}

function setMongoClient(clientIn) {
    client = clientIn;
}


module.exports = {
    submitRecord,
    setMongoClient
    // connect
}