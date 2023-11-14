const Joi = require('joi');

const MATCH_FILTERS_SCHEMA = Joi.array().items(
    Joi.object({
        type: Joi.string().allow('Player').required(),
        data: Joi.string().max(100).required()
    }),
    Joi.object({
        type: Joi.string().allow('PlayerId').required(),
        id: Joi.number().integer().min(-1).required()
    }),
    Joi.object({
        type: Joi.string().allow('TagsInclude', 'TagsExclude').required(),
        tags: Joi.array().items(Joi.string()).min(0).max(10)
    }),
    )


const MATCH_REQUEST_SCHEMA = Joi.object({
    page: Joi.number()
        .integer()
        .min(0)
        .max(100)
        .required(),
    filters: MATCH_FILTERS_SCHEMA
        .min(0)
        .max(10)
        .required()
});

const HISTORY_SEARCH_SCHEMA = Joi.object({
    perspective: Joi.object({
        type: Joi.string()
            .allow('Overview', 'Player', 'Ship')
            .required(),
        name: Joi.string()
            .max(100)
            .min(0)
            .required()
        })
        .required(),
    filters: MATCH_FILTERS_SCHEMA
        .min(0)
        .max(10)
        .required()
});

module.exports = {
    HISTORY_SEARCH_SCHEMA,
    MATCH_REQUEST_SCHEMA
}