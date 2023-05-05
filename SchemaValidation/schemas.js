const Joi = require('joi'); 

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

module.exports = {
    leaderboardRequest,
    eloTimelineRequest
}
