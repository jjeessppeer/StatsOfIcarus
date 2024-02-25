const Joi = require('joi'); 
const MATCH_SUBMISSION_1 = require("./Schemas/HistorySubmission_1.3.js");
const MATCH_SUBMISSION_2 = require("./Schemas/HistorySubmission_2.0.js");

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

const matchListRequest = Joi.object({
    page: Joi.number().integer().min(0).max(1000).required(),
    filter: Joi.object({
        PlayerId: Joi.number().integer().optional(),
        tagsInclude: Joi.array().min(1).max(3).items(Joi.string()).optional(),
        tagsExclude: Joi.array().min(1).max(3).items(Joi.string()).optional(),
    }).required()
});

module.exports = {
    leaderboardRequest,
    eloTimelineRequest,
    lobbyBalance,
    matchListRequest,
    MATCH_SUBMISSION_1: MATCH_SUBMISSION_1.MATCH_SUBMISSION_SCHEMA,
    MATCH_SUBMISSION_2: MATCH_SUBMISSION_2.MATCH_SUBMISSION_SCHEMA,
}
