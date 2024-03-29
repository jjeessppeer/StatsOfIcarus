
// TODO: handle other team sizes than 2.
const Elo = require('./EloCalculator.js');

const MAX_INACTIVITY_MS = 1000 * 60 * 60 * 24 * 60;

const ELO_CATEGORIES = {
    'SCS': (match) => { return match.MatchTags.includes('SCS') },
    'Competitive': (match) => { return match.MatchTags.includes('Competitive') },
    'Overall': (match) => { return true; },
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
        { 
            $set: {[`ELORating.${ratingGroup}`]: {
                'ELOPoints': Elo.STARTING_ELO,
                'MatchCount': 0,
                'Timeline': []
            }},
            $push: {
                'ELOCategories': ratingGroup
            }
    });
    return Elo.STARTING_ELO;
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
    let matchRankingInfo;
    let categories = [];
    if (match.GameMode != 2 || match.TeamSize != 2 || match.TeamCount != 2) return [];
    for (const ratingGroup in ELO_CATEGORIES) {
        if (!ELO_CATEGORIES[ratingGroup](match)) continue;
        categories.push(ratingGroup);
        matchRankingInfo = await processMatch(client, match, ratingGroup);
    }
    return categories;
}

async function processMatch(client, match, ratingGroup) {
    if (match.TeamSize != 2) return false;
    if (match.TeamCount != 2) return false;
    if (match.FlatPlayers.length != 16) return false;
    if (match.Scores[0] + match.Scores[1] == 0) return false;

    const { oldRankings, playerIds } = await getPlayerRankings(client, match, ratingGroup);
    const [ rankings, delta, expectedOutcome, actualOutcome, teamDiff, teamRankings ] = Elo.getNewRankings(oldRankings, match.Scores);
    // Update database with new ranking
    // TODO: handle multiple ai players in same match.
    const playerCollection = client.db("mhtest").collection("Players");
    for (let teamIdx = 0; teamIdx < 2; teamIdx += 1) {
        for (let playerIdx = 0; playerIdx < 8; playerIdx += 1) {
            const playerId = match.FlatPlayers[teamIdx * 8 + playerIdx];
            const oldELO = oldRankings[teamIdx][playerIdx];
            const newELO = rankings[teamIdx][playerIdx];
            const playerDelta = newELO - oldELO;

            if (playerId == -1) continue;

            await playerCollection.updateOne(
                {_id: playerId},
                {
                    $set: { [`ELORating.${ratingGroup}.ELOPoints`]: newELO},
                    $inc: { [`ELORating.${ratingGroup}.MatchCount`]: 1 },
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

    if (ratingGroup == 'Overall') {
        const matchCollection = client.db("mhtest").collection("Matches");
        await matchCollection.updateOne(
            { _id: match._id },
            { $set: {
                Ranking: {
                    TeamRankings: teamRankings,
                    ExpectedOutcome: expectedOutcome,
                    ActualOutcome: actualOutcome,
                    Delta: delta
            }}}
        );
    }
}

// async function createLeaderboardSnapshot(client, ratingGroup, timestamp) {
//     const playersCollection = client.db("mhtest").collection("Players");
//     const aggregate = playersCollection.aggregate([
//         { $match: { ELOCategories: ratingGroup } },
//         { $setWindowFields: {
//             sortBy: { [`ELORating.${ratingGroup}.ELOPoints`]: -1 },
//             output: {
//                 LadderRank: {
//                     $rank: {}
//                 }
//             }
//         }},
//         { $project: {
//             _id: 0,
//             PlayerId: '$_id',
//             LadderRank: 1,
//             Name: 1,
//             Points: `$ELORating.${ratingGroup}.ELOPoints`,
//         }},
//         { $addFields: {
//             RatingGroup: ratingGroup,
//             Timestamp: timestamp
//         }},
//         { $merge: {
//             into: 'EloLeaderboard'
//         }}
//     ]);
//     const res = await aggregate.next();
// }

// async function getLeaderboardPosition(client, ratingGroup, playerId) {
//     const playersCollection = client.db("mhtest").collection("Players");
//     const oldestTimestamp = getOldestAllowedPlayerTimestamp(ratingGroup);
//     const aggregate = playersCollection.aggregate([
//         { $match: { 
//             ELOCategories: ratingGroup, 
//             [`ELORating.${ratingGroup}.MatchCount`]: { $gt: 3 },
//             LastMatchTimestamp: { $gt: oldestTimestamp }
//         }},
//         { $setWindowFields: {
//             // partitionBy: ,
//             sortBy: { [`ELORating.${ratingGroup}.ELOPoints`]: -1 },
//             output: {
//                 LadderRank: {
//                     $rank: {}
//                 }
//             }
//         }},
//         { $match: {_id: playerId} },
//         { $project: {
//             _id: 0,
//             PlayerId: '$_id',
//             LadderRank: 1,
//             Name: 1,
//             Points: `$ELORating.${ratingGroup}.ELOPoints`,
//         }},
//         { $addFields: {
//             RatingGroup: ratingGroup
//         }},
//     ]);
//     let playerInfo = await aggregate.next();
//     if (!playerInfo) return 0; 
    
//     return playerInfo.LadderRank;
// }

// async function getLeaderboardPage(client, ratingGroup, startPos, count) {
//     const playersCollection = client.db("mhtest").collection("Players");
//     const oldestTimestamp = getOldestAllowedPlayerTimestamp(ratingGroup);
//     const aggregate = playersCollection.aggregate([
//         { $match: { 
//             ELOCategories: ratingGroup, 
//             [`ELORating.${ratingGroup}.MatchCount`]: { $gt: 3 },
//             LastMatchTimestamp: { $gt: oldestTimestamp }
//         } },
//         { $setWindowFields: {
//             // partitionBy: ,
//             sortBy: { [`ELORating.${ratingGroup}.ELOPoints`]: -1 },
//             output: {
//                 LadderRank: {
//                     $rank: {}
//                 }
//             }
//         }},
//         { $sort: {LadderRank: 1} },
//         { $skip: startPos},
//         { $limit: count },

//         { $project: {
//             LadderRank: 1,
//             Name: 1,
//             Points: `$ELORating.${ratingGroup}.ELOPoints`,
//         }}
//     ]);
//     const res = await aggregate.toArray();
//     return res;
// }

// async function getPlayerEloData(client, playerId, ratingGroup) {
//     // const playerId = await getPlayerIdFromName(client, playerName);
//     // await createLeaderboardSnapshot(client, ratingGroup, 1000)
//     const playersCollection = client.db("mhtest").collection("Players");
//     const aggregate = playersCollection.aggregate([
//         { $match: {_id: playerId} },
//         { $project: {
//             ELORating: `$ELORating.${ratingGroup}`,
//         }},
//         { $unwind: {
//             path: "$ELORating.Timeline"
//         }},
//         { $project: {
//             Timestamp: "$ELORating.Timeline.Timestamp",
//             EloPoints: "$ELORating.Timeline.Points",
//             Delta: "$ELORating.Timeline.Delta",
//         }},
//         // { $bucketAuto: {
//         //     groupBy: "$Timestamp",
//         //     buckets: 5,
//         //     output: {
//         //         count: { $sum: 1 },
//         //         delta: { $sum: "$Delta" },
//         //         min: { $min: "$Timestamp" },
//         //         max: { $max: "$Timestamp" },
//         //         elo: { $last: "$EloPoints" }
//         //     }
//         // }},
//         { $group: {
//             // "_id": {
//             //     "time": {
//             //       "$subtract": [
//             //         "$Timestamp",
//             //         { "$mod": [ "$Timestamp", ( 1000 * 60 * 60 ) ] }
//             //       ]
//             //     }
//             // },
//             _id: {
//                 "$subtract": [
//                     "$Timestamp",
//                     { "$mod": [ "$Timestamp", ( 1000 * 60 * 60 * 24 *7) ] }
//                 ]
//             },
//             count: { $sum: 1 },
//             delta: { $sum: "$Delta" },
//             deltaArr: { $push: "$Delta" },
//             eloArr: { $push: "$EloPoints" },
//             start: { $min: "$Timestamp" },
//             end: { $max: "$Timestamp" },
//             elo: { $last: "$EloPoints" },
//         }},
//         { $sort: {
//             _id: 1
//         }}

//     ]);
//     let playerInfo = await aggregate.toArray();
//     return playerInfo;
// }

// async function getPlayerLadderRank() {

// }

module.exports = {
    processMatch,
    processMatchAllCategories,
    // createLeaderboardSnapshot,
    ELO_CATEGORIES
}