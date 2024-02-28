async function getEloTimeline(mongoClient, playerId, category) {
  const playersCollection = mongoClient.db("mhtest").collection("Players");
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
const MAX_INACTIVITY_MS = 1000 * 60 * 60 * 24 * 60;
function oldestAllowedPlayerTimestamp(category) {
  if (category == 'Overall') return 0;
  const currentTimestamp = new Date().getTime();
  const oldestTimestamp = currentTimestamp - MAX_INACTIVITY_MS;
  return oldestTimestamp;
}

async function getLeaderboardPosition(mongoClient, playerId, category) {
  const playersCollection = mongoClient.db("mhtest").collection("Players");
  const oldestTimestamp = oldestAllowedPlayerTimestamp(category);
  const ladderInfo = await playersCollection.aggregate([
    {
      $match: {
        ELOCategories: category,
        [`ELORating.${category}.MatchCount`]: { $gt: 3 },
        LastMatchTimestamp: { $gt: oldestTimestamp }
      }
    },
    {
      $setWindowFields: {
        sortBy: { [`ELORating.${category}.ELOPoints`]: -1 },
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
        Points: `$ELORating.${category}.ELOPoints`,
      }
    },
    {
      $addFields: {
        RatingGroup: category
      }
    },
  ]).next();
  if (!ladderInfo) return 0;

  return ladderInfo.LadderRank;
}

const PAGE_SIZE = 10;
async function getLeaderboardPage(mongoClient, page, category) {
  const playersCollection = mongoClient.db("mhtest").collection("Players");

  const oldestTimestamp = oldestAllowedPlayerTimestamp(category);
  // const startPos = Math.floor(page / PAGE_SIZE) * PAGE_SIZE;
  const startPos = page * PAGE_SIZE;

  const leaderboardPage = await playersCollection.aggregate([
    {
      $match: {
        ELOCategories: category,
        [`ELORating.${category}.MatchCount`]: { $gt: 3 },
        LastMatchTimestamp: { $gt: oldestTimestamp }
      }
    },
    {
      $setWindowFields: {
        sortBy: { [`ELORating.${category}.ELOPoints`]: -1 },
        output: { LadderRank: { $rank: {} } }
      }
    },
    { $sort: { LadderRank: 1 } },
    { $skip: startPos },
    { $limit: PAGE_SIZE },
    {
      $project: {
        LadderRank: 1,
        Name: 1,
        Points: `$ELORating.${category}.ELOPoints`,
      }
    }
  ]).toArray();
  return leaderboardPage;
}

module.exports = {
  getEloTimeline,
  getLeaderboardPage,
  getLeaderboardPosition
}