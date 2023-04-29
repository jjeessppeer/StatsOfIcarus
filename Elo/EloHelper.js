
// TODO: handle other team sizes than 2.
const Elo = require('./EloCalculator.js');




const ELO_CATEGORIES = {
    'Overall': (match) => { return true; },
    'SCS': (match) => { return match.MatchTags.includes('SCS') },
    'Competitive': (match) => { return match.MatchTags.includes('Competitive') }
}

async function getPlayerELO(client, playerId, ratingGroup) {
    const playerCollection = client.db("mhtest").collection("Players");
    const player = await playerCollection.findOne(
        {_id: playerId}
    );
    if (ratingGroup in player.ELORating)
        return player.ELORating[ratingGroup].ELOPoints;

    // Add rating group with default values.
    playerCollection.updateOne(
        {_id: playerId},
        { $set: {[`ELORating.${ratingGroup}`]: {
            'ELOPoints': Elo.STARTING_ELO,
            'Timeline': []
        }}
    });
    return Elo.STARTING_ELO;
}

async function updatePlayerElo(client, playerId, newElo, ratingGroup) {

}

async function getPlayerRankings(client, match, ratingGroup) {
    const oldRankings = [];
    const playerIds = [];
    for (let teamIdx = 0; teamIdx < 2; teamIdx += 1) {
        oldRankings.push([]);
        playerIds.push([]);
        for (let playerIdx = 0; playerIdx < 8; playerIdx += 1) {
            const playerId = match.FlatPlayers[teamIdx * 8 + playerIdx];
            const playerELO = await getPlayerELO(client, playerId, ratingGroup);
            oldRankings[teamIdx].push(playerELO);
            playerIds[teamIdx].push(playerIds);
        }
    }
    return { oldRankings, playerIds };
}

async function processMatchAllCategories(client, match) {
    for (const ratingGroup in ELO_CATEGORIES) {
        if (!ELO_CATEGORIES[ratingGroup](match)) continue;
        await processMatch(client, match, ratingGroup);
    }
}

async function processMatch(client, match, ratingGroup) {
    if (match.TeamSize != 2) return false;
    if (match.TeamCount != 2) return false;
    if (match.FlatPlayers.length != 16) return false;
    if (match.Scores[0] + match.Scores[1] == 0) return false;

    const { oldRankings, playerIds } = await getPlayerRankings(client, match, ratingGroup);
    const { rankings, delta, expectedOutcome, actualOutcome, teamDiff, teamRankings } = Elo.getNewRankings(oldRankings, match.Scores);

    // Update database with new ranking
    // TODO: handle multiple ai players in same match.
    const playerCollection = client.db("mhtest").collection("Players");
    for (let teamIdx = 0; teamIdx < 2; teamIdx += 1) {
        for (let playerIdx = 0; playerIdx < 8; playerIdx += 1) {
            const playerId = match.FlatPlayers[teamIdx * 8 + playerIdx];
            const oldELO = oldRankings[teamIdx][playerIdx];
            const newELO = rankings[teamIdx][playerIdx];
            const playerDelta = newELO - oldELO;

            await playerCollection.updateOne(
                {_id: playerId},
                {
                    $set: {[`ELORating.${ratingGroup}.ELOPoints`]: newELO},
                    $push: { [`ELORating.${ratingGroup}.Timeline`]: {
                        MatchId: match._id,
                        Timestamp: match.Timestamp,
                        Points: newELO,
                        Delta: playerDelta,
                        TeamDiff: (teamIdx == 0 ? teamDiff : -teamDiff),
                        Expected: expectedOutcome,
                        Actual: actualOutcome
                    } }
                }
            );
        }
    }

    const matchCollection = client.db("mhtest").collection("Matches");
    console.log
    await matchCollection.updateOne(
        {_id: match._id},
        { $set: {Ranking: {
            TeamRankings: teamRankings,
            ExpectedOutcome: expectedOutcome,
            ActualOutcome: actualOutcome,
            Delta: delta
        }} }
    );


    // mapName = `
    // Elo: \n${Math.round(matchData.Ranking.Team1Ranking)} | ${Math.round(matchData.Ranking.Team2Ranking)}
    // \nOutcome: \n${(Math.round(matchData.Ranking.ExpectedOutcome * 100) / 100).toFixed(2)} | ${(Math.round(matchData.Ranking.ActualOutcome * 100) / 100).toFixed(2)}
    // \nDelta: \n${matchData.Ranking.Delta}`;
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

module.exports = {
    processMatch,
    processMatchAllCategories,
    getPlayerEloData,
    ELO_CATEGORIES
}