
const { generateFilterPipeline } = require("./MatchFilter.js");

async function getShipPickWinrate(mongoClient, filter) {
    const matchCollection = mongoClient.db("mhtest").collection("Matches");
    const filterPipeline = generateFilterPipeline(filter);
    console.log(filterPipeline);
    const shipPickWinrate = await matchCollection.aggregate(
      [
        ...filterPipeline,
        { "$unwind": {
          path: "$ShipModels",
          includeArrayIndex: "TeamIndex"}},
        { "$unwind": {
          path: "$ShipModels"
        }},
        { $facet: {
          "Count": [ { "$group": { _id: null, count: { $sum: 1 } } } ],
          "ModelWinrates": [
            { $group: {
              _id: "$ShipModels",
              Wins: { $sum: {$cond: [{$eq: ["$TeamIndex", "$Winner"]}, 1, 0]} },
              PlayedGames: { $sum: 1 }
            }},
            { $sort: {
              PlayedGames: -1
            }}
          ]
        }},
        { $unwind: "$Count" },
        { $project: {
          Count: "$Count.count",
          ModelWinrates: "$ModelWinrates"
        }}
      ]).next();
  return shipPickWinrate;
}

module.exports = {
  getShipPickWinrate
};