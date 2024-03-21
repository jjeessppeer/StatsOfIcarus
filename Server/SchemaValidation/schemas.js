const Joi = require('joi'); 
const match_0_1_3 = require("./HistoryUpload/0.1.3.js");
const match_1_0_0 = require("./HistoryUpload/1.0.0.js");
const match_2_0_0 = require("./HistoryUpload/2.0.0.js");

const leaderboardRequest = Joi.object({
    RatingGroup: Joi.string()
        .max(50)
        .required(),
    Position: Joi.number()
        .integer()
        .min(0)
        .required(),
});

const eloTimelineRequest = Joi.object({
    playerId: Joi.number()
        .integer()
        .required(),
    rankingGroup: Joi.string()
        .required(),
})

const lobbyBalance = Joi.object({
    playerIds: Joi.array()
        .items(Joi.number().integer())
        .max(16)
        .required(),
    randomness: Joi.number().required(),
    keepPilots: Joi.bool().required(),
    teamCount: Joi.number().integer().required(),
    teamSize: Joi.number().integer().required()
});

// Match filter
const matchFilter = Joi.object({
    playerId: Joi.number().integer().optional(),
    tagsInclude: Joi.array().min(1).max(3).items(Joi.string()).optional(),
    tagsExclude: Joi.array().min(1).max(3).items(Joi.string()).optional()
});


const matchList = Joi.object({
    page: Joi.number().integer().min(0).max(1000).required(),
    filter: matchFilter.required()
});

const shipPopularity = Joi.object({
    filter: matchFilter.required()
});

module.exports = {
    leaderboardRequest,
    eloTimelineRequest,
    lobbyBalance,
    matchFilter,
    matchList,
    shipPopularity,
    MatchSubmission: {
        "0.1.3": match_0_1_3.MATCH_SUBMISSION_SCHEMA,
        "1.0.0": match_1_0_0.MATCH_SUBMISSION_SCHEMA,
        "2.0.0": match_2_0_0.MATCH_SUBMISSION_SCHEMA
    }
}
