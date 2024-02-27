async function getEloTimeline(mongoClient, playerId, category) {
  const playersCollection = mongoClient.db("mhtest").collection("Players");
  console.log("getting elo timeline: ", playerId, category);
  const eloTimeline = await playersCollection.aggregate([
      { $match: {_id: playerId} },
      { $project: { ELORating: `$ELORating.${category}` }},
      { $unwind: { path: "$ELORating.Timeline" }},
      { $project: {
          Timestamp: "$ELORating.Timeline.Timestamp",
          EloPoints: "$ELORating.Timeline.Points",
          Delta: "$ELORating.Timeline.Delta",
      }},
      { $group: {
          _id: {
              "$subtract": [
                  "$Timestamp",
                  { "$mod": [ "$Timestamp", 1000 * 60 * 60 * 24 * 7 ] }
              ]
          },
          count: { $sum: 1 },
          delta: { $sum: "$Delta" },
          // deltaArr: { $push: "$Delta" },
          // eloArr: { $push: "$EloPoints" },
          start: { $min: "$Timestamp" },
          end: { $max: "$Timestamp" },
          elo: { $last: "$EloPoints" },
      }},
      { $sort: { _id: 1 }}

  ]).toArray();
  return eloTimeline;
}

// Return the oldest last match timestamp that should be included in the leaderboard.
function oldestAllowedPlayerTimestamp(category) {
  if (category == 'Overall') return 0;
  const currentTimestamp = new Date().getTime();
  const oldestTimestamp = currentTimestamp - MAX_INACTIVITY_MS;
  return oldestTimestamp;
}

async function getLeaderboardPosition(mongoClient, playerId, category) {
  const playersCollection = client.db("mhtest").collection("Players");
  const oldestTimestamp = oldestAllowedPlayerTimestamp(category);
  const ladderInfo = await playersCollection.aggregate([
    {
      $match: {
        ELOCategories: category,
        [`ELORating.${ratingGroup}.MatchCount`]: { $gt: 3 },
        LastMatchTimestamp: { $gt: oldestTimestamp }
      }
    },
    {
      $setWindowFields: {
        sortBy: { [`ELORating.${ratingGroup}.ELOPoints`]: -1 },
        output: { LadderRank: { $rank: {} } }
      }
    },
    { $match: { _id: playerId } },
    {
      $project: {
        _id: 0,
        PlayerId: '$_id',
        LadderRank: 1,
        Name: 1,
        Points: `$ELORating.${ratingGroup}.ELOPoints`,
      }
    },
    {
      $addFields: {
        RatingGroup: ratingGroup
      }
    },
  ]).next();
  if (!ladderInfo) return 0;

  return ladderInfo.LadderRank;
}

async function getLeaderboardPage(client, ratingGroup, startPos, count) {
  const playersCollection = client.db("mhtest").collection("Players");
  const oldestTimestamp = getOldestAllowedPlayerTimestamp(ratingGroup);
  const aggregate = playersCollection.aggregate([
    {
      $match: {
        ELOCategories: ratingGroup,
        [`ELORating.${ratingGroup}.MatchCount`]: { $gt: 3 },
        LastMatchTimestamp: { $gt: oldestTimestamp }
      }
    },
    {
      $setWindowFields: {
        sortBy: { [`ELORating.${ratingGroup}.ELOPoints`]: -1 },
        output: { LadderRank: { $rank: {} } }
      }
    },
    { $sort: { LadderRank: 1 } },
    { $skip: startPos },
    { $limit: count },
    {
      $project: {
        LadderRank: 1,
        Name: 1,
        Points: `$ELORating.${ratingGroup}.ELOPoints`,
      }
    }
  ]);
  const res = await aggregate.toArray();
  return res;
}

module.exports = {
  getEloTimeline,
  getLeaderboardPage,
  getLeaderboardPosition
}