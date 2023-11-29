const Joi = require('joi');

const PLAYER_SUBMISSION_SCHEMA = Joi.object({
    UserId: Joi.number()
        .integer()
        .required(),
    Name: Joi.string()
        .max(50)
        .required(),
    Clan: Joi.string()
        .min(0)
        .max(5)
        .required(),
    Class: Joi.number()
        .integer()
        .allow(-1, 1, 2, 4)
        .required(),
    Level: Joi.number()
        .integer()
        .min(0)
        .max(135)
        .required(),
    MatchCount: Joi.number()
        .integer(),
    MatchCountRecent: Joi.number()
        .integer(),
    Skills: Joi.array()
        .items(Joi.number().integer())
});

const SHIP_SUBMISSION_SCHEMA = Joi.object({
    ShipModel: Joi.number()
        .integer()
        .required(),
    ShipName: Joi.string()
        .min(2)
        .max(20)
        .required(),
    Team: Joi.number()
        .integer()
        .min(0)
        .max(4)
        .required(),
    ShipLoadout: Joi.array()
        .items(Joi.number().integer())
        .max(6)
        .required(),
    SlotNames: Joi.array()
        .items(Joi.string())
        .max(6)
        .required(),
    Players: Joi.array().items(PLAYER_SUBMISSION_SCHEMA, null)
});

const MATCH_SUBMISSION_SCHEMA = Joi.object({
    ModVersion: Joi.string()
        .max(10)
        .required(),
    MatchId: Joi.string()
        .min(30)
        .max(50)
        .required(),
    Passworded: Joi.boolean()
        .required(),
    // Moderated: Joi.boolean()
    //     .required(),
    MapId: Joi.number()
        .integer()
        .required(),
    MapName: Joi.string()
        .max(50)
        .required(),
    GameMode: Joi.number()
        .integer()
        .required(),
    TeamSize: Joi.number()
        .integer()
        .min(0)
        .max(4)
        .required(),
    TeamCount: Joi.number()
        .integer()
        .min(0)
        .max(4)
        .required(),
    Winner: Joi.number()
        .integer()
        .min(0)
        .max(4)
        .required(),
    MatchTime: Joi.number()
        .integer()
        .required(),
    Status: Joi.number()
        .integer(),
    Scores: Joi.array()
        .items(Joi.number().integer())
        .max(8)
        .required(),
    Ships: Joi.array().items(SHIP_SUBMISSION_SCHEMA).max(8),

});


module.exports = {
    MATCH_SUBMISSION_SCHEMA
}