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

module.exports = {
    leaderboardRequest
}
