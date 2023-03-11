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

const LOBBY_DATA = Joi.object({
    ModVersion: Joi.string()
        .max(10)
        .required(),
    MatchId: Joi.string()
        .min(30)
        .max(50)
        .required(),
    Passworded: Joi.boolean()
        .required(),
    Moderated: Joi.boolean()
        .required(),
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

// ---------------------------
// -------- Game Data --------
// ---------------------------

const SHOT_DATA = Joi.object({
    ShotIndex: Joi.number().integer().required(),
    ShotTimestamp: Joi.number().integer().required(),
    
    Buckshots: Joi.number().integer().required(),
    
    ShooterUserId: Joi.number().integer().required(),
    TeamIndex: Joi.number().integer().required(),
    ShipId: Joi.number().integer().required(),
    ShipIndex: Joi.number().integer().required(),

    GunSlot: Joi.number().integer().required(),
    GunItemId: Joi.number().integer().required(),
    AmmoItemId: Joi.number().integer().required(),

    GunPositionArr: Joi.array().items(Joi.number()).length(3),
    GunDirectionArr: Joi.array().items(Joi.number()).length(3),
    ShipVelocity: Joi.array().items(Joi.number()).length(3),
    MuzzleVelocity: Joi.number().required(),

    TargetShipId: Joi.number().integer().required(),
    TargetPositionArr: Joi.array().items(Joi.number()).length(3),
    TargetDistance: Joi.number().required(),
    DidHit: Joi.boolean(),

    HitIndexes: Joi.array().items(Joi.number().integer()).max(20),
});

const HIT_DATA = Joi.object({
    ShotIndex: Joi.number().integer().required(),
    HitTimestamp: Joi.number().integer().required(),
    ShooterUserId: Joi.number().integer().required(),
    ShipId: Joi.number().integer().required(),
    GunSlot: Joi.number().integer().required(),
    GunItemId: Joi.number().integer().required(),
    
    TargetShipId: Joi.number().integer().required(),
    TargetComponentId: Joi.number().integer().required(),
    TargetComponentType: Joi.string(),
    TargetComponentSlot: Joi.string(),
    TargetComponentBroken: Joi.boolean(),
    
    TargetVelocity: Joi.array().items(Joi.number()).length(3),
    Position: Joi.array().items(Joi.number()).length(3),

    Damage: Joi.number().integer().required(),
    CoreHit: Joi.boolean(),
});

const GAME_DATA = Joi.object({
    GameShots: Joi.array().items(SHOT_DATA).max(200000),
    GameHits: Joi.array().items(HIT_DATA).max(200000),
});

const MATCH_SUBMISSION_SCHEMA = Joi.object({
    ModVersion: Joi.string().max(10).required(),
    MatchId: Joi.string().required(),
    LobbyData: LOBBY_DATA,
    GameData: GAME_DATA,    
});

module.exports = {
    MATCH_SUBMISSION_SCHEMA
}