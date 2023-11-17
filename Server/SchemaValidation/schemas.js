const Joi = require('joi'); 
const { MATCH_SUBMISSION_SCHEMA } = require("./Schemas/HistorySubmission.js");

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

module.exports = {
    leaderboardRequest,
    eloTimelineRequest,
    lobbyBalance,
    MATCH_SUBMISSION_SCHEMA
}
