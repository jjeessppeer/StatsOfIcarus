
// TODO: handle other team sizes than 2.
const Elo = require('./EloCalculator.js');

module.exports = {
    processMatch,
    getPlayerEloData
}

async function getPlayerELO(client, playerId, ratingGroup) {
    const playerCollection = client.db("mhtest").collection("Players");
    const player = await playerCollection.findOne(
        {_id: playerId}
    );
    return player.ELORating[ratingGroup].ELOPoints;
}

async function rateMatch(client, match, ratingGroup) {
    const ELOPoints = [];
    const playerIds = [];
    for (let teamIdx = 0; teamIdx < 2; teamIdx += 1) {
        ELOPoints.push([]);
        playerIds.push([]);
        for (let playerIdx = 0; playerIdx < 8; playerIdx += 1) {
            const playerId = match.FlatPlayers[teamIdx * 8 + playerIdx];
            const playerELO = await getPlayerELO(client, playerId, ratingGroup);
            ELOPoints[teamIdx].push(playerELO);
            playerIds[teamIdx].push(playerIds);
        }
    }
    return Elo.getNewRankings(ELOPoints, match.Scores);
}

async function processMatch(client, match, ratingGroup = 'Overall') {
    if (match.TeamSize != 2) return false;
    if (match.TeamCount != 2) return false;
    if (match.FlatPlayers.length != 16) return false;
    if (match.Scores[0] + match.Scores[1] == 0) return false;
    const { rankings, delta, expectedOutcome, actualOutcome, teamDiff } = await rateMatch(client, match, ratingGroup)

    // Update database with new ranking
    // TODO: handle multiple ai players in same match.
    const playerCollection = client.db("mhtest").collection("Players");
    for (let teamIdx = 0; teamIdx < 2; teamIdx += 1) {
        for (let playerIdx = 0; playerIdx < 8; playerIdx += 1) {
            const playerId = match.FlatPlayers[teamIdx * 8 + playerIdx];
            const newELO = rankings[teamIdx][playerIdx];

            const setObj = {};
            await playerCollection.updateOne(
                {_id: playerId},
                {
                    $set: {[`ELORating.${ratingGroup}.ELOPoints`]: newELO},
                    $push: { [`ELORating.${ratingGroup}.Timeline`]: {
                        MatchId: match._id,
                        Timestamp: match.Timestamp,
                        Points: newELO,
                        Delta: (teamIdx == 0 ? delta : -delta),
                        TeamDiff: (teamIdx == 0 ? teamDiff : -teamDiff),
                        Expected: expectedOutcome,
                        Actual: actualOutcome
                    } }
                }
            );
        }
    }
}

async function getPlayerEloData(client, playerId, ratingGroup = 'SCS') {
    // const playerId = await getPlayerIdFromName(client, playerName);
    
    const playersCollection = client.db("mhtest").collection("Players");
    const aggregate = playersCollection.aggregate([
        { $match: {_id: playerId} },
        { $project: {
            ELORating: `$ELORating.${ratingGroup}`
        }},
        { $unwind: {
            path: "$ELORating.Timeline"
        }},
        { $project: {
            Timestamp: "$ELORating.Timeline.Timestamp",
            EloPoints: "$ELORating.Timeline.Points",
            Delta: "$ELORating.Timeline.Delta",
        }},
        // { $bucketAuto: {
        //     groupBy: "$Timestamp",
        //     buckets: 5,
        //     output: {
        //         count: { $sum: 1 },
        //         delta: { $sum: "$Delta" },
        //         min: { $min: "$Timestamp" },
        //         max: { $max: "$Timestamp" },
        //         elo: { $last: "$EloPoints" }
        //     }
        // }},
        { $group: {
            // "_id": {
            //     "time": {
            //       "$subtract": [
            //         "$Timestamp",
            //         { "$mod": [ "$Timestamp", ( 1000 * 60 * 60 ) ] }
            //       ]
            //     }
            // },
            _id: {
                "$subtract": [
                    "$Timestamp",
                    { "$mod": [ "$Timestamp", ( 1000 * 60 * 60 * 24 *7) ] }
                ]
            },
            count: { $sum: 1 },
            delta: { $sum: "$Delta" },
            deltaArr: { $push: "$Delta" },
            eloArr: { $push: "$EloPoints" },
            start: { $min: "$Timestamp" },
            end: { $max: "$Timestamp" },
            elo: { $last: "$EloPoints" }
        }},
        { $sort: {
            _id: 1
        }}

    ]);
    let playerInfo = await aggregate.toArray();
    return playerInfo;
}